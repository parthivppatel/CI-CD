# Step-by-Step Setup Guide

Follow these steps to set up and run the CI/CD pipeline for this project.

## Prerequisites Installation

### 1. Install Node.js
- Download from https://nodejs.org/ (version 18 or higher)
- Verify installation: `node --version` and `npm --version`

### 2. Install Docker
- Windows: Download Docker Desktop from https://www.docker.com/products/docker-desktop
- Verify installation: `docker --version` and `docker-compose --version`

### 3. Install Git
- Download from https://git-scm.com/
- Verify installation: `git --version`

## Local Development Setup

### Step 1: Install Dependencies

```bash
# Navigate to project directory
cd LAB_10_202412069

# Install dependencies for user-service
cd user-service
npm install

# Install dependencies for order-service
cd ../order-service
npm install

# Return to root
cd ..
```

### Step 2: Run Tests

```bash
# Test user-service
cd user-service
npm test

# Test order-service
cd ../order-service
npm test
```

### Step 3: Test Services Locally

```bash
# Terminal 1 - Start User Service
cd user-service
npm start

# Terminal 2 - Start Order Service
cd order-service
npm start
```

Test the services:
```bash
# Test user service health
curl http://localhost:8003/health

# Test order service health
curl http://localhost:8002/health
```

## Docker Setup

### Step 1: Build Docker Images

```bash
# Build user-service image
cd user-service
docker build -t user-service:latest .

# Build order-service image
cd ../order-service
docker build -t order-service:latest .
```

### Step 2: Run with Docker Compose

```bash
# From project root
docker-compose up --build
```

This will start:
- User Service (port 8003)
- Order Service (port 8002)
- Prometheus (port 9090)
- Grafana (port 3000)

### Step 3: Verify Services

```bash
# Check running containers
docker-compose ps

# Check logs
docker-compose logs user-service
docker-compose logs order-service
docker-compose logs prometheus
docker-compose logs grafana
```

## GitHub Actions CI/CD Setup

### Step 1: Create GitHub Repository

1. Go to https://github.com
2. Click "New repository"
3. Name it (e.g., "microservices-cicd")
4. Don't initialize with README (we already have one)
5. Click "Create repository"

### Step 2: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: CI/CD pipeline setup"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to main branch
git branch -M main
git push -u origin main
```

### Step 3: Verify GitHub Actions

1. Go to your GitHub repository
2. Click on "Actions" tab
3. You should see the workflow running
4. Wait for it to complete (should show green checkmarks)

### Step 4: View Pipeline Results

1. Click on the workflow run
2. Expand each job to see details:
   - **Test Services**: Should show all tests passing
   - **Build Docker Images**: Should show successful builds
   - **Deploy Services**: Should show deployment message

### Step 5: Access Container Registry

1. Go to your repository on GitHub
2. Click on "Packages" (right sidebar)
3. You should see two packages:
   - `user-service`
   - `order-service`

## Monitoring Setup

### Step 1: Access Prometheus

1. Open browser: http://localhost:9090
2. Go to "Status" → "Targets"
3. Verify both services are "UP":
   - `user-service:8003`
   - `order-service:8002`

### Step 2: Query Metrics

In Prometheus:
1. Go to "Graph" tab
2. Try these queries:
   ```
   http_requests_total
   active_users_count
   orders_total
   rate(http_requests_total[5m])
   ```

### Step 3: Access Grafana

1. Open browser: http://localhost:3000
2. Login:
   - Username: `admin`
   - Password: `admin`
3. Change password when prompted (or skip)

### Step 4: View Dashboard

1. Click on "Dashboards" (left menu)
2. Click on "Microservices Monitoring Dashboard"
3. You should see various metrics visualized

### Step 5: Generate Test Data

To see metrics in action:

```bash
# Create a user
curl -X POST http://localhost:8003/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","balance":1000}'

# Get user ID from response, then create an order
curl -X POST http://localhost:8002/orders \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"quantity":1,"userId":1}'

# Check metrics
curl http://localhost:8003/metrics | grep active_users_count
curl http://localhost:8002/metrics | grep orders_total
```

## Screenshots for Deliverables

### Screenshot 1: Successful Pipeline Execution

1. Go to GitHub repository → Actions tab
2. Click on the latest workflow run
3. Take screenshot showing:
   - All jobs completed (green checkmarks)
   - Test results
   - Build results
   - Deployment results

### Screenshot 2: Grafana Dashboard

1. Open Grafana: http://localhost:3000
2. Navigate to "Microservices Monitoring Dashboard"
3. Generate some traffic (create users/orders)
4. Take screenshot showing:
   - At least one metric graph
   - Dashboard title visible
   - Data points visible

## Troubleshooting

### Issue: Tests fail with "Cannot find module"
**Solution**: Run `npm install` in the service directory

### Issue: Docker build fails
**Solution**: 
- Ensure Docker Desktop is running
- Check Dockerfile syntax
- Try: `docker-compose down` then `docker-compose up --build`

### Issue: Port already in use
**Solution**: 
- Stop other services using ports 8002, 8003, 9090, 3000
- Or change ports in docker-compose.yml

### Issue: Prometheus shows targets as DOWN
**Solution**:
- Check services are running: `docker-compose ps`
- Check service logs: `docker-compose logs user-service`
- Verify network: Services should be on same Docker network

### Issue: GitHub Actions workflow not running
**Solution**:
- Ensure workflow file is in `.github/workflows/` directory
- Check file is committed and pushed
- Verify branch name matches workflow trigger (main/master)

## Next Steps After Setup

1. ✅ Run tests locally
2. ✅ Build Docker images
3. ✅ Start services with docker-compose
4. ✅ Push to GitHub and verify CI/CD pipeline
5. ✅ Access Prometheus and verify metrics
6. ✅ Access Grafana and view dashboard
7. ✅ Take screenshots for deliverables
8. ✅ Write your report explaining the workflow

## Quick Reference Commands

```bash
# Install dependencies
npm install (in each service directory)

# Run tests
npm test (in each service directory)

# Start services locally
npm start (in each service directory)

# Docker commands
docker-compose up --build          # Start all services
docker-compose down                # Stop all services
docker-compose ps                  # Check status
docker-compose logs [service]      # View logs

# Test endpoints
curl http://localhost:8003/health
curl http://localhost:8002/health
curl http://localhost:8003/metrics
curl http://localhost:8002/metrics
```

## URLs Reference

- User Service: http://localhost:8003
- Order Service: http://localhost:8002
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (admin/admin)

