---
name: infra
description: Provisions and manages cloud infrastructure using Terraform, configures Kubernetes deployments, and manages network and IAM resources. Use when provisioning cloud environments, setting up Kubernetes clusters, writing Terraform modules, or configuring network topology. Always confirm the cloud provider and existing infra state before making changes.
---

# Infrastructure Engineering

## Purpose
Infrastructure code has the highest blast radius of any code in a project. A misconfigured security group can expose a database publicly. A missing IAM boundary can allow privilege escalation. This skill treats infrastructure as code with the same rigor as application code: reviewed, versioned, and tested before apply.

## SOP: Infrastructure Provisioning

### Step 1 - Stack Discovery (Critical Gate)
Before writing a single `.tf` file, confirm:
1. What is the cloud provider? (AWS, GCP, Azure, DigitalOcean)
2. Does a Terraform state file already exist? (`terraform.tfstate`, or remote state in S3/GCS?)
3. What environments need to be provisioned? (development, staging, production - or just one?)
4. Is there an existing VPC or network topology that must be matched?

Never run `terraform apply` on an existing environment without first running `terraform plan` and reviewing the output.

### Step 2 - Terraform Module Structure
Organize infrastructure into modules, not one monolithic `main.tf`:

```
infra/
├── main.tf          # Root module - calls child modules
├── variables.tf     # Root input variables
├── outputs.tf       # Root outputs (VPC ID, DB endpoint, etc.)
├── versions.tf      # Provider version constraints
├── backend.tf       # Remote state backend config
└── modules/
    ├── network/     # VPC, subnets, route tables, NAT
    ├── compute/     # EC2, ECS, or GKE cluster
    └── database/    # RDS/CloudSQL, parameter groups, subnet groups
```

### Step 3 - Remote State Backend
Never use local state for team or production environments. Configure remote state before any `terraform apply`:

```hcl
# backend.tf (AWS S3 backend)
terraform {
  backend "s3" {
    bucket         = "myapp-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-lock"  # prevents concurrent applies
  }
}
```

The S3 bucket and DynamoDB table must be created manually (or via a bootstrap script) before `terraform init`.

### Step 4 - VPC Network Design
```hcl
# modules/network/main.tf
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.project}-${var.environment}-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]  # app and DB tiers
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]  # load balancers only

  enable_nat_gateway     = true
  single_nat_gateway     = var.environment != "production"  # cost optimization for non-prod
  enable_dns_hostnames   = true
}
```

**Subnet rules:** Application servers and databases live in private subnets. Only load balancers and bastion hosts live in public subnets. The database subnet must have no route to the internet.

### Step 5 - IAM Least Privilege
Every service gets its own IAM role. No service runs with `AdministratorAccess`:

```hcl
# IAM role for the FastAPI application
resource "aws_iam_role" "app" {
  name = "${var.project}-app-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Effect = "Allow", Principal = { Service = "ecs-tasks.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
}

resource "aws_iam_role_policy" "app" {
  role = aws_iam_role.app.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      { Effect = "Allow", Action = ["s3:GetObject", "s3:PutObject"], Resource = "arn:aws:s3:::${var.uploads_bucket}/*" },
      { Effect = "Allow", Action = ["secretsmanager:GetSecretValue"], Resource = var.db_secret_arn },
    ]
  })
}
```

Audit IAM permissions quarterly. Remove unused policies.

### Step 6 - Kubernetes Manifests (If Using K8s)
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  labels: { app: api }
spec:
  replicas: 2
  selector:
    matchLabels: { app: api }
  template:
    metadata:
      labels: { app: api }
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
      containers:
        - name: api
          image: ghcr.io/myorg/api:{{ IMAGE_TAG }}
          ports: [{ containerPort: 8000 }]
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef: { name: app-secrets, key: database-url }
          livenessProbe:
            httpGet: { path: /health, port: 8000 }
            initialDelaySeconds: 10
          readinessProbe:
            httpGet: { path: /health, port: 8000 }
            initialDelaySeconds: 5
          resources:
            requests: { cpu: "100m", memory: "256Mi" }
            limits: { cpu: "500m", memory: "512Mi" }
```

Always define `resources.requests` and `resources.limits`. A pod without limits can consume all node resources.

### Step 7 - Deployment Verification Checklist
After every `terraform apply` or `kubectl apply`, verify:

- [ ] `terraform plan` showed only expected changes (no unexpected destroys).
- [ ] Health check endpoint returns 200 within 2 minutes of deploy.
- [ ] Logs show no new ERROR entries in the first 5 minutes post-deploy.
- [ ] DB connection count is within expected range.
- [ ] Previous version is available for rollback: `kubectl rollout undo deployment/api`.
