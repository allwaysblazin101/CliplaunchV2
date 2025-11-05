import { Module } from '@nestjs/common';
import { HealthController } from '../health.controller';
import { VideosController } from '../videos/videos.controller';

@Module({
  imports: [],
  controllers: [HealthController, VideosController],
  providers: [],
})
export class AppModule {}
