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

## Notes

- If you’re missing AWS credentials locally, you can still run most UI flows; S3-backed submission file downloads will fail without `CLOUD_AWS_*` env vars.
- If you need Node via nvm, install it like this:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
. "$HOME/.nvm/nvm.sh"
nvm install 24
```

## Summary

`docker compose up -d` → run `Server` → run `Client`.
