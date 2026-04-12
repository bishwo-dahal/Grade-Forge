# For developers

This page is **not** the user manual. End users should start at [Overview](./overview).

## API exploration

The Spring Boot app exposes **OpenAPI** and **Swagger UI** when enabled (paths are allowed without login in the default security config):

- **Swagger UI:** `/swagger-ui.html` and under `/swagger-ui/`
- **OpenAPI JSON:** `/v3/api-docs`

Use your deployed **origin** in front of these paths (for example `https://gradeforge.tech/swagger-ui.html`). Self-hosted installs replace the host with their own.

REST APIs live under **`/api/...`** and usually require a **Bearer token** from sign-in.

## Repository and setup

- **Source:** [github.com/bishwo-dahal/Grade-Forge](https://github.com/bishwo-dahal/Grade-Forge)
- **Local run, Docker, secrets, Ollama:** [SETUP.md](https://github.com/bishwo-dahal/Grade-Forge/blob/main/SETUP.md) in the repo root

## User manual location in the app

Built manual files ship with the backend under **`/docs/`** (VitePress `base` is `/docs/`).

No Java package tour or endpoint-by-endpoint list is maintained here; use Swagger for live contracts.
