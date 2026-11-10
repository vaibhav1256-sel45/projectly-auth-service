import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { ResponseInterceptor } from './Interceptors/response.interceptors.js';
import { ErrorInterceptor } from './Interceptors/error.interceptors.js';
import { AuthService } from './auth.service.js';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration.js';
import { RedisModule } from './redis/redis.module.js';
import { AuthController } from './auth.controller.js';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {MongooseModule} from '@nestjs/mongoose'
import { Session, SessionSchema } from './schemas/session.schema.js';
@Module({
  imports: [
    LoggerModule.forRoot({
        pinoHttp:{
            level:'info',
            transport: {
            target: 'pino-pretty',
            options: {
            colorize: true,
          },
        },
        }
    }),
    JwtModule.register({}),
    RedisModule,
     ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
        inject:[ConfigService],
        useFactory:(configService:ConfigService)=>({
           uri: configService.getOrThrow<string>('MONGO_URI'),
        })
    }),
      MongooseModule.forFeature([
      {
        name: Session.name,
        schema: SessionSchema,
      },
    ]),
  ],
  controllers:[AuthController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorInterceptor,
    },
    AuthService
  ],
})
export class AuthModule {}
