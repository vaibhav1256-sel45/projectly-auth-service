import { Module } from '@nestjs/common';
import { AuthModule } from './auth.module.js';

@Module({
  imports: [
    AuthModule,
    
  ],
})
export class AppModule {}
