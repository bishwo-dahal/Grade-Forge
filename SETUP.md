# Grade-Forge – Setup

## Prerequisites

- Java **21** (JDK)
- Maven **3.9.x**
- Node.js **18+** (recommended: latest LTS)
- Docker (RabbitMQ; also used by “run tests” sandboxing)
- PostgreSQL (local dev DB) or a managed Postgres (RDS)

If you want to deploy this in production, jump to **[Production deployment (EC2 + GitHub Actions)](#production-deployment-ec2--github-actions)**.

## Repository layout (what runs where)

- **`Client/`**: React + Vite SPA
- **`Server/`**: Spring Boot REST API (serves the SPA + `/docs`)
- **`grader/`**: Python grader pipeline (plagiarism/similarity/AI signals)
- **`ml_training/`**: Python ML training (authorship triage model)
- **`docs-site/`**: VitePress docs source (built into `/docs/` in production)

---

## Environment variables (required)

Grade-Forge reads its runtime config from env vars (see `Server/env.example` and root `env.example`).

### Minimum required for local dev

- **Postgres**
  - `SPRING_DATASOURCE_URL` (example: `jdbc:postgresql://localhost:5432/gradeforge`)
  - `SPRING_DATASOURCE_USERNAME`
  - `SPRING_DATASOURCE_PASSWORD`
- **AWS S3** (required for file upload flows; you can run UI without it but S3-backed actions will fail)
  - `CLOUD_AWS_S3_BUCKET_NAME`
  - `CLOUD_AWS_CREDENTIAL_ACCESS_KEY`
  - `CLOUD_AWS_CREDENTIAL_SECRET_KEY`
  - `CLOUD_AWS_REGION`

### Optional (but common)

- **RabbitMQ** (used for async jobs; local dev uses Docker Compose below)
  - `SPRING_RABBITMQ_HOST` (default `localhost`)
  - `SPRING_RABBITMQ_PORT` (default `5672`)
- **Grader pipeline**
  - `GRADER_DIR` (default `../grader` when running from `Server/`)
  - `GRADER_PYTHON_CMD` (default `python3`)
- **ML training output**
  - `ML_AUTHORSHIP_MODEL_PATH` (default in Docker image: `/app/authorship-model.joblib`)
- **Ollama / LLM evidence layer**
  - `GRADER_LLM_AI_SIGNAL_ENABLED` (default `true` in `application.properties`, but production defaults can override)
  - `GRADER_LLM_AI_SIGNAL_URL` (default `http://localhost:11434/api/generate`)
  - `GRADER_LLM_AI_SIGNAL_MODEL` (default `llama3`)

---

## Run locally (dev)

### 0) Start Postgres

You can run Postgres however you like (local install, Docker, or RDS). The backend needs the 3 `SPRING_DATASOURCE_*` vars.

Quick Docker example (optional):

```bash
docker run --name gradeforge-postgres \
  -e POSTGRES_DB=gradeforge \
  -e POSTGRES_USER=gradeforge \
  -e POSTGRES_PASSWORD=gradeforge \
  -p 5432:5432 \
  -d postgres:16-alpine
```

Then set:

- `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/gradeforge`
- `SPRING_DATASOURCE_USERNAME=gradeforge`
- `SPRING_DATASOURCE_PASSWORD=gradeforge`

### 1) Start RabbitMQ (async jobs)

From the project root:

```bash
docker compose up -d
```

RabbitMQ runs on:
- AMQP: `localhost:5672` (user/pass: `guest` / `guest`)
- UI: `http://localhost:15672`

### 2) Run the backend (Spring Boot)

From the project root:

```bash
cd Server
mvn spring-boot:run
```

API: `http://localhost:8080`

Notes:

- DB schema updates are managed by Hibernate (`spring.jpa.hibernate.ddl-auto=update`).
- If you ever see a boot error like “column … does not exist”, it means your DB schema is behind your code. Apply the schema change (or restart with the latest code) and retry.

### 3) Run the frontend

```bash
cd Client
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`). With the backend running on **8080**, **`/docs`** on the dev server is **proxied** to Spring (see `Client/vite.config.ts`), so **`http://localhost:5173/docs/`** works after you run **`./scripts/build-and-sync-docs.sh`** once.

### 4) Documentation (VitePress, optional)

Product docs live in **`docs-site/`** ([VitePress](https://vitepress.dev/)). They are built into the Spring Boot JAR at **`/docs/`** in production (see the root **`Dockerfile`**).

**Edit docs only (no backend):** from the project root:

```bash
cd docs-site
npm install
npm run docs:dev
```

Use the URL VitePress prints (with `base: '/docs/'` in config, it is often **`http://localhost:5173/docs/`**).

**Serve docs from the Spring app on port 8080** (same as production layout): from the **project root**, run:

```bash
./scripts/build-and-sync-docs.sh
cd Server
mvn spring-boot:run
```

That script installs `docs-site` dependencies if needed, runs **`vitepress build`**, and copies **`.vitepress/dist`** into **`Server/src/main/resources/static/docs/`**.

Open **`http://localhost:8080/docs/`**. Re-run the script whenever you change Markdown under **`docs-site/`**.

Manual equivalent (if you prefer not to use the script):

```bash
cd docs-site
npm install
npm run docs:build
rm -rf ../Server/src/main/resources/static/docs
mkdir -p ../Server/src/main/resources/static/docs
cp -a .vitepress/dist/. ../Server/src/main/resources/static/docs/
cd ../Server
mvn spring-boot:run
```

---

## Local features & troubleshooting

### Run-tests sandbox (Docker-based code execution)

The backend runs student code inside Docker containers (it calls the `docker` CLI). Requirements:

- Docker installed and the backend process can execute `docker` (permissions/group)
- The run-tests base work dir must be accessible (defaults are in `Server/src/main/resources/application.properties`)

If an assignment has **no test cases**, the system still allows a single **ad-hoc “Run”** so students can execute their code and see output.

### Appearance / accessibility preferences

User preferences are stored as JSON in the database and applied globally in the UI:

- Theme: **Light / Dark / System**
- Font size
- Density
- **Dyslexic-friendly font** toggle (OpenDyslexic)

These are edited in **Settings → Appearance** and saved to the signed-in user’s account.

### ML training (authorship triage)

University admins can train an authorship triage model from instructor labels:

- UI: **University admin → ML training data → Train model**
- Server runs: `ml_training/train_authorship.py`
- Output: `joblib` written to `ML_AUTHORSHIP_MODEL_PATH` / `ml.authorship-model.path`

If training fails due to missing Python deps, install:

```bash
pip install -r ml_training/requirements-train.txt
```

If training fails with a “Number of classes … does not match target_names” style error, it typically means your holdout split is missing one label class; update to the latest training script (it supports missing classes in the test split).

---

## Production deployment (EC2 + GitHub Actions)

The repo builds a **single Docker image** (frontend static assets baked into the Spring Boot JAR) and deploys it to an **EC2** host over SSH. See **`.github/workflows/deploy.yml`**.

### ULM production (University of Louisiana Monroe)

- **Web application:** [https://ulm.gradeforge.tech](https://ulm.gradeforge.tech)
- **Built-in product manual (same host):** [https://ulm.gradeforge.tech/docs/](https://ulm.gradeforge.tech/docs/)

### 1) Prepare the EC2 server

- Use **Amazon Linux 2** (or similar) with **`ec2-user`** SSH access.
- Install **Docker** and ensure `ec2-user` can run `docker` (often: `sudo usermod -aG docker ec2-user` and re-login).
- Ensure your EC2 instance has enough **RAM** for Spring + Docker + Postgres/RabbitMQ if co-located. A common step up is `t3.medium` (4 GiB RAM).
- Open inbound ports as needed:
  - **`8080`** — app when deployed from **`main`** (container `grade-forge-main`).
  - **`8081`** — app when deployed from **`production`** branch (container `grade-forge-production`).
  - **`5672` / `15672`** — RabbitMQ if you rely on the workflow-started `gradeforge-rabbitmq` container (the first deploy starts it).

If you terminate **HTTPS on the same EC2 host with Nginx** (see **Optional: Nginx reverse proxy + HTTPS** below), you can restrict the security group to **`80`** and **`443`** (plus **`22`** for SSH) and **not** expose **`8080` / `8081`** publicly; Nginx proxies to `localhost` only.

Otherwise put the app behind **HTTPS** in front of the instance (ALB, nginx on another host, Caddy, etc.); the workflow only publishes HTTP on the host ports above.

#### 1A) OS modules to install (fresh instance)

On Amazon Linux 2, after SSH:

```bash
sudo yum update -y
sudo yum install -y git
```

Install Docker (if not already installed):

```bash
sudo yum install -y docker
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ec2-user
```

Log out/in so `ec2-user` picks up the `docker` group.

Optional but recommended for debugging:

```bash
docker --version
git --version
```

### 2) Configure GitHub Actions secrets

In the GitHub repo: **Settings → Secrets and variables → Actions**, add at least:

| Secret | Used for |
|--------|-----------|
| `EC2_HOST` | EC2 public IP or DNS |
| `EC2_KEY` | Private SSH key (PEM) for `ec2-user` |
| `DOCKER_USERNAME` | Docker Hub login to **pull** the image on EC2 |
| `DOCKER_PASSWORD` | Docker Hub token/password |
| `SPRING_DATASOURCE_URL` | JDBC URL (e.g. RDS Postgres) |
| `SPRING_DATASOURCE_USERNAME` | DB user |
| `SPRING_DATASOURCE_PASSWORD` | DB password |
| `CLOUD_AWS_S3_BUCKET_NAME` | S3 bucket for submissions/assets |
| `CLOUD_AWS_CREDENTIAL_ACCESS_KEY` | AWS access key |
| `CLOUD_AWS_CREDENTIAL_SECRET_KEY` | AWS secret key |
| `CLOUD_AWS_REGION` | e.g. `us-east-2` |

Optional **Plagiarism & AI / Ollama** secrets are listed in **Production: GitHub Actions** below.

### 3) Trigger a deploy

- **Automatic:** Push to **`main`** or **`production`** when changed paths include `Client/`, `Server/`, `docs-site/`, `grader/`, `Dockerfile`, etc. (see the workflow `paths` filter).
- **Manual:** **Actions → Docker Deployment for Grade Forge → Run workflow** — pick branch, optionally “deploy as main” on port 8080.

The workflow builds and pushes **`bishwodahal/grade-forge:<branch-name>`**, then SSHs into EC2, pulls that image, ensures RabbitMQ is up, and runs **`docker run`** with your DB/S3/RabbitMQ and LLM env vars.

### Sequence of deployment

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

1. Stop the Grade-Forge container(s) (names depend on workflow/branch), then RabbitMQ if it is co-located:

```bash
docker ps
docker stop grade-forge-main || true
docker stop grade-forge-production || true
docker stop gradeforge-rabbitmq || true
```

2. Verify nothing is listening on the published ports:

```bash
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

### 4) Smoke test

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://<EC2_HOST>:8080/
```

Use **8081** if you deployed the **`production`** branch. Expect HTTP **200** from the app root (same check as `.github/workflows/healthcheck.yml`).

### 5) Optional: Ollama on the same EC2 host

Install Ollama on the **host** (not in the app image), pull a model, then set GitHub secret **`GRADER_LLM_AI_SIGNAL_ENABLED`** to **`true`**. Details: **Production: Ollama + Docker (EC2)**.

### 6) Optional: Nginx reverse proxy + HTTPS (example: `ulm.gradeforge.tech`)

This is a reference layout for **Nginx** on **Amazon Linux / RHEL-style** EC2, with **Route 53** DNS and **Let’s Encrypt**. Nginx listens on **80/443**; your Grade-Forge containers stay on **localhost** ports (no port in the public URL).

**Map proxy ports to whatever you actually run.** The GitHub Actions deploy in this repo typically publishes **`8080`** for `main` and **`8081`** for `production`. Adjust `proxy_pass` to match your `docker run -p` choices.

#### DNS (Route 53)

| Name | Type | Value |
|------|------|--------|
| `ulm.gradeforge.tech` | A | EC2 public IP |
| `www.ulm.gradeforge.tech` | A | EC2 public IP (optional) |

Allow a few minutes for propagation.

#### Security group

- **22** (SSH) — restrict to your IP if possible.
- **80** (HTTP) — `0.0.0.0/0` (for Let’s Encrypt and redirect to HTTPS).
- **443** (HTTPS) — `0.0.0.0/0`.

Do **not** open **8080/8081/8181** publicly if Nginx proxies to them on `localhost` only.

#### Install and smoke-test Nginx

```bash
sudo yum update -y
sudo yum install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1/
```

#### Confirm backends before TLS

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8080/
# Second app (adjust port: 8081 per this repo’s workflow, or 8181 if you use that):
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8081/
```

#### HTTP-only Nginx config first (then Certbot adds TLS)

On Amazon Linux, site snippets often live under **`/etc/nginx/conf.d/`**. Create **`/etc/nginx/conf.d/ulm-gradeforge.conf`** with **HTTP only** first so **`certbot --nginx`** can obtain certificates and install SSL without referencing missing files:

```nginx
# Main app → localhost:8080 (change if your container uses another host port)
server {
    listen 80;
    server_name ulm.gradeforge.tech www.ulm.gradeforge.tech;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Optional: second hostname → second backend on another port (e.g. 8081 for a staging container)
# server {
#     listen 80;
#     server_name staging.ulm.gradeforge.tech;
#     location / {
#         proxy_pass http://127.0.0.1:8081;
#         proxy_http_version 1.1;
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#     }
# }
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

#### Let’s Encrypt (Certbot + Nginx plugin)

```bash
sudo yum install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ulm.gradeforge.tech -d www.ulm.gradeforge.tech
```

Follow prompts: agree to terms, choose **redirect HTTP to HTTPS** when offered. Certbot will adjust the Nginx config and store certs under **`/etc/letsencrypt/live/ulm.gradeforge.tech/`** (first `-d` name).

```bash
sudo nginx -t && sudo systemctl reload nginx
sudo certbot renew --dry-run
```

Renewal is normally handled by a **systemd timer** or **cron** installed with Certbot.

#### Verify

- [https://ulm.gradeforge.tech](https://ulm.gradeforge.tech) → backend on `localhost:8080` (or the port you mapped).
- If you add a second `server` block, open the matching hostname in the browser to confirm the second backend.

---

## Ollama (LLM) for Plagiarism & AI reports

The grader can call a local **[Ollama](https://ollama.com/)**-compatible HTTP API to add **optional LLM evidence** (tags, likeness hints) on top of deterministic heuristics. The Spring server defaults to `http://localhost:11434/api/generate` and model `llama3`.

### 1) Install Ollama

Follow the official installer for your OS: **https://ollama.com/download**

- **Linux** (typical): the site provides a one-line install script, or use your distro’s package if available.
- **macOS / Windows**: use the desktop installer from the same page.

After install, the **`ollama`** CLI should be on your `PATH`, and the daemon should listen on **`127.0.0.1:11434`** by default.

### 2) Pull a model

The backend default is **`llama3`**. Pull it once before running reports:

```bash
ollama pull llama3
```

### 3) Check that Ollama responds

```bash
curl -s http://localhost:11434/api/tags
```

You should see JSON listing your pulled models. If this fails, start the Ollama app/service, then retry.

### 4) Wire Grade-Forge (Server)

With **`mvn spring-boot:run`** from **`Server/`**, defaults already point at local Ollama. Optional overrides (environment or `Server/.env`):

| Variable | Role | Default |
|----------|------|--------|
| `GRADER_LLM_AI_SIGNAL_ENABLED` | Turn LLM layer on/off | `true` |
| `GRADER_LLM_AI_SIGNAL_URL` | Generate API URL | `http://localhost:11434/api/generate` |
| `GRADER_LLM_AI_SIGNAL_MODEL` | Model name Ollama serves | `llama3` |
| `GRADER_LLM_AI_SIGNAL_TIMEOUT_SEC` | HTTP timeout (seconds) | `30` |

Set **`GRADER_LLM_AI_SIGNAL_ENABLED=false`** if you do not want the server to call Ollama (heuristics and similarity still run).

Other knobs (token budget, optional student cap, score weight) are documented in comments in `Server/src/main/resources/application.properties` and `Server/env.example`.

### 5) Docker / remote Ollama

- If the **Java server runs in Docker** but Ollama runs on the **host**, `localhost` inside the container is wrong. Use your host’s address (e.g. `http://host.docker.internal:11434/api/generate` on Docker Desktop) or the machine’s LAN IP, and set **`GRADER_LLM_AI_SIGNAL_URL`** accordingly.
- Ensure the grader host can reach that URL from the process that runs `python` (same machine as the Spring app in typical dev).

### 6) Grader-only (CLI)

To exercise the pipeline without the UI, from **`grader/`** with the same env vars (or defaults), see **`grader/README.md`** (optional LLM rationale env vars are separate from the AI-signal layer used in reports).

---

## Production: Ollama + Docker (EC2)

The **deploy workflow** (`.github/workflows/deploy.yml`) always passes **`GRADER_LLM_AI_SIGNAL_*`** into the app container. **`--add-host=host.docker.internal:host-gateway`** is already set so the container can reach Ollama on the **same EC2 host** at `http://host.docker.internal:11434`.

### Host setup (when LLM is enabled)

1. Install Ollama on the EC2 instance (**not** inside the Grade-Forge image): https://ollama.com/download  
2. `ollama pull <model>` (e.g. `llama3`) — name must match **`GRADER_LLM_AI_SIGNAL_MODEL`**.  
3. If the container cannot connect, configure Ollama to listen on all interfaces **only** with **no public exposure** of port 11434 (use security groups / firewall). Example: set **`OLLAMA_HOST=0.0.0.0:11434`** for the `ollama` service, then restart.  
4. **Never** open `11434` to `0.0.0.0/0`. Prefer VPC-private access only.

If Ollama runs on **another** host, set secret **`GRADER_LLM_AI_SIGNAL_URL`** to that private URL (e.g. `http://10.0.1.50:11434/api/generate`).

### Production: GitHub Actions (repository secrets)

Configure under **Settings → Secrets and variables → Actions**. Optional secrets (if omitted, deploy uses the **Default** below):

| Secret | Default when unset | Purpose |
|--------|-------------------|---------|
| `GRADER_LLM_AI_SIGNAL_ENABLED` | `false` | Set to `true` after Ollama is installed on the host. |
| `GRADER_LLM_AI_SIGNAL_URL` | `http://host.docker.internal:11434/api/generate` | Ollama **generate** endpoint (must be reachable from the container). |
| `GRADER_LLM_AI_SIGNAL_MODEL` | `llama3` | Model name as shown by `ollama list`. |
| `GRADER_LLM_AI_SIGNAL_TIMEOUT_SEC` | `120` | HTTP timeout for large classes or slower hardware. |

With **`GRADER_LLM_AI_SIGNAL_ENABLED=false`**, similarity and heuristic AI triage still run; only the optional LLM layer is skipped (safe until Ollama is ready).

## Notes

- If you’re missing AWS credentials locally, you can still run most UI flows; S3-backed submission file downloads will fail without `CLOUD_AWS_*` env vars.
- Docker cleanup (build cache/images/containers) on a dev box or EC2 host:
  - `docker system prune -a` (add `--volumes` if you really want to remove volumes)
  - `docker builder prune -a`
- If you need Node via nvm, install it like this:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
. "$HOME/.nvm/nvm.sh"
nvm install 24
```

## Summary

**Local dev:** start Postgres → `docker compose up -d` → run `Server` → run `Client`. Optional docs: see **Documentation (VitePress, optional)** above. Optional Ollama: see **Ollama (LLM)** above.

**Production:** EC2 + Docker + GitHub Actions — see **Production deployment (EC2 + GitHub Actions)**. Optional **Nginx + HTTPS** on the same host: **Optional: Nginx reverse proxy + HTTPS** in that section. LLM env vars and optional Ollama on the host: **Production: Ollama + Docker (EC2)** and **Production: GitHub Actions**.
