import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { User } from "../entities/User";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { ExtractJwt, Strategy } from "passport-jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>("JWT_SECRET"),
      ignoreExpiration: false,
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    role: string;
    tokenVersion: number;
  }) {
    // const blacklistKey = `blacklist:${payload.jti}`;

    // const isBlacklisted = await this.cacheManager.get(blacklistKey);
    // if (isBlacklisted) {
    //   throw new UnauthorizedException(
    //     "Token has been invalidated. Please log in again."
    //   );
    // }

    const user = await this.userRepository.findOne({
      where: {
        id: payload.sub,
      },
    });

    if (!user) {
      throw new UnauthorizedException("User no longer exist");
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException("Session Expired. Please log in");
    }
    return user;
  }
}
