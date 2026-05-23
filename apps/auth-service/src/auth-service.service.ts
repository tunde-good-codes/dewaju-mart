import { KAFKA_SERVICE } from "@app/kafka/kafka.module";
import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  InternalServerErrorException,
} from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";
import { AuthProvider, User } from "./entities/User";
import { Repository } from "typeorm";
import { CreateUserDto, VerifyOtpDto } from "./dtos/create-user-dto";
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { KAFKA_TOPICS } from "@app/kafka";
import { GoogleUserData } from "./types";

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger("AuthService");

  constructor(
    @Inject(KAFKA_SERVICE)
    private readonly kafkaClient: ClientKafka,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
    this.logger.log("Auth service Kafka broker connection bound successfully");
  }

  async registerUser(createUserDto: CreateUserDto) {
    const existingEmail = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingEmail) {
      throw new ConflictException("A User with this email already exists");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const redisKey = `user-reg:${createUserDto.email}`;

    const registrationPayload = {
      otp,
      userData: createUserDto,
    };

    try {
      await this.cacheManager.set(redisKey, registrationPayload, 300000);
    } catch (cacheError) {
      this.logger.error(`Redis cache write failure: ${cacheError.message}`);
      throw new InternalServerErrorException(
        "Caching layer failed to persist state."
      );
    }

    this.kafkaClient.emit(KAFKA_TOPICS.REGISTER_USER_OTP, {
      email: registrationPayload.userData.email,
      otp: registrationPayload.otp,
    });
    return { message: "Verification OTP sent successfully!" };
  }

  async verifyOtpRegisterUser(verifyOtpDto: VerifyOtpDto) {
    const redisKey = `user-reg:${verifyOtpDto.email}`;
    const registerUserData = await this.cacheManager.get<{
      otp: string;
      userData: CreateUserDto;
    }>(redisKey);

    const emailCheck = await this.userRepository.findOne({
      where: { email: verifyOtpDto.email },
    });

    if (emailCheck) {
      throw new ConflictException("A user with this email already exists");
    }

    if (!registerUserData?.otp) {
      throw new NotFoundException("OTP not found or has expired");
    }

    if (registerUserData.otp !== verifyOtpDto.otp) {
      throw new ConflictException("OTP mismatched or invalid!");
    }

    const { firstName, email, lastName, password } = registerUserData.userData;

    let hashPassword;
    if (password) {
      hashPassword = await bcrypt.hash(password, 10);
    }

    const newUser = this.userRepository.create({
      firstName,
      email,
      lastName,
      password: hashPassword,
    });

    await this.userRepository.save(newUser);
    await this.cacheManager.del(redisKey);

    this.kafkaClient.emit(KAFKA_TOPICS.USER_CREATED, {
      userId: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
    });

    const { accessToken, refreshToken } = await this.generateTokens(
      newUser.id,
      newUser.email,
      newUser.role
    );

    await this.updateUserRefreshToken(newUser.id, refreshToken);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  getHello(): string {
    return "Hello World!";
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const refreshTokenKey = randomBytes(16).toString("hex");

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.getOrThrow("JWT_EXPIRES_IN"),

        secret: this.configService.getOrThrow<string>("JWT_SECRET"),
      }),

      this.jwtService.signAsync(
        { ...payload, refreshTokenKey },
        {
          secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
        }
      ),
    ]);

    return { accessToken, refreshToken };
  }

  async validateGoogleUser(googleUserData: GoogleUserData) {
    let user = await this.userRepository.findOne({
      where: {
        email: googleUserData.email,
      },
    });

    // if no user, create user google user
    if (!user) {
      user = this.userRepository.create({
        email: googleUserData.email,
        firstName: googleUserData.firstName,
        lastName: googleUserData.lastName,
        imageUrl: googleUserData.imageUrl,
        provider: AuthProvider.GOOGLE,
      });

      await this.userRepository.save(user);

      this.kafkaClient.emit(KAFKA_TOPICS.GOOGLE_USER_CREATED, {
        id: user.id,
        email: user.email,
        lastName: user.lastName,
        firstName: user.firstName,
      });
    } else {
      // if there is user, update the user imageUrl

      if (googleUserData.imageUrl && user.imageUrl !== googleUserData.imageUrl)
        user.imageUrl = googleUserData.imageUrl;

      await this.userRepository.save(user);
    }

    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
      user.role
    );
    await this.updateUserRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        lastName: user.lastName,
        firstName: user.firstName,
        imageUrl: user.imageUrl,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async getUsers() {
    const users = await this.userRepository.find({});
    if (!users) {
      throw new NotFoundException("No user for this system yet");
    }

    return {
      users,
      total: users.length,
    };
  }
  private async updateUserRefreshToken(userId: string, refreshToken: string) {
    await this.userRepository.update({ id: userId }, { refreshToken });
  }
}
