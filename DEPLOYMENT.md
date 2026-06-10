# SCHOOLME101 MCP Server - Deployment Guide

## Quick Deployment Links

| Platform | Difficulty | Deploy Button |
|----------|-----------|----------------|
| Vercel | ⭐ Easy | [Deploy to Vercel](#vercel-deployment) |
| Railway | ⭐ Easy | [Deploy to Railway](#railway-deployment) |
| Heroku | ⭐⭐ Medium | [Deploy to Heroku](#heroku-deployment) |
| Docker | ⭐⭐ Medium | [Deploy with Docker](#docker-deployment) |
| AWS | ⭐⭐⭐ Advanced | [Deploy to AWS](#aws-deployment) |

---

## ✨ Vercel Deployment (Recommended)

### Step 1: Prepare Repository
```bash
git add .
git commit -m "Add MCP Server setup"
git push origin main
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select your GitHub repository
4. Select "Other" as framework
5. Add Environment Variables:
   ```
   GITHUB_TOKEN=your_token_optional
   CODEX_API_KEY=sk-your-key-here
   PORT=3000
   ```
6. Click Deploy

### Step 3: Get Your Endpoint
```
https://your-project-name.vercel.app
```

### Test Deployment
```bash
curl https://your-project-name.vercel.app/health
```

**Pros:**
- ✅ Free tier available
- ✅ Auto-scaling
- ✅ Global CDN
- ✅ Instant deployments

---

## 🚂 Railway Deployment

### Step 1: Connect Repository
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Authorize and select your repository

### Step 2: Configure
1. Railway auto-detects Node.js
2. Add variables in Project Settings:
   ```
   GITHUB_TOKEN=your_token
   CODEX_API_KEY=sk-your-key
   PORT=3000
   ```
3. Click Deploy

### Step 3: Get URL
- Your deployment URL will be provided in Railway dashboard
- Format: `https://schoolme101-production.up.railway.app`

**Pros:**
- ✅ Generous free tier
- ✅ Simple configuration
- ✅ Good documentation

---

## 🦅 Heroku Deployment

### Prerequisites
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login
```

### Step 1: Create Heroku App
```bash
heroku create schoolme101-mcp
```

### Step 2: Add Buildpack
```bash
heroku buildpacks:add heroku/nodejs
```

### Step 3: Set Environment Variables
```bash
heroku config:set GITHUB_TOKEN=your_token
heroku config:set CODEX_API_KEY=sk-your-key
heroku config:set NODE_ENV=production
```

### Step 4: Deploy
```bash
git push heroku main
```

### Step 5: View Logs
```bash
heroku logs --tail
```

### Get Your URL
```bash
heroku open
```

**Pros:**
- ✅ Free tier (with limitations)
- ✅ Easy deployment
- ✅ Built-in monitoring

---

## 🐳 Docker Deployment

### Step 1: Build Docker Image
```bash
docker build -t schoolme101-mcp:latest .
```

### Step 2: Run Locally
```bash
docker run -p 3000:3000 \
  -e GITHUB_TOKEN=your_token \
  -e CODEX_API_KEY=sk-your-key \
  schoolme101-mcp:latest
```

### Step 3: Push to Docker Hub
```bash
# Login to Docker Hub
docker login

# Tag image
docker tag schoolme101-mcp:latest yourusername/schoolme101-mcp:latest

# Push
docker push yourusername/schoolme101-mcp:latest
```

### Step 4: Deploy to Container Service

#### DigitalOcean App Platform
1. Go to [digitalocean.com](https://digitalocean.com)
2. Create new App
3. Connect Docker Hub repository
4. Set environment variables
5. Deploy

#### Google Cloud Run
```bash
gcloud run deploy schoolme101-mcp \
  --image yourusername/schoolme101-mcp:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**Pros:**
- ✅ Consistent across environments
- ✅ Easy scaling
- ✅ Works everywhere Docker runs

---

## ☁️ AWS Deployment

### Option 1: AWS Lambda + API Gateway (Serverless)

#### Prerequisites
```bash
npm install -g serverless
serverless plugin install -n serverless-http
```

#### Configuration
Create `serverless.yml`:
```yaml
service: schoolme101-mcp

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    GITHUB_TOKEN: ${env:GITHUB_TOKEN}
    CODEX_API_KEY: ${env:CODEX_API_KEY}

functions:
  api:
    handler: server.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
```

#### Deploy
```bash
serverless deploy
```

### Option 2: AWS EC2

```bash
# 1. Launch EC2 instance (Ubuntu 20.04)
# 2. Connect via SSH
# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Clone repository
git clone https://github.com/yourusername/SCHOOLME101.git
cd SCHOOLME101

# 5. Install and run
npm install
npm start

# 6. Use PM2 for process management
sudo npm install -g pm2
pm2 start server.js
pm2 startup
pm2 save
```

### Option 3: AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli --upgrade --user

# Initialize
eb init -p node.js-18 schoolme101-mcp

# Create environment
eb create schoolme101-env

# Deploy
eb deploy

# Monitor
eb logs
```

**Pros:**
- ✅ Highly scalable
- ✅ Production-ready
- ✅ Multiple options (Lambda, EC2, ECS, etc.)

---

## 🔧 Environment Variables Reference

| Variable | Required | Example |
|----------|----------|---------|
| `PORT` | No | `3000` |
| `NODE_ENV` | No | `production` |
| `GITHUB_TOKEN` | No | `ghp_...` |
| `CODEX_API_KEY` | Yes (for Codex) | `sk-...` |
| `CORS_ORIGIN` | No | `*` |

---

## 📊 Monitoring & Logging

### Vercel
- Dashboard: [vercel.com/dashboard](https://vercel.com/dashboard)
- Logs: Automatic
- Metrics: Built-in

### Railway
- Dashboard: [railway.app/dashboard](https://railway.app/dashboard)
- Logs: Real-time streaming
- Monitoring: Built-in

### Heroku
```bash
# View logs
heroku logs --tail

# View specific dyno
heroku logs --dyno=web.1 --tail
```

### Self-hosted (PM2)
```bash
# Logs
pm2 logs

# Monitoring
pm2 monit

# Status
pm2 status
```

---

## 🔒 Security Checklist

Before deploying to production:

- [ ] Use HTTPS (automatic on Vercel/Railway/Heroku)
- [ ] Add rate limiting
- [ ] Implement API authentication
- [ ] Validate all inputs
- [ ] Use environment variables for secrets
- [ ] Enable CORS only for trusted origins
- [ ] Set appropriate security headers
- [ ] Monitor API usage
- [ ] Implement request logging
- [ ] Set up error alerting

---

## 📈 Cost Estimation

### Vercel
- Free tier: 6GB bandwidth/month, unlimited functions
- Pro: $20/month + usage

### Railway
- Free tier: $5 credits/month
- Pay as you go: $0.06/hour per GB RAM

### Heroku
- Free tier: Removed (as of Nov 2022)
- Basic: $7/month minimum

### AWS
- Lambda: $0.20 per million requests
- EC2: t3.micro = ~$10/month

### DigitalOcean
- App Platform: $5-12/month
- Droplet: $4-6/month

---

## 🚀 Post-Deployment

### 1. Test Your Deployment
```bash
curl https://your-deployment/health
curl https://your-deployment/api/subjects
curl https://your-deployment/api/subject/Mathematics
```

### 2. Set Up Monitoring
- Enable error tracking (Sentry, Rollbar)
- Set up uptime monitoring (UptimeRobot)
- Configure log aggregation (LogRocket, Datadog)

### 3. Add Custom Domain
- Update DNS records
- Configure SSL/TLS

### 4. Backup Strategy
- Enable automated backups
- Test restore procedures

### 5. Documentation
- Document deployment process
- Create runbooks for common tasks
- Set up team access

---

## 🆘 Troubleshooting Deployments

### Server won't start
```bash
# Check Node version
node --version

# Check logs
heroku logs --tail  # or platform-specific logs

# Verify dependencies
npm install
```

### Codex endpoint returns 401
```bash
# Check API key
echo $CODEX_API_KEY

# Verify in platform dashboard
# (Vercel: Settings → Environment Variables)
```

### High memory usage
```bash
# Check for memory leaks
node --max-old-space-size=512 server.js

# Monitor with PM2
pm2 start server.js --max-memory-restart 512M
```

### Database/Cache issues
- Clear deployment cache
- Restart application
- Check file system permissions

---

## 📞 Support

- **Vercel:** [vercel.com/support](https://vercel.com/support)
- **Railway:** [railway.app/docs](https://railway.app/docs)
- **Heroku:** [help.heroku.com](https://help.heroku.com)
- **AWS:** [aws.amazon.com/support](https://aws.amazon.com/support)
- **Docker:** [docs.docker.com](https://docs.docker.com)

---

**Version:** 1.0.0  
**Last Updated:** 2026-06-10
