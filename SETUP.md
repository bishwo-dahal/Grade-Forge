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
