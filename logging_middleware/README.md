# Logging Middleware

A reusable TypeScript logging package that sends structured logs to the evaluation test server.

## Installation

```bash
npm install
npm run build
```

## Usage

```typescript
import { configureLogger, Log, logger } from "./logger";

// 1. Configure with your auth token (obtained from /evaluation-service/auth)
configureLogger({ authToken: "YOUR_BEARER_TOKEN" });

// 2. Use the Log function directly
await Log("backend", "info", "service", "Application started successfully");
await Log("backend", "error", "handler", "received string, expected bool");
await Log("backend", "fatal", "db", "Critical database connection failure.");

// 3. Or use convenience wrappers
await logger.info("controller", "GET /users called - returning 42 records");
await logger.warn("cache", "Cache miss for key user:1042 - falling back to DB");
await logger.error("service", "Payment processing failed - orderId=xyz, reason=timeout");
```

## Log Function Signature

```typescript
Log(stack: Stack, level: Level, package: Package, message: string): Promise<LogResponse | null>
```

### Stack Values
- `"backend"`
- `"frontend"`

### Level Values
- `"debug"` — verbose diagnostic information
- `"info"` — normal operational events
- `"warn"` — potential issues that don't break functionality
- `"error"` — recoverable errors that need attention
- `"fatal"` — unrecoverable errors / application crash

### Package Values (Backend)
`cache` | `controller` | `cron_job` | `db` | `domain` | `handler` | `repository` | `route` | `service` | `auth` | `config` | `middleware` | `utils`

### Package Values (Frontend)
`api` | `component` | `hook` | `page` | `state` | `style` | `auth` | `config` | `middleware` | `utils`

## Integration Strategy

Integrate `Log()` calls at all meaningful application lifecycle points:

- **Service layer**: log business logic outcomes, validation failures
- **DB layer**: log query execution, connection events, transaction results
- **Handler/Controller**: log incoming requests, response statuses
- **Cache**: log hit/miss events and eviction
- **Cron jobs**: log job start, completion, and failures
- **Auth**: log authentication attempts and token validation
