# EventShuffle API

EventShuffle API is a production-ready NestJS backend for collaborative event scheduling and voting.
It's built with enterprise-grade architecture, strong type safety, and first-class observability, making it reliable in production and pleasant to maintain.

## 🚀 Quick Start

### Prerequisites

- Docker
- Docker Compose

```bash
git clone <repository-url>
cd eventshuffle-api

# Copy environment variables and customize if needed
cp .env.example .env

# Start everything (app + database)
docker-compose up --build
```

### Access

- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/api/v1/health

## 🏗️ Architecture & Design

### Core Capabilities

- **Event Scheduling** – Create events, collect votes, and compute optimal dates
- **End-to-End Type Safety** – TypeScript throughout, enforced with Zod schemas
- **API Versioning** – `/api/v1/*` with a forward-compatible structure
- **Observability by Default** – Health checks, metrics, structured logging, and tracing

### Architectural Principles

- **Clean Architecture** – Clear separation between domain, application, and infrastructure
- **Domain-Driven Design** – Code organized by business domains, not technical layers
- **Repository Pattern** – Database access abstracted via Drizzle ORM
- **Dependency Injection** – Fully managed by the NestJS IoC container
- **Centralized Error Handling** – Global exception filters with consistent responses
- **Graceful Shutdowns** – Proper cleanup of resources and connections

### Production Readiness

- **Containerized Deployment** – Secure Docker setup with non-root user and proper permissions
- **Automated Testing** – Unit and integration test coverage
- **OpenAPI Documentation** – Auto-generated Swagger specs
- **Request Correlation** – Distributed tracing via correlation IDs
- **Rate Limiting** – Multi-tier throttling to protect critical endpoints

## 🛠️ Tech Stack

| Layer                | Technology               |
| -------------------- | ------------------------ |
| **Framework**        | NestJS + Express         |
| **Database**         | PostgreSQL + Drizzle ORM |
| **Validation**       | Zod                      |
| **Logging**          | Pino (structured logs)   |
| **Testing**          | Jest + Supertest         |
| **Documentation**    | Swagger / OpenAPI        |
| **Containerization** | Docker + Docker Compose  |

## 📋 API Endpoints

### Events

```bash
GET    /api/v1/event/list        # List all events
POST   /api/v1/event             # Create a new event
GET    /api/v1/event/:id         # Retrieve event details with votes
POST   /api/v1/event/:id/vote    # Submit participant votes
GET    /api/v1/event/:id/results # Calculate optimal dates
```

### Observability

```bash
GET    /api/v1/health            # Application health status
GET    /metrics                  # Prometheus-compatible metrics
```

## 🧪 Development Workflow

### Local development (Node.js 18+ required)

```bash
npm install
docker-compose up postgres -d
npm run db:migrate
npm run start:dev
```

### Testing

```bash
npm test                     # All tests (unit + integration)
npm run test:unit            # Unit tests only
npm run test:integration     # Integration tests only
npm run test:cov             # Coverage report
```

## 📊 Observability & Monitoring

- **Health Checks** – Database and service availability
- **Structured Logging** – JSON logs with request context
- **Error Reporting** – Centralized exception handling with metadata
- **Performance Metrics** – Latency, throughput, and error rates
- **Request Tracing** – End-to-end correlation across services

## 🔧 Technical Decisions

### Why NestJS?

NestJS provides a scalable, opinionated architecture with first-class TypeScript support, dependency injection, and a rich ecosystem well-suited for long-lived backend services.

### Why Drizzle ORM?

Drizzle offers strong type safety without code generation, excellent performance, and explicit control over SQL when needed—ideal for predictable, maintainable data access.

### Why PostgreSQL?

PostgreSQL ensures ACID-compliant transactions for voting consistency, strong concurrency guarantees, and flexible JSON support for evolving schemas.

### Domain-Driven Structure

Organizing the codebase around business domains (events, voting) improves maintainability, clarifies ownership, and scales better as the system grows.

---

_Built with modern practices for scalability, maintainability, and production reliability._
