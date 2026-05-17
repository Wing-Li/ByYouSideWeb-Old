import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('伴你左右 API')
    .setDescription(
      '伴你左右 App 迁移后的 Node.js 后端接口文档。当前文档以实际 NestJS 接口和 DTO 装饰器自动生成。',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/docs-json',
    customSiteTitle: '伴你左右 API 文档',
  });
}
