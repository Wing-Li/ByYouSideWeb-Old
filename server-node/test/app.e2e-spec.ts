import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { Response } from 'supertest';
import { AppModule } from './../src/app.module';
import { setupApp } from './../src/setup-app';
import { setupSwagger } from './../src/setup-swagger';

describe('HealthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    setupSwagger(app);
    await app.init();
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((response: Response) => {
        const body = response.body as {
          code: unknown;
          message: unknown;
          data: {
            status: unknown;
            service: unknown;
            timestamp: unknown;
          };
        };

        expect(body).toMatchObject({
          code: 200,
          message: 'success',
          data: {
            status: 'ok',
            service: 'byyouside-api',
          },
        });
        expect(typeof body.data.timestamp).toBe('string');
      });
  });

  it('/api/docs-json (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200)
      .expect((response: Response) => {
        const body = response.body as {
          info: { title: unknown; version: unknown };
          paths: Record<string, unknown>;
        };

        expect(body.info.title).toBe('ByYouSide API');
        expect(body.info.version).toBe('1.0.0');
        expect(body.paths).toHaveProperty('/api/v1/health');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
