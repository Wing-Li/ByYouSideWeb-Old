import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupApp } from './setup-app';
import { setupSwagger } from './setup-swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupApp(app);
  setupSwagger(app);

  const port = process.env.PORT;
  if (!port) {
    throw new Error('PORT 未配置，无法启动服务');
  }
  await app.listen(port);
}
void bootstrap();
