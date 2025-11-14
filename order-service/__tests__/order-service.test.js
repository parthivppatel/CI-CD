import request from 'supertest';
import { jest, describe, test, expect, beforeAll, beforeEach } from '@jest/globals';

// Set test environment to prevent server from starting
process.env.NODE_ENV = 'test';

// Mock axios using ES module mocking
const mockAxios = {
  get: jest.fn(),
  patch: jest.fn()
};

// Use unstable_mockModule for ES modules (must be before any imports)
jest.unstable_mockModule('axios', () => ({
  default: mockAxios
}));

describe('Order Service API Tests', () => {
  let app;

  beforeAll(async () => {
    // Mock must be set up before importing the app
    // Import the app module (server won't start in test mode)
    const module = await import('../index.js');
    app = module.default;
  });

  beforeEach(() => {
    // Reset axios mocks
    mockAxios.get.mockClear();
    mockAxios.patch.mockClear();
  });

  describe('Health Check', () => {
    test('GET /health should return 200 and OK status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('service', 'order-service');
    });
  });

  describe('GET /products', () => {
    test('should return all products', async () => {
      const response = await request(app)
        .get('/products')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /products/:id', () => {
    test('should return a specific product', async () => {
      const response = await request(app)
        .get('/products/1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', 1);
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('price');
    });

    test('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/products/999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /orders', () => {
    test('should create a new order', async () => {
      // Mock user service response
      mockAxios.get.mockResolvedValue({
        data: {
          data: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            balance: 1000
          }
        }
      });

      mockAxios.patch.mockResolvedValue({
        data: { success: true }
      });

      const newOrder = {
        productId: 1,
        quantity: 1,
        userId: 1
      };

      const response = await request(app)
        .post('/orders')
        .send(newOrder)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('status', 'completed');
    });

    test('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/orders')
        .send({ productId: 1 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 404 if user not found', async () => {
      mockAxios.get.mockRejectedValue({
        response: { status: 404 }
      });

      const response = await request(app)
        .post('/orders')
        .send({ productId: 1, quantity: 1, userId: 999 })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /orders', () => {
    test('should return all orders', async () => {
      const response = await request(app)
        .get('/orders')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});

