import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import {JwtService} from '@nestjs/jwt'
import { User } from "./types/auth.types.js";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import { Model } from "mongoose";
import { Session } from "./schemas/session.schema.js";
import { InjectModel } from "@nestjs/mongoose";
import { RedisService } from "./redis/redis.service.js";

// a session lives as long as the refresh token
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const sessionKey = (userId: string) => `session:${userId}`;


@Injectable()
export class AuthService{
   constructor(private readonly jwtService:JwtService,
    private readonly configService:ConfigService,
    private readonly redisService:RedisService,
    @InjectModel(Session.name) private readonly sessionModel:Model<Session>){}

 async validateToken(token: string) {
  try {
    const decoded = await this.jwtService.verifyAsync(token, {
      secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
    });

    // the user's current session id lives in Redis; a token from an older or logged-out session does not match
    const currentSession = await this.redisService.get(sessionKey(decoded.sub));
    if (currentSession !== decoded.sid) {
      return { valid: false };
    }

    return {
      valid: true,
      user_id: decoded.sub,
      name: decoded.name,
    };
  } catch (error) {
    return { valid: false };
  }
}

    async generateToken(user:User){
      // single session per user: revoke any previously active session
      await this.sessionModel.updateMany(
        { userId: user._id, revoked: false },
        { $set: { revoked: true } },
      );

      const sessionId = randomUUID();
      const payload = { sub:user._id, name:user.name, sid:sessionId };

      const access_token=  await this.jwtService.signAsync(payload,{
            expiresIn:this.configService.get('jwt.accessExpiresIn'),
            secret:this.configService.get('jwt.accessSecret')
        })

      const refresh_token=  await this.jwtService.signAsync(payload,{
            expiresIn:this.configService.get('jwt.refreshExpiresIn'),
            secret:this.configService.get('jwt.refreshSecret')
        })

      await this.sessionModel.create({
            userId:user._id,
            sessionId,
            revoked:false,
            expiredAt:new Date(Date.now()+ SESSION_TTL_SECONDS*1000)
        })

      // replaces the previous session id, so the old tokens stop working at once
      await this.redisService.set(sessionKey(user._id), sessionId, SESSION_TTL_SECONDS)
      return {access_token,refresh_token}
    }

 async logout(userId: string) {
  await this.redisService.del(sessionKey(userId));
  await this.sessionModel.updateMany(
    { userId, revoked: false },
    { $set: { revoked: true } },
  );

  return {
    message: 'Logged out successfully',
  };
}

  async refreshToken(refreshToken:string){
  let decoded
  try{
    decoded=await this.jwtService.verifyAsync(refreshToken,{secret:this.configService.get('jwt.refreshSecret')})
  }catch{
    throw new UnauthorizedException('Invalid refresh token')
  }

  const session=  await this.sessionModel.findOne({sessionId:decoded.sid, revoked:false, expiredAt: { $gt: new Date() }})
  if(!session){
    throw new UnauthorizedException('No session found or session expired')
  }

  return this.generateToken({_id:decoded.sub,name:decoded.name})
  }
}
