import request from 'supertest';
import { describe, test, expect, beforeAll } from '@jest/globals';

// Set test environment to prevent server from starting
process.env.NODE_ENV = 'test';

describe('User Service API Tests', () => {
  let app;

  beforeAll(async () => {
    // Import the app module (server won't start in test mode)
    const module = await import('../index.js');
    app = module.default;
  });

  describe('Health Check', () => {
    test('GET /health should return 200 and OK status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('service', 'user-service');
    });
  });

  describe('GET /users', () => {
    test('should return all users', async () => {
      const response = await request(app)
        .get('/users')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('count');
    });
  });

  describe('GET /users/:id', () => {
    test('should return a specific user', async () => {
      const response = await request(app)
        .get('/users/1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', 1);
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('email');
    });

    test('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/users/999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 400 for invalid user ID', async () => {
      const response = await request(app)
        .get('/users/invalid')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /users', () => {
    test('should create a new user', async () => {
      const newUser = {
        name: 'Test User',
        email: 'test@example.com',
        balance: 100
      };

      const response = await request(app)
        .post('/users')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('name', newUser.name);
      expect(response.body.data).toHaveProperty('email', newUser.email);
    });

    test('should return 400 if name or email is missing', async () => {
      const response = await request(app)
        .post('/users')
        .send({ name: 'Test' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PATCH /users/:id/balance', () => {
    test('should add balance to user', async () => {
      const response = await request(app)
        .patch('/users/1/balance')
        .send({ amount: 50, operation: 'add' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('balance');
    });

    test('should return 400 for invalid operation', async () => {
      const response = await request(app)
        .patch('/users/1/balance')
        .send({ amount: 50, operation: 'invalid' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /users/:id', () => {
    test('should delete a user', async () => {
      // First create a user to delete
      const createResponse = await request(app)
        .post('/users')
        .send({ name: 'Delete Test', email: 'delete@example.com' })
        .expect(201);

      const userId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/users/${userId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });
});

