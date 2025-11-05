import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const port = process.env.PORT || 4000;
  await app.listen(Number(port), '0.0.0.0');
  console.log('API running on', port);
}
bootstrap();
