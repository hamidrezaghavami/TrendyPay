# 💳 Trendyol-Style Payment & Order Microservices Platform

A high-performance, modular backend architecture simulating an e-commerce checkout, payment processing, and internal wallet ledger system. Built with **Node.js**, **gRPC**, **Protocol Buffers**, **PostgreSQL**, **Redis**, and containerized with **Docker & Docker Compose**.

---

## 📌 Overview

This project showcases a clean microservices architecture designed to handle high-concurrency order checkouts and wallet transactions with strict transactional integrity, idempotency, and low-latency RPC inter-service communication.

### Key Highlights
- **Binary gRPC Communication:** High-throughput, type-safe RPC calls using Protocol Buffers (`.proto`) between services.
- **REST / HTTP API Gateway:** Translates external client requests into internal binary gRPC calls.
- **Transactional Double-Entry Wallet Ledger:** ACID-compliant balance updates using PostgreSQL row-level locks (`SELECT ... FOR UPDATE`).
- **Distributed Idempotency:** Redis-backed idempotency layer preventing duplicate charges during network retries.
- **Containerized Environment:** Fully orchestrated multi-container setup via Docker Compose.
- **Automated Testing & Benchmarking:** Unit/integration tests with **Jest** and load/stress testing with **k6**.

---

## 🏗 System Architecture

```
                       ┌─────────────────────────┐
                       │   Client / Postman / UI │
                       └────────────┬────────────┘
                                    │ HTTP / REST (JSON)
                                    ▼
                       ┌─────────────────────────┐
                       │       API Gateway       │
                       │  (Express / Fastify)    │
                       └──────┬────────────┬─────┘
                              │            │
             gRPC (Protobuf)  │            │  gRPC (Protobuf)
                              ▼            ▼
             ┌──────────────────┐        ┌──────────────────┐
             │  Order Service   │───────►│ Payment Service  │
             │                  │  gRPC  │                  │
             └────────┬─────────┘        └────────┬─────────┘
                      │                           │
                      │                           │ gRPC
                      │                           ▼
                      │                  ┌──────────────────┐
                      │                  │  Wallet Service  │
                      │                  │ (Ledger Engine)  │
                      │                  └────────┬─────────┘
                      │                           │
                      ▼                           ▼
             ┌──────────────────┐        ┌──────────────────┐
             │   PostgreSQL     │        │   PostgreSQL     │
             │   (Orders DB)    │        │   (Wallet DB)    │
             └──────────────────┘        └────────┬─────────┘
                                                  │
                                                  ▼
                                         ┌──────────────────┐
                                         │  Redis (Locks /  │
                                         │  Idempotency)    │
                                         └──────────────────┘
```

---

## 📁 Project File Structure

```text
├── TrendyPay/ 
├── docker-compose.yml              # Local multi-service orchestration
├── .env                            # Global environment template
├── README.md                       # Project documentation
│
├── proto/                          # Shared Protocol Buffer definitions
│   ├── order.proto                 # Order service contracts
│   ├── payment.proto               # Payment processing contracts
│   └── wallet.proto                # Wallet & ledger contracts
│
├── services/
│   ├── api-gateway/                # Public-facing REST Gateway
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── clients/            # gRPC client stubs (Order, Payment, Wallet)
│   │   │   ├── controllers/        # HTTP route controllers
│   │   │   ├── routes/             # REST endpoints (/orders, /wallet, /checkout)
│   │   │   ├── middlewares/        # Auth, error mapper, validation
│   │   │   └── server.js
│   │   └── tests/
│   │       └── gateway.test.js
│   │
│   ├── order-service/              # Order lifecycle & state machine
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── config/             # DB & gRPC server config
│   │   │   ├── db/                 # Migrations, seeds & queries
│   │   │   ├── handlers/           # gRPC method implementations
│   │   │   ├── services/           # Business logic (Order creation, state transitions)
│   │   │   └── index.js
│   │   └── tests/
│   │       └── order.test.js
│   │
│   ├── payment-service/            # Payment gateway & router
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── handlers/           # gRPC payment handlers
│   │   │   ├── providers/          # Wallet provider, mock 3rd-party provider
│   │   │   ├── services/           # Idempotency checks & charge logic
│   │   │   └── index.js
│   │   └── tests/
│   │       └── payment.test.js
│   │
│   └── wallet-service/             # Ledger & atomic balance engine
│       ├── Dockerfile
│       ├── package.json
│       ├── src/
│       │   ├── config/
│       │   ├── db/                 # Ledger tables & migrations
│       │   ├── handlers/           # gRPC balance & debit/credit handlers
│       │   ├── services/           # Atomic balance deduction with row locks
│       │   └── index.js
│       └── tests/
│           └── wallet.test.js
│
├── tests/                          # Root integration & E2E tests
│   ├── e2e/
│   │   └── checkout-flow.test.js   # End-to-end checkout & balance verification (Jest)
│   └── load/                       # Performance testing with k6
│       ├── checkout-load.js        # High-concurrency checkout stress test
│       └── wallet-contention.js    # Concurrent debit test on single wallet
```

---

## 🧰 Tech Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Runtime** | Node.js (LTS) | Fast, asynchronous event-driven I/O |
| **Inter-Service Protocol**| gRPC + Protobuf | Low-latency binary serialization and strict API contracts |
| **API Gateway** | Express | HTTP/REST endpoints for client applications |
| **Primary Databases** | PostgreSQL | ACID-compliant relational storage for orders and ledger entries |
| **Cache & Locks** | Redis | Fast distributed lock acquisition & idempotency key caching |
| **Containerization** | Docker & Docker Compose | Isolated, reproducible development and execution environments |
| **Unit & E2E Testing** | Jest | Unit tests, mock stubs, and end-to-end assertions |
| **Load Testing** | k6 (Grafana) | Concurrency benchmarks, latency monitoring, and stress testing |

---

## 🚀 Getting Started

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/) installed.
- [Node.js (v20+)](https://nodejs.org/) *(optional for local development outside containers)*.
- [k6](https://k6.io/docs/get-started/installation/) *(optional for running load tests)*.

### 1. Clone & Configure Environment
```bash
git clone https://github.com/your-username/payment-microservices.git
cd payment-microservices

# Copy global environment variables
cp .env.example .env
```

### 2. Start All Services with Docker Compose
Run the entire platform (Databases, Redis, gRPC microservices, and API Gateway) with a single command:

```bash
docker compose up --build -d
```

Check the status of running containers:
```bash
docker compose ps
```

---

## 📡 Core API Endpoints (Gateway)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/orders` | Creates a new pending order |
| `POST` | `/api/v1/orders/:id/checkout` | Processes checkout payment for an order |
| `GET` | `/api/v1/wallet/balance?userId=...` | Retrieves user's current simulated wallet balance |
| `POST` | `/api/v1/wallet/topup` | Adds funds to the user's wallet |

---

## 🧪 Testing & Quality Assurance

### 1. Unit & Integration Tests (Jest)
Run unit tests across all microservices or execute the full test suite:

```bash
# Run tests across all individual services
npm test

# Run End-to-End checkout scenario test
npm run test:e2e
```

### 2. High-Concurrency Load Testing (k6)
Simulate thousands of concurrent checkout operations to verify transactional locks and idempotency behavior:

```bash
# Run checkout load test (50 Virtual Users over 30s)
k6 run tests/load/checkout-load.js

# Test wallet concurrency & prevent race conditions
k6 run tests/load/wallet-contention.js
```

---

## 🛡 Fault Tolerance & Design Patterns

1. **Idempotency Keys:** Every checkout request accepts an `Idempotency-Key` header. Duplicate requests with the same key return the cached response without double-debiting.
2. **Row-Level Locking:** Uses PostgreSQL's `SELECT ... FOR UPDATE` inside `wallet-service` to serialize balance deductions per user account, preventing negative balances during race conditions.
3. **Graceful gRPC Error Propagation:** Internal gRPC status codes (`NOT_FOUND`, `FAILED_PRECONDITION`, `ALREADY_EXISTS`) are systematically mapped to HTTP 4xx/5xx status codes at the API Gateway.