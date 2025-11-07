import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { HealthController } from './health.controller';
import { VideosController } from './videos.controller';
import { AuthController } from './auth.controller';

import { VideosService } from './videos.service';
import { JwtCookieGuard } from './auth.guard';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev_secret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [HealthController, VideosController, AuthController],
  providers: [PrismaService, VideosService, JwtCookieGuard],
})
export class AppModule {}
