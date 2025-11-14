import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { metricsMiddleware, ordersTotal, orderValue, register } from './metrics.js';

const app = express();
const PORT = process.env.PORT || 8002;

// Enable CORS for all routes
app.use(cors());

// Prometheus metrics middleware (must be before routes)
app.use(metricsMiddleware);

// Use Kubernetes DNS for service discovery
// In Kubernetes, services are accessible via: http://service-name.namespace.svc.cluster.local
// For default namespace: http://service-name:port
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:8003';

// Simple in-memory product catalog
const products = [
  { id: 1, name: 'Laptop', price: 999.99, stock: 10, category: 'Electronics' },
  { id: 2, name: 'Smartphone', price: 699.99, stock: 15, category: 'Electronics' },
  { id: 3, name: 'Headphones', price: 149.99, stock: 25, category: 'Electronics' },
  { id: 4, name: 'Book', price: 19.99, stock: 50, category: 'Books' },
  { id: 5, name: 'Coffee Maker', price: 79.99, stock: 20, category: 'Appliances' }
];

let orders = [];
let nextOrderId = 1;

app.use(express.json());

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    service: 'order-service',
    timestamp: new Date().toISOString()
  });
};

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Order Service: ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'order-service',
    timestamp: new Date().toISOString()
  });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

// Get all products
app.get('/products', (req, res, next) => {
  try {
    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    next(error);
  }
});

// Get product by ID
app.get('/products/:id', (req, res, next) => {
  try {
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      const error = new Error('Invalid product ID format');
      error.status = 400;
      throw error;
    }

    const product = products.find(p => p.id === productId);

    if (!product) {
      const error = new Error('Product not found');
      error.status = 404;
      throw error;
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
});

// Create order
app.post('/orders', async (req, res, next) => {
  try {
    const { productId, quantity, userId } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      const error = new Error('productId and a positive quantity are required');
      error.status = 400;
      throw error;
    }

    if (!userId) {
      const error = new Error('userId is required');
      error.status = 400;
      throw error;
    }

    // Find product
    const product = products.find(p => p.id === productId);
    if (!product) {
      const error = new Error('Product not found');
      error.status = 404;
      throw error;
    }

    if (product.stock < quantity) {
      const error = new Error(`Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`);
      error.status = 400;
      throw error;
    }

    // Verify user exists via User Service
    let user;
    try {
      const userResponse = await axios.get(`${USER_SERVICE_URL}/users/${userId}`, {
        timeout: 5000
      });
      user = userResponse.data.data || userResponse.data;
    } catch (error) {
      if (error.response?.status === 404) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
      }
      throw new Error('Failed to verify user: ' + (error.message || 'Service unavailable'));
    }

    const total = product.price * quantity;

    // Check user balance
    if (user.balance < total) {
      const error = new Error(`Insufficient balance. Available: $${user.balance.toFixed(2)}, Required: $${total.toFixed(2)}`);
      error.status = 400;
      throw error;
    }

    // Deduct balance from user
    try {
      await axios.patch(`${USER_SERVICE_URL}/users/${userId}/balance`, {
        amount: total,
        operation: 'deduct'
      }, {
        timeout: 5000
      });
    } catch (error) {
      throw new Error('Failed to process payment: ' + (error.response?.data?.error || error.message));
    }

    // Update product stock
    product.stock -= quantity;

    // Create order
    const order = {
      id: nextOrderId++,
      userId,
      productId,
      productName: product.name,
      quantity,
      pricePerUnit: product.price,
      total,
      status: 'completed',
      timestamp: new Date().toISOString()
    };

    orders.push(order);

    // Update Prometheus metrics
    ordersTotal.labels(order.status).inc();
    orderValue.observe(total);

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order placed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get all orders
app.get('/orders', (req, res, next) => {
  try {
    res.json({
      success: true,
      data: orders,
      count: orders.length
    });
  } catch (error) {
    next(error);
  }
});

// Get order by ID
app.get('/orders/:id', (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id);

    if (isNaN(orderId)) {
      const error = new Error('Invalid order ID format');
      error.status = 400;
      throw error;
    }

    const order = orders.find(o => o.id === orderId);

    if (!order) {
      const error = new Error('Order not found');
      error.status = 404;
      throw error;
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
});

// Get orders by user ID
app.get('/orders/user/:userId', (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      const error = new Error('Invalid user ID format');
      error.status = 400;
      throw error;
    }

    const userOrders = orders.filter(o => o.userId === userId);

    res.json({
      success: true,
      data: userOrders,
      count: userOrders.length
    });
  } catch (error) {
    next(error);
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.url,
    service: 'order-service',
    timestamp: new Date().toISOString()
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Export app for testing
export default app;

// Only start server if this file is run directly (not imported for testing)
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🧾 Order Service running on port ${PORT}`);
    console.log(`User Service URL: ${USER_SERVICE_URL}`);
  });
}
