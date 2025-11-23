import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { TestModule } from '../../test/test.module';

describe('Investments (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule], // Use test module instead of AppModule
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    
    await app.init();

    // Remove dataSource.synchronize(true) - TestModule handles this
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register a user and get JWT token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        fullName: 'Test User',
        email: 'test@example.com',
        birthDate: '1990-01-01',
        password: 'password123',
      })
      .expect(201);

    jwtToken = response.body.access_token;
    expect(jwtToken).toBeDefined();
  });


  it('should create an opportunity', async () => {
    const response = await request(app.getHttpServer())
      .post('/opportunities')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        name: 'Test Investment Opportunity',
        totalAmount: 100000,
        details: 'A great investment opportunity for testing',
      })
      .expect(201);

    expect(response.body.id).toBeDefined();
  });

  it('should create an investment successfully', async () => {
    const response = await request(app.getHttpServer())
      .post('/invest')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        opportunityId: 1,
        amount: 500,
      })
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.investmentAmount).toBe(500);
    expect(response.body.status).toBe('completed');
    expect(parseFloat(response.body.balanceBefore)).toBe(1000); // Initial balance
    expect(parseFloat(response.body.balanceAfter)).toBe(500);   // After investment
  });

  it('should get user balance', async () => {
    const response = await request(app.getHttpServer())
      .get('/invest/balance')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(parseFloat(response.body.balance)).toBe(500);
    expect(parseFloat(response.body.totalInvested)).toBe(500);
  });

  it('should list user investments', async () => {
    const response = await request(app.getHttpServer())
      .get('/invest')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(parseFloat(response.body[0].investmentAmount)).toBe(500);
  });

  it('should reject investment with insufficient balance', async () => {
    const response = await request(app.getHttpServer())
      .post('/invest')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        opportunityId: 1,
        amount: 600, // More than remaining balance
      })
      .expect(400);

    expect(response.body.message).toContain('Insufficient balance');
  });
});