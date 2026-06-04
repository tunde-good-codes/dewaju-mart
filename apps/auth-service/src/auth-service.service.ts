import { KAFKA_SERVICE } from "@app/kafka/kafka.module";
import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  InternalServerErrorException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";
import { AuthProvider, User } from "./entities/User";
import { Repository } from "typeorm";
import { CreateUserDto, VerifyOtpDto } from "./dtos/create-user-dto";
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import * as bcrypt from "bcrypt";
import { randomBytes, randomInt } from "crypto";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { KAFKA_TOPICS } from "@app/kafka";
import { ForgotPasswordCache, GoogleUserData } from "./types";
import { LoginDto } from "./dtos/login.dto";
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from "./dtos/password-reset.dto";
import { UpdateUserDto } from "./dtos/update-user.dto";
import {
  MEDIA_FOLDERS,
  UploadSinglePayload,
  UploadSingleResult,
} from "apps/media-service/src/media.types";
import { v4 as uuid } from "uuid";
import { firstValueFrom } from "rxjs";

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
    this.kafkaClient.subscribeToResponseOf(
      KAFKA_TOPICS.UPLOAD_SINGLE_USER_IMAGE
    );

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

    const otp = randomInt(100000, 999999).toString();

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
      isVerified: true,
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
      newUser.role,
      newUser.tokenVersion
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

  async loginUser(dto: LoginDto) {
    const isRegisteredUser = await this.userRepository.findOne({
      where: {
        email: dto.email,
      },
    });

    if (!isRegisteredUser) {
      throw new UnauthorizedException(
        "The provided email or password is incorrect. Please try again."
      );
    }

    if (!isRegisteredUser.isVerified) {
      throw new ForbiddenException(
        "Please verify your email before logging in. Check your inbox for the OTP."
      );
    }
    let isPassword;
    if (isRegisteredUser.password) {
      isPassword = await bcrypt.compare(
        dto.password,
        isRegisteredUser?.password
      );
    }

    if (!isPassword) {
      throw new UnauthorizedException(
        "The provided email or password is incorrect. Please try again."
      );
    }

    const { accessToken, refreshToken } = await this.generateTokens(
      isRegisteredUser.id,
      isRegisteredUser.email,
      isRegisteredUser.role,
      isRegisteredUser.tokenVersion
    );

    await this.updateUserRefreshToken(isRegisteredUser.id, refreshToken);
    const { password, ...safeUser } = isRegisteredUser;
    return {
      user: safeUser,
      accessToken,
      refreshToken,
    };
  }

  async getLoggedInUser(id: string) {
    const user = await this.userRepository.findOne({
      where: {
        id,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
        role: true,
        isAdmin: true,
        refreshToken: true,
      },
    });

    if (!user)
      throw new ForbiddenException("Authenticate before using this endpoint");
    return {
      user,
      message: "user fetched!",
    };
  }

  async forgotPasswordToken(dto: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      return { message: "If this email exists, an OTP has been sent to it" };
    }

    if (user.provider === AuthProvider.GOOGLE) {
      throw new BadRequestException(
        "This user registered with google and cannot change password"
      );
    }

    const redisKey = `forget-password:${dto.email}`;

    const otp = randomInt(100000, 999999).toString();
    const { email, firstName } = user;
    const redisData = {
      otp,
      email,
      firstName,
    };
    try {
      await this.cacheManager.set(redisKey, redisData, 300000);
    } catch (error) {
      throw new BadRequestException(`redis failed ${redisKey} to set`);
    }

    this.kafkaClient.emit(KAFKA_TOPICS.FORGOT_PASSWORD_OTP, redisData);

    return {
      message: "If this email exists, an otp has been sent to it",
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const redisKey = `forget-password:${dto.email}`;

    const redisData =
      await this.cacheManager.get<ForgotPasswordCache>(redisKey);

    if (!redisData) {
      throw new NotFoundException("otp not found or expired ");
    }
    const { otp, email, firstName } = redisData;

    if (dto.otp !== otp) {
      throw new ConflictException("Otp Mismatched or expired");
    }

    const user = await this.userRepository.findOne({
      where: {
        email,
      },
    });

    if (!user) {
      throw new NotFoundException("no user found found");
    }

    const hashPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.update(user.id, {
      password: hashPassword,
      refreshToken: null,
    });

    await this.cacheManager.del(redisKey);
    return {
      message: "password reset successfully",
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new ForbiddenException(
        "you need to be authenticated to change password"
      );
    }

    if (!user.password) {
      throw new BadRequestException("Password required to continue");
    }

    if (user.provider === AuthProvider.GOOGLE) {
      throw new BadRequestException(
        "This user registered with google and cannot change password"
      );
    }
    const isPasswordMatch = await bcrypt.compare(
      dto.currentPassword,
      user.password
    );
    if (!isPasswordMatch) {
      throw new BadRequestException(
        "Invalid password! Enter the right password"
      );
    }

    const isSamePassword = await bcrypt.compare(dto.newPassword, user.password);

    if (isSamePassword) {
      throw new ConflictException(
        "Same password as previous password. Enter a new password"
      );
    }
    const hashPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.update(user.id, {
      password: hashPassword,
      refreshToken: null,
    });


    return { message: 'Password changed successfully' };
  }
  getHello(): string {
    return "Hello World!";
  }

  async validateGoogleUser(googleUserData: GoogleUserData) {
    let user = await this.userRepository.findOne({
      where: {
        email: googleUserData.email,
        provider: AuthProvider.GOOGLE,
      },
    });

    // if no user, create user google user
    if (!user) {
      user = this.userRepository.create({
        email: googleUserData.email,
        firstName: googleUserData.firstName,
        lastName: googleUserData.lastName,
        imageUrl: googleUserData.imageUrl,
        googleId: googleUserData.googleId,
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

      if (
        googleUserData.imageUrl &&
        user.imageUrl !== googleUserData.imageUrl
      ) {
        await this.userRepository.update(user.id, {
          imageUrl: googleUserData.imageUrl,
        });
        user.imageUrl = googleUserData.imageUrl;
      }
    }

    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.tokenVersion
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
    const users = await this.userRepository.find({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
        role: true,
        isAdmin: true,
      },
    });
    if (users.length === 0) {
      throw new NotFoundException("No user for this system yet");
    }

    return {
      users,
      total: users.length,
    };
  }
  private async updateUserRefreshToken(userId: string, refreshToken: string) {
    const refreshTokenHashed = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.update(
      { id: userId },
      { refreshToken: refreshTokenHashed }
    );
  }

  async refreshToken(incomingRefreshToken: string) {
    let payload: { sub: string; email: string; role: string };

    try {
      payload = await this.jwtService.verifyAsync(incomingRefreshToken, {
        secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException(
        "Refresh token is invalid or has expired"
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException("Session expired. Please log in again.");
    }

    const isMatch = await bcrypt.compare(
      incomingRefreshToken,
      user.refreshToken
    );
    if (!isMatch) {
      await this.userRepository.update(user.id, { refreshToken: null });
      throw new UnauthorizedException(
        "Refresh token reuse detected. All sessions have been invalidated."
      );
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.generateTokens(
        user.id,
        user.email,
        user.role,
        user.tokenVersion
      );

    await this.updateUserRefreshToken(user.id, newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async resendOtp(email: string, type: "registration" | "forgot-password") {
    const rateLimitKey = `resend-limit:${type}:${email}`;
    const attempts = (await this.cacheManager.get<number>(rateLimitKey)) ?? 0;

    if (attempts >= 3) {
      throw new BadRequestException(
        "Too many OTP requests. Please wait 10 minutes before trying again."
      );
    }

    await this.cacheManager.set(rateLimitKey, attempts + 1, 600000);

    if (type === "registration") {
      const user = await this.userRepository.findOne({ where: { email } });
      if (user?.isVerified) {
        throw new ConflictException(
          "This email is already verified. Please log in."
        );
      }

      const redisKey = `user-reg:${email}`;
      const existingData = await this.cacheManager.get<{
        otp: string;
        userData: CreateUserDto;
      }>(redisKey);

      if (!existingData) {
        throw new NotFoundException(
          "Registration session not found. Please register again."
        );
      }

      const otp = randomInt(100000, 999999).toString();
      await this.cacheManager.set(redisKey, { ...existingData, otp }, 300000);

      this.kafkaClient.emit(KAFKA_TOPICS.REGISTER_USER_OTP, {
        email,
        otp,
      });
    } else {
      const redisKey = `forget-password:${email}`;
      const existingData =
        await this.cacheManager.get<ForgotPasswordCache>(redisKey);

      if (!existingData) {
        throw new NotFoundException(
          "Password reset session not found. Please request a new OTP."
        );
      }

      const otp = randomInt(100000, 999999).toString();
      await this.cacheManager.set(redisKey, { ...existingData, otp }, 300000);

      this.kafkaClient.emit(KAFKA_TOPICS.FORGOT_PASSWORD_OTP, {
        email,
        otp,
        firstName: existingData.firstName,
      });
    }

    return { message: "A fresh OTP has been sent to your email" };
  }

  async logout(userId: string) {
    // const decoded = this.jwtService.decode(token) as { exp: number };
    // const now = Math.floor(Date.now() / 1000);
    // const ttl = (decoded.exp - now) * 1000;

    // if (ttl > 0) {
    //   await this.cacheManager.set(`blacklist:${jti}`, true, ttl);
    // }

    await this.userRepository.increment({ id: userId }, "tokenVersion", 1);
    await this.userRepository.update(userId, { refreshToken: null });

    return { message: "Logged out successfully" };
  }

  async sendVerificationOtp(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(
        "An otp sent. If a user with this email exit"
      );
    }

    if (user.isVerified) {
      throw new ConflictException("user has been verified already!");
    }
    const otp = randomInt(100000, 999999).toString();
    const redisKey = `verify-otp:${email}`;
    await this.cacheManager.set(redisKey, otp, 300000);

    const eventData = {
      name: user.firstName,
      email: user.email,
      otp,
    };
    this.kafkaClient.emit(KAFKA_TOPICS.VERIFY_EMAIL_OTP, eventData);
    return `a verification otp has been sent to ${user.email}`;
  }
  async verifyUserEmail(dto: { email: string; otp: string }) {
    const user = await this.userRepository.findOne({
      where: {
        email: dto.email,
      },
    });

    if (!user || user.isVerified) {
      throw new BadRequestException(
        "This account has been verified or doesn't exist"
      );
    }
    const redisKey = `verify-otp:${dto.email}`;
    const otp = await this.cacheManager.get(redisKey);
    if (!otp) {
      throw new NotFoundException("otp not found or expired");
    }
    if (dto.otp !== otp) {
      throw new ConflictException("otp mismatched");
    }

    await this.userRepository.update(user.id, {
      isVerified: true,
    });

    await this.cacheManager.del(redisKey);
    return `email verification process completed`;
  }

  async logoutAll(userId: string) {
    // const decoded = this.jwtService.decode(token) as { exp: number };
    // const now = Math.floor(Date.now() / 1000);
    // const ttl = (decoded.exp - now) * 1000;

    // if (ttl > 0) {
    //   await this.cacheManager.set(`blacklist:${jti}`, true, ttl);
    // }

    await this.userRepository.increment({ id: userId }, "tokenVersion", 1);
    await this.userRepository.update(userId, { refreshToken: null });

    return { message: "Logged out from all devices successfully" };
  }

  async updateUserProfile(userId: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(userId);

    if (user.provider === AuthProvider.GOOGLE) {
      throw new ForbiddenException(
        "Google accounts cannot update profile data here. Manage via Google."
      );
    }

    const updated = this.userRepository.merge(user, dto);
    return  await  this.userRepository.save(updated);
  }

  async uploadUserImage(
    userId: string,
    file: Express.Multer.File
  ): Promise<User> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.imagePublicId")
      .where("user.id = :userId", { userId })
      .getOne();

    if (!user) throw new NotFoundException("User not found");

    if (user.provider === AuthProvider.GOOGLE) {
      throw new ForbiddenException(
        "Google accounts cannot upload a custom avatar."
      );
    }

    const correlationId = uuid();

    const payload: UploadSinglePayload = {
      buffer: file.buffer.toString("base64"),
      mimetype: file.mimetype,
      originalName: file.originalname,
      folder: MEDIA_FOLDERS.USER_AVATARS,
      correlationId,
    };

    this.logger.log(
      `Sending avatar upload to media-service [correlationId: ${correlationId}]`
    );

    let result: UploadSingleResult;

    try {
      result = await firstValueFrom(
        this.kafkaClient.send<UploadSingleResult>(
          KAFKA_TOPICS.UPLOAD_SINGLE_USER_IMAGE,
          payload
        )
      );
    } catch (err) {
      this.logger.error("Media service did not respond in time", err);
      throw new BadRequestException(
        "Image upload timed out. Please try again."
      );
    }

    if (!result.success) {
      throw new BadRequestException(`Image upload failed: ${result.error}`);
    }

    if (user.imagePublicId) {
      this.kafkaClient.emit(KAFKA_TOPICS.MEDIA_DELETE, {
        publicIds: [user.imagePublicId],
      });
    }

    user.imageUrl = result.url;
    user.imagePublicId = result.publicId;

    return this.userRepository.save(user);
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  private  findByIdOrFail = this.findById
  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    tokenVersion: number
  ) {
    const payload = { sub: userId, email, role, tokenVersion };
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
          expiresIn: this.configService.getOrThrow<string>(
            "REFRESH_EXPIRES_IN"
          ) as string as any,
        }
      ),
    ]);

    return { accessToken, refreshToken };
  }
}
