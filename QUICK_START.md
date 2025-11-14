# Quick Start Guide - CI/CD Pipeline

## 🚀 What Has Been Set Up

Your project now has a complete CI/CD pipeline with:

✅ Automated testing (Jest)
✅ Docker containerization
✅ GitHub Actions CI/CD workflow
✅ Prometheus metrics collection
✅ Grafana dashboards

## 📋 Step-by-Step Instructions

### Step 1: Install Dependencies

```bash
# Install dependencies for user-service
cd user-service
npm install

# Install dependencies for order-service
cd ../order-service
npm install
```

### Step 2: Run Tests Locally

```bash
# Test user-service
cd user-service
npm test

# Test order-service
cd ../order-service
npm test
```

### Step 3: Test Docker Build

```bash
# Build images
docker-compose build

# Start all services (including Prometheus and Grafana)
docker-compose up -d

# Check status
docker-compose ps
```

### Step 4: Access Services

- **User Service**: http://localhost:8003
- **Order Service**: http://localhost:8002
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (login: admin/admin)

### Step 5: Set Up GitHub Actions

1. **Create GitHub Repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: CI/CD pipeline"
   ```

2. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git branch -M main
   git push -u origin main
   ```

3. **View Pipeline**:
   - Go to your GitHub repo
   - Click "Actions" tab
   - Watch the pipeline run!

### Step 6: Generate Test Data for Monitoring

```bash
# Create a user
curl -X POST http://localhost:8003/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","balance":1000}'

# Create an order (use user ID from above)
curl -X POST http://localhost:8002/orders \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"quantity":1,"userId":1}'

# Check metrics
curl http://localhost:8003/metrics
curl http://localhost:8002/metrics
```

### Step 7: View Grafana Dashboard

1. Open http://localhost:3000
2. Login with admin/admin
3. Go to Dashboards → Microservices Monitoring Dashboard
4. You should see metrics visualized!

## 📸 Screenshots Needed

### Screenshot 1: GitHub Actions Pipeline
1. Go to GitHub repo → Actions tab
2. Click on the latest workflow run
3. Screenshot showing all green checkmarks ✅

### Screenshot 2: Grafana Dashboard
1. Open Grafana (http://localhost:3000)
2. Navigate to the dashboard
3. Generate some traffic (create users/orders)
4. Screenshot showing at least one metric graph

## 🐛 Troubleshooting

**Tests fail?**
- Run `npm install` in each service directory

**Docker won't start?**
- Make sure Docker Desktop is running
- Check ports 8002, 8003, 9090, 3000 are free

**Prometheus shows targets DOWN?**
- Check services are running: `docker-compose ps`
- Check logs: `docker-compose logs user-service`

**Grafana no data?**
- Verify Prometheus datasource is configured
- Check Prometheus targets are UP
- Wait a few minutes for data collection

## 📚 Documentation

- **README.md**: Full project documentation
- **SETUP_STEPS.md**: Detailed setup instructions
- **CICD_REPORT_TEMPLATE.md**: Report template for your assignment

## ✅ Checklist

- [ ] Dependencies installed
- [ ] Tests passing locally
- [ ] Docker images building
- [ ] Services running with docker-compose
- [ ] GitHub Actions pipeline running
- [ ] Prometheus scraping metrics
- [ ] Grafana dashboard showing data
- [ ] Screenshots taken
- [ ] Report written

## 🎯 Next Steps

1. Complete the checklist above
2. Take required screenshots
3. Fill out the report template (CICD_REPORT_TEMPLATE.md)
4. Submit your deliverables!

Good luck! 🚀

