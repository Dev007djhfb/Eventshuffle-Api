# EventShuffle API

A NestJS backend for collaborative event scheduling and voting, demonstrating modern backend architecture patterns including clean architecture, domain-driven design, and comprehensive observability.

Built with strong type safety and containerized deployment for technical evaluation purposes.

## Problem & Solution

EventShuffle solves the common challenge of coordinating group events where participants have different availability. Instead of endless email chains or chat messages, it provides:

- **Event Creation** - Organizers propose multiple date options
- **Democratic Voting** - Participants vote on their preferred dates
- **Optimal Date Selection** - Algorithm finds dates that work for the most people

## What This Demonstrates

- **Clean Architecture** - Domain-driven design with clear separation of concerns
- **Type Safety** - End-to-end TypeScript with runtime validation via Zod
- **Containerization** - Docker setup with security best practices
- **Testing Strategy** - Unit and integration tests with proper isolation
- **API Design** - RESTful endpoints with OpenAPI documentation
- **Observability** - Health checks, structured logging, and metrics

## 🚀 Quick Start

### Prerequisites

- Docker
- Docker Compose

```bash
git clone https://github.com/Dev007djhfb/Eventshuffle-Api
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

## Example Usage

```bash
# Create an event
curl -X POST http://localhost:3000/api/v1/event \
  -H "Content-Type: application/json" \
  -d '{"name": "Team Lunch", "dates": ["2026-03-15", "2026-03-16"]}'

# Vote on dates
curl -X POST http://localhost:3000/api/v1/event/{id}/vote \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "votes": ["2026-03-15"]}'

# Get optimal dates
curl http://localhost:3000/api/v1/event/{id}/results
```

## System Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│  NestJS API │───▶│ PostgreSQL  │
│             │    │             │    │             │
│ REST/Swagger│    │ Clean Arch  │    │ ACID Trans  │
└─────────────┘    └─────────────┘    └─────────────┘
                           │
                           ▼
                   ┌─────────────┐
                   │Observability│
                   │Health+Metric│
                   └─────────────┘
```

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

### Implementation Features

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

### Architecture Approach

This codebase demonstrates domain-driven design principles, organizing code around business domains (events, voting) rather than technical layers. NestJS provides the foundation with TypeScript support, dependency injection, and a scalable module system.

### Key Technology Choices

- **Drizzle ORM** - Type-safe database queries without code generation
- **PostgreSQL** - ACID transactions for voting consistency
- **Zod** - Runtime validation with TypeScript integration
- **Docker** - Containerized deployment with security best practices

## Assignment Notes

This implementation demonstrates:

- **Scalable Architecture** - Modular design supporting future feature growth
- **Enterprise Patterns** - Repository pattern, dependency injection, clean architecture
- **Operational Excellence** - Comprehensive testing, observability, containerization
