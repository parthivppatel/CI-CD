import express from 'express';
import cors from 'cors';
import { metricsMiddleware, activeUsers, register } from './metrics.js';

const app = express();
const PORT = process.env.PORT || 8003;

// Enable CORS for all routes
app.use(cors());

// Prometheus metrics middleware (must be before routes)
app.use(metricsMiddleware);

let users = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    balance: 500.00,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    balance: 750.50,
    createdAt: '2024-01-02T00:00:00Z'
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    balance: 1000.00,
    createdAt: '2024-01-03T00:00:00Z'
  }
];

let nextUserId = 4;

app.use(express.json());

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    service: 'user-service',
    timestamp: new Date().toISOString()
  });
};

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] User Service: ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'user-service',
    timestamp: new Date().toISOString()
  });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    activeUsers.set(users.length);
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

app.get('/users', (req, res, next) => {
  try {
    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    next(error);
  }
});

app.get('/users/:id', (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      const error = new Error('Invalid user ID format');
      error.status = 400;
      throw error;
    }

    const user = users.find(u => u.id === userId);

    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

app.post('/users', (req, res, next) => {
  try {
    const { name, email, balance } = req.body;

    if (!name || !email) {
      const error = new Error('Name and email are required');
      error.status = 400;
      throw error;
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      const error = new Error('User with this email already exists');
      error.status = 409;
      throw error;
    }

    const newUser = {
      id: nextUserId++,
      name,
      email,
      balance: balance || 0,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    activeUsers.set(users.length);

    res.status(201).json({
      success: true,
      data: newUser,
      message: 'User created successfully'
    });
  } catch (error) {
    next(error);
  }
});

app.patch('/users/:id/balance', (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { amount, operation } = req.body;

    if (isNaN(userId)) {
      const error = new Error('Invalid user ID format');
      error.status = 400;
      throw error;
    }

    if (!amount || isNaN(amount)) {
      const error = new Error('Valid amount is required');
      error.status = 400;
      throw error;
    }

    if (!['add', 'deduct'].includes(operation)) {
      const error = new Error('Operation must be "add" or "deduct"');
      error.status = 400;
      throw error;
    }

    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    const user = users[userIndex];

    if (operation === 'deduct' && user.balance < amount) {
      const error = new Error('Insufficient balance');
      error.status = 400;
      throw error;
    }

    users[userIndex].balance = operation === 'add' 
      ? user.balance + amount 
      : user.balance - amount;

    res.json({
      success: true,
      data: users[userIndex],
      message: `Balance ${operation}ed successfully`
    });
  } catch (error) {
    next(error);
  }
});

app.delete('/users/:id', (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      const error = new Error('Invalid user ID format');
      error.status = 400;
      throw error;
    }

    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    const deletedUser = users.splice(userIndex, 1)[0];
    activeUsers.set(users.length);

    res.json({
      success: true,
      data: deletedUser,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.url,
    service: 'user-service',
    timestamp: new Date().toISOString()
  });
});

app.use(errorHandler);

// Export app for testing
export default app;

// Only start server if this file is run directly (not imported for testing)
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`👤 User Service running on port ${PORT}`);
    activeUsers.set(users.length);
  });
}
