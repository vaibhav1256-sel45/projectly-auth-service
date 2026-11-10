import { Controller } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { GrpcMethod, RpcException } from '@nestjs/microservices';
@Controller('auth')
export class AuthController{
    constructor(private readonly authService: AuthService) {}


  @GrpcMethod('AuthService', 'GenerateToken')
  async generateToken(data:any) {
    const result = await this.authService.generateToken(data);
    return {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
    };
  }

    @GrpcMethod('AuthService', 'ValidateToken')
  validateToken(data: { access_token?: string }) {
     const access_token = data.access_token;
     if (!access_token) {
       throw new RpcException('Access token is missing');
     }

     return this.authService.validateToken(access_token);
  }

  @GrpcMethod('AuthService', 'Logout')
  async logout(data: { user_id: string }) {
    return this.authService.logout(data.user_id);
  }

//   @GrpcMethod('AuthService', 'RefreshToken')
  async refreshToken(data: { refresh_token: string }) {
    return this.authService.refreshToken(data.refresh_token);
  }

}
