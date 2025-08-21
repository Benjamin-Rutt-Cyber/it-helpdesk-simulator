import request from 'supertest';
import app from '../app';

describe('API Health Checks', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect('Content-Type', /json/);
    
    // Can be 200 (healthy) or 503 (unhealthy due to missing DB config)
    expect([200, 503]).toContain(response.status);
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('service', 'IT Helpdesk Simulator API');
    expect(response.body).toHaveProperty('database');
  });

  it('should return database health status', async () => {
    const response = await request(app)
      .get('/health/database')
      .expect('Content-Type', /json/);
    
    // Can be 200 (healthy) or 503 (unhealthy due to missing DB config)
    expect([200, 503]).toContain(response.status);
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should return API message on root endpoint', async () => {
    const response = await request(app)
      .get('/')
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'IT Helpdesk Simulator API');
    expect(response.body).toHaveProperty('version', '1.0.0');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should return 404 for non-existent routes', async () => {
    const response = await request(app)
      .get('/non-existent')
      .expect('Content-Type', /json/)
      .expect(404);
    
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
  });
});