import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

type HttpMethod = 'get' | 'post' | 'patch' | 'put' | 'delete';

type OpenApiExample = {
  path: string;
  method: HttpMethod;
  request?: {
    name: string;
    summary: string;
    value: unknown;
  };
  responses: Array<{
    status: string;
    name: string;
    summary: string;
    value: unknown;
  }>;
};

type OpenApiExamplesFile = {
  examples?: OpenApiExample[];
};

type MediaTypeObject = {
  examples?: Record<string, { summary: string; value: unknown }>;
};

type RequestBodyObject = {
  content?: Record<string, MediaTypeObject>;
};

type ResponseObject = {
  description?: string;
  content?: Record<string, MediaTypeObject>;
};

type OperationObjectWithExamples = {
  requestBody?: RequestBodyObject;
  responses?: Record<string, ResponseObject>;
};

const EXAMPLES_PATH = join('docs', 'swagger', 'openapi-examples.json');
const JSON_MEDIA_TYPE = 'application/json';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('伴你左右 API')
    .setDescription(
      '伴你左右 App 迁移后的 Node.js 后端接口文档。当前文档以实际 NestJS 接口、DTO 装饰器和真实接口示例捕获文件生成。',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  applyCapturedExamples(document);
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/docs-json',
    customSiteTitle: '伴你左右 API 文档',
  });
}

function applyCapturedExamples(document: OpenAPIObject): void {
  const examplesFile = readExamplesFile();
  if (!examplesFile.examples) {
    return;
  }

  for (const example of examplesFile.examples) {
    const operation = document.paths[example.path]?.[example.method] as
      | OperationObjectWithExamples
      | undefined;
    if (!operation) {
      continue;
    }

    if (example.request) {
      const requestMediaType = getOrCreateRequestMediaType(operation);
      requestMediaType.examples = {
        ...(requestMediaType.examples ?? {}),
        [example.request.name]: {
          summary: example.request.summary,
          value: example.request.value,
        },
      };
    }

    for (const responseExample of example.responses) {
      const responseMediaType = getOrCreateResponseMediaType(
        operation,
        responseExample.status,
      );
      responseMediaType.examples = {
        ...(responseMediaType.examples ?? {}),
        [responseExample.name]: {
          summary: responseExample.summary,
          value: responseExample.value,
        },
      };
    }
  }
}

function readExamplesFile(): OpenApiExamplesFile {
  if (!existsSync(EXAMPLES_PATH)) {
    return {};
  }

  try {
    return JSON.parse(
      readFileSync(EXAMPLES_PATH, 'utf8'),
    ) as OpenApiExamplesFile;
  } catch {
    return {};
  }
}

function getOrCreateRequestMediaType(
  operation: OperationObjectWithExamples,
): MediaTypeObject {
  operation.requestBody ??= {};
  operation.requestBody.content ??= {};
  operation.requestBody.content[JSON_MEDIA_TYPE] ??= {};
  return operation.requestBody.content[JSON_MEDIA_TYPE];
}

function getOrCreateResponseMediaType(
  operation: OperationObjectWithExamples,
  status: string,
): MediaTypeObject {
  operation.responses ??= {};
  operation.responses[status] ??= {};
  operation.responses[status].description ??= '真实接口响应示例。';
  operation.responses[status].content ??= {};
  operation.responses[status].content[JSON_MEDIA_TYPE] ??= {};
  return operation.responses[status].content[JSON_MEDIA_TYPE];
}
