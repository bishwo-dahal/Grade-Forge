# Grade-Forge – Development setup

Quick way to run the project. Right now we only need **RabbitMQ** via Docker; database and other config use your existing setup.

## 1. Start RabbitMQ

From the **project root**:

```bash
docker compose up -d
```

That starts RabbitMQ on **localhost:5672** (user: `guest`, password: `guest`). Optional UI: http://localhost:15672

Check it’s running:

```bash
docker compose ps
```

## 2. Run the backend

```bash
cd Server
mvn spring-boot:run
```

API: **http://localhost:8080**

(Use your existing database and config; the app expects RabbitMQ at localhost:5672.)

## 3. Run the frontend

```bash
cd Client
npm install
npm run dev
```

Open the URL from the terminal (usually **http://localhost:5173**).

---

**Summary:** `docker compose up -d` → run Server → run Client. 
