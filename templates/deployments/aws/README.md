# AWS App Runner Deployment

This project includes configuration for AWS App Runner deployment.

## Prerequisites

1. AWS account with App Runner access
2. GitHub repository with your code
3. AWS CLI configured (optional, for CLI deployment)

## Deployment Steps

### Via AWS Console:

1. Navigate to AWS App Runner in the AWS Console
2. Click "Create service"
3. Choose "Source code repository" 
4. Connect your GitHub account and select this repository
5. App Runner will auto-detect Node.js runtime
6. Set environment variables:
   - `COMMANDS_JWT_AUDIENCE` - Your server identifier
   - `COMMANDS_JWT_ISSUER` - Keep as `https://api.commands.com`
7. Review and create the service

### Environment Variables

The following environment variables need to be configured in App Runner:

- `PORT` - (Optional) App Runner provides this automatically
- `COMMANDS_JWT_ISSUER` - Must be `https://api.commands.com`
- `COMMANDS_JWT_AUDIENCE` - Your unique server identifier

## Configuration

The `apprunner.yaml` file in your project root contains:
- Node.js 18 runtime
- Build and start commands
- Port configuration
- Production optimizations

## Auto-scaling

App Runner automatically handles:
- SSL/TLS certificates
- Load balancing
- Auto-scaling based on traffic
- Health checks at `/health`

## Costs

AWS App Runner charges based on:
- Compute resources used
- Number of requests
- Data transfer

See [AWS App Runner Pricing](https://aws.amazon.com/apprunner/pricing/) for details.