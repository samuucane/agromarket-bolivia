import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Marketplace (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(() => app.close());

  it('GET /api/v1/marketplace/listings should return paginated list', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/marketplace/listings')
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('GET /api/v1/marketplace/categories should return categories', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/marketplace/categories')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('GET /api/v1/marketplace/prices should return price list', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/marketplace/prices')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('POST /api/v1/marketplace/listings should require auth', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/marketplace/listings')
      .send({ title: 'Test', pricePerUnit: 10 })
      .expect(401);
  });
});
