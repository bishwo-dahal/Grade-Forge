## Grade-Forge — Installation Plan (ULM / Production)

This document covers the concrete, step-by-step installation and operational runbook for deploying Grade-Forge on the ULM-managed AWS/EC2 environment, including required modules and normal start/stop flow.

---

### Target deployment

- **Web application:** `https://ulm.gradeforge.tech`
- **Built-in product manual:** `https://ulm.gradeforge.tech/docs/`

---

### 1) Provision the EC2 host

- OS: **Amazon Linux 2** (or similar) with **`ec2-user`** SSH access
- Instance sizing: ensure enough RAM for Spring + Docker + (optional) co-located services
  - A common step up is `t3.medium` (4 GiB RAM)
- Storage: ensure adequate EBS volume space for Docker images/layers and logs

#### Security group / ports

Open inbound ports as needed:

- **80/443** if using Nginx + HTTPS on the instance
- **8080** for the app when deployed from `main` (workflow default)
- **8081** for the app when deployed from `production` (workflow default)
- **22** for SSH (restrict to admin IPs when possible)

If Nginx terminates HTTPS on the same EC2 host, prefer **not** exposing 8080/8081 publicly (proxy to `localhost` only).

---

### 2) Install required OS modules (fresh instance)

After SSH:

```bash
sudo yum update -y
sudo yum install -y git
```

Install Docker:

```bash
sudo yum install -y docker
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ec2-user
```

Log out/in so `ec2-user` picks up the `docker` group.

Verify:

```bash
docker --version
git --version
```

---

### 3) Configure GitHub Actions secrets (production)

In the GitHub repo: **Settings → Secrets and variables → Actions**, configure at least:

| Secret | Used for |
|--------|----------|
| `EC2_HOST` | EC2 public IP or DNS |
| `EC2_KEY` | Private SSH key (PEM) for `ec2-user` |
| `DOCKER_USERNAME` | Docker Hub login to pull the image on EC2 |
| `DOCKER_PASSWORD` | Docker Hub token/password |
| `SPRING_DATASOURCE_URL` | JDBC URL (e.g. RDS Postgres) |
| `SPRING_DATASOURCE_USERNAME` | DB user |
| `SPRING_DATASOURCE_PASSWORD` | DB password |
| `CLOUD_AWS_S3_BUCKET_NAME` | S3 bucket for submissions/assets |
| `CLOUD_AWS_CREDENTIAL_ACCESS_KEY` | AWS access key |
| `CLOUD_AWS_CREDENTIAL_SECRET_KEY` | AWS secret key |
| `CLOUD_AWS_REGION` | e.g. `us-east-2` |

Optional Ollama/LLM secrets are listed below.

---

### 4) Deploy (GitHub Actions)

The repo builds a **single Docker image** and deploys it to EC2 over SSH. See `.github/workflows/deploy.yml`.

- **Automatic:** push to `main` or `production` (workflow path filters apply)
- **Manual:** Actions → “Docker Deployment for Grade Forge” → Run workflow

The workflow:

- builds & pushes `bishwodahal/grade-forge:<branch-name>`
- SSHs into EC2
- ensures RabbitMQ is up (if you rely on workflow-started container)
- runs `docker run` with DB/S3/RabbitMQ and optional LLM env vars

---

### 5) Normal operation flow

#### Start

1. **Database first**: ensure Postgres/RDS is reachable from EC2 (`SPRING_DATASOURCE_URL` works).
2. **RabbitMQ**:
   - If you rely on the deploy workflow to start it, the first deploy will create/ensure the `gradeforge-rabbitmq` container.
   - If you manage RabbitMQ yourself, ensure it is running and reachable at the host/port you set in `SPRING_RABBITMQ_*`.
3. **App container**:
   - Run the GitHub Actions deploy workflow (preferred), or pull/run the image manually.
4. **Smoke test**:
   - `curl http://127.0.0.1:8080/` (or `8081` depending on branch/port mapping)

#### Stop

Stop the Grade-Forge container(s) (names depend on workflow/branch), then RabbitMQ if it is co-located:

```bash
docker ps
docker stop grade-forge-main || true
docker stop grade-forge-production || true
docker stop gradeforge-rabbitmq || true
docker ps
```

#### Common maintenance

- View logs:

```bash
docker logs -n 200 grade-forge-main
```

- Clear Docker cache when disk fills up:
  - `docker system prune -a` (add `--volumes` only if you intentionally want to delete volumes)
  - `docker builder prune -a`

---

### 6) Smoke test (external)

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://<EC2_HOST>:8080/
```

Use **8081** if you deployed the `production` branch. Expect HTTP **200** from the app root.

---

### 7) Optional: Nginx reverse proxy + HTTPS (reference)

This is a reference layout for Nginx on Amazon Linux / RHEL-style EC2, with Route 53 DNS and Let’s Encrypt.

#### Install and smoke-test Nginx

```bash
sudo yum update -y
sudo yum install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1/
```

Confirm backends before TLS:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8080/
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8081/
```

#### Certbot (Let’s Encrypt)

```bash
sudo yum install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ulm.gradeforge.tech -d www.ulm.gradeforge.tech
sudo certbot renew --dry-run
```

---

### 8) Optional: Ollama on EC2 (for LLM evidence)

The deploy workflow can pass `GRADER_LLM_AI_SIGNAL_*` into the app container. It also configures `host.docker.internal` so the container can reach an Ollama service on the same EC2 host.

#### Host setup (when LLM is enabled)

1. Install Ollama on the EC2 instance (**not** inside the Grade-Forge image): `https://ollama.com/download`
2. Pull a model (example):

```bash
ollama pull llama3
```

3. Keep Ollama private. **Never** open port `11434` to `0.0.0.0/0`.

#### GitHub Actions secrets (optional)

| Secret | Default when unset | Purpose |
|--------|-------------------|---------|
| `GRADER_LLM_AI_SIGNAL_ENABLED` | `false` | Set to `true` after Ollama is installed on the host. |
| `GRADER_LLM_AI_SIGNAL_URL` | `http://host.docker.internal:11434/api/generate` | Ollama generate endpoint reachable from the container. |
| `GRADER_LLM_AI_SIGNAL_MODEL` | `llama3` | Model name as shown by `ollama list`. |
| `GRADER_LLM_AI_SIGNAL_TIMEOUT_SEC` | `120` | Timeout for slower hardware / larger workloads. |

