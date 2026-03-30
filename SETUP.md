# Grade-Forge – Setup

## Prerequisites

- Java **21** (JDK)
- Maven **3.9.x**
- Node.js **18+** (recommended: latest LTS)
- Docker (for RabbitMQ; also used by “run tests” in some environments)

## Run locally (dev)

### 1) Start RabbitMQ

From the project root:

```bash
docker compose up -d
```

RabbitMQ runs on:
- AMQP: `localhost:5672` (user/pass: `guest` / `guest`)
- UI: `http://localhost:15672`

### 2) Run the backend

```bash
cd Server
mvn spring-boot:run
```

API: `http://localhost:8080`

### 3) Run the frontend

```bash
cd Client
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

---

## Production deployment (EC2 + GitHub Actions)

The repo builds a **single Docker image** (frontend static assets baked into the Spring Boot JAR) and deploys it to an **EC2** host over SSH. See **`.github/workflows/deploy.yml`**.

### 1) Prepare the EC2 server

- Use **Amazon Linux 2** (or similar) with **`ec2-user`** SSH access.
- Install **Docker** and ensure `ec2-user` can run `docker` (often: `sudo usermod -aG docker ec2-user` and re-login).
- Open inbound ports as needed:
  - **`8080`** — app when deployed from **`main`** (container `grade-forge-main`).
  - **`8081`** — app when deployed from **`production`** branch (container `grade-forge-production`).
  - **`5672` / `15672`** — RabbitMQ if you rely on the workflow-started `gradeforge-rabbitmq` container (the first deploy starts it).

Put the app behind **HTTPS** in front of the instance (ALB, nginx, Caddy, etc.); the workflow only publishes HTTP on the host ports above.

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

- **Automatic:** Push to **`main`** or **`production`** when changed paths include `Client/`, `Server/`, `grader/`, `Dockerfile`, etc. (see the workflow `paths` filter).
- **Manual:** **Actions → Docker Deployment for Grade Forge → Run workflow** — pick branch, optionally “deploy as main” on port 8080.

The workflow builds and pushes **`bishwodahal/grade-forge:<branch-name>`**, then SSHs into EC2, pulls that image, ensures RabbitMQ is up, and runs **`docker run`** with your DB/S3/RabbitMQ and LLM env vars.

### 4) Smoke test

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://<EC2_HOST>:8080/
```

Use **8081** if you deployed the **`production`** branch. Expect HTTP **200** from the app root (same check as `.github/workflows/healthcheck.yml`).

### 5) Optional: Ollama on the same EC2 host

Install Ollama on the **host** (not in the app image), pull a model, then set GitHub secret **`GRADER_LLM_AI_SIGNAL_ENABLED`** to **`true`**. Details: **Production: Ollama + Docker (EC2)**.

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
- If you need Node via nvm, install it like this:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
. "$HOME/.nvm/nvm.sh"
nvm install 24
```

## Summary

**Local dev:** `docker compose up -d` → run `Server` → run `Client`. Optional Ollama: see **Ollama (LLM)** above.

**Production:** EC2 + Docker + GitHub Actions — see **Production deployment (EC2 + GitHub Actions)**. LLM env vars and optional Ollama on the host: **Production: Ollama + Docker (EC2)** and **Production: GitHub Actions**.
