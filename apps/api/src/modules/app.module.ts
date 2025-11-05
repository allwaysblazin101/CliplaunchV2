import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';

@Module({
  controllers: [HealthController, VideosController],
  providers: [VideosService],
})
export class AppModule {}
