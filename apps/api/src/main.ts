import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './modules/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.set('trust proxy', 1);
  app.use(cookieParser());
  app.enableCors({ origin: true, credentials: true });
  await app.listen(4000);
  console.log('API running on port 4000');
}
bootstrap();
