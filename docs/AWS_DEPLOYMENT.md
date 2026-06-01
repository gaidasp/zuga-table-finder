# AWS Deployment Guide

This guide explains how to deploy Zuga Table Finder to AWS using different methods.

## Prerequisites

1. AWS Account
2. GitHub repository with access to Secrets
3. MongoDB database (MongoDB Atlas or self-hosted)

## Deployment Options

### Option 1: AWS EC2 (Recommended for full control)

**Setup:**
1. Launch an EC2 instance (Ubuntu 20.04+ recommended)
2. Install Node.js 20, PM2, and Git on the instance
3. Clone the repository to `/var/www/zuga-table-finder`
4. Create `.env` file with `MONGODB_URI`
5. Generate SSH key pair for GitHub Actions

**GitHub Secrets:**
```
EC2_HOST=your-ec2-ip-or-domain
EC2_USER=ubuntu
EC2_SSH_KEY=<your-private-ssh-key>
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
AWS_REGION=eu-west-1
MONGODB_URI=<your-mongodb-uri>
```

**Initial EC2 Setup:**
```bash
# SSH into EC2
ssh ubuntu@your-ec2-ip

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Git
sudo apt-get install -y git

# Create app directory
sudo mkdir -p /var/www/zuga-table-finder
sudo chown ubuntu:ubuntu /var/www/zuga-table-finder

# Clone repository
cd /var/www
git clone https://github.com/YOUR_USERNAME/zuga-table-finder.git
cd zuga-table-finder

# Create .env file
echo "MONGODB_URI=your-mongodb-connection-string" > .env

# Install dependencies and build
npm ci
npm run build

# Start with PM2
pm2 start npm --name zuga-table-finder -- start
pm2 save
pm2 startup
```

### Option 2: AWS App Runner (Easiest managed option)

**Setup:**
1. Create ECR repository
2. Create App Runner service pointing to ECR
3. Configure environment variables in App Runner

**GitHub Secrets:**
```
ECR_REGISTRY=123456789.dkr.ecr.eu-west-1.amazonaws.com
ECR_REPOSITORY=zuga-table-finder
APP_RUNNER_SERVICE_ARN=arn:aws:apprunner:region:account:service/name
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
AWS_REGION=eu-west-1
MONGODB_URI=<your-mongodb-uri>
```

**AWS Setup:**
```bash
# Create ECR repository
aws ecr create-repository --repository-name zuga-table-finder --region eu-west-1

# Create App Runner service (via AWS Console or CLI)
# Set environment variable MONGODB_URI in App Runner configuration
```

### Option 3: AWS Elastic Beanstalk

**Setup:**
1. Create Elastic Beanstalk application
2. Create environment (Node.js platform)
3. Configure environment variables

**GitHub Secrets:**
```
EB_APPLICATION_NAME=zuga-table-finder
EB_ENVIRONMENT_NAME=zuga-table-finder-prod
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
AWS_REGION=eu-west-1
MONGODB_URI=<your-mongodb-uri>
```

### Option 4: S3 + CloudFront (Static only - requires adapter change)

**Note:** This requires changing to `@sveltejs/adapter-static` and pre-rendering all pages.

**GitHub Secrets:**
```
S3_BUCKET=zuga-table-finder
CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
AWS_REGION=eu-west-1
```

## Environment Variables

All deployment methods require setting `MONGODB_URI` either as:
- GitHub Secret (for build-time)
- EC2 `.env` file
- App Runner environment variables
- Elastic Beanstalk environment properties

## Monitoring

### EC2
```bash
# View logs
pm2 logs zuga-table-finder

# Monitor
pm2 monit
```

### App Runner / Elastic Beanstalk
Use CloudWatch Logs in AWS Console

## Troubleshooting

### Build fails in CI
- Check that `MONGODB_URI` secret is set in GitHub
- Verify MongoDB connection string is correct

### Deployment fails
- Verify all required secrets are configured
- Check AWS IAM permissions
- Review GitHub Actions logs

### Application errors
- Check environment variables are set correctly
- Verify MongoDB connection
- Check application logs

## Cost Optimization

- **EC2**: Use t3.micro or t3.small for small traffic
- **App Runner**: Scales to zero when idle
- **Elastic Beanstalk**: Can use spot instances
- **CloudFront**: Use for caching static assets

## Security

1. Use AWS Secrets Manager for sensitive data
2. Enable HTTPS (use AWS Certificate Manager)
3. Configure security groups to allow only necessary ports
4. Regularly update dependencies
5. Enable CloudWatch alarms for monitoring
