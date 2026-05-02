/**
 * Logging Middleware
 * A reusable logging package that sends structured logs to the Affordmed Test Server.
 * Captures the full lifecycle of application events - debug, info, warn, error, fatal.
 */

const LOG_API_URL = "http://20.207.122.201/evaluation-service/logs";

type Stack = "backend" | "frontend";
type Level = "debug" | "info" | "warn" | "error" | "fatal";
type BackendPackage =
  | "cache"
  | "controller"
  | "cron_job"
  | "db"
  | "domain"
  | "handler"
  | "repository"
  | "route"
  | "service"
  | "auth"
  | "config"
  | "middleware"
  | "utils";
type FrontendPackage =
  | "api"
  | "component"
  | "hook"
  | "page"
  | "state"
  | "style"
  | "auth"
  | "config"
  | "middleware"
  | "utils";
type Package = BackendPackage | FrontendPackage;

interface LogResponse {
  logID: string;
  message: string;
}

interface LoggerConfig {
  authToken: string;
}

let _authToken: string = "";

/**
 * Configure the logger with an authorization token.
 * Must be called before using Log().
 */
export function configureLogger(config: LoggerConfig): void {
  _authToken = config.authToken;
}

/**
 * Core logging function. Sends a structured log entry to the Affordmed test server.
 *
 * @param stack   - "backend" or "frontend"
 * @param level   - severity level: debug | info | warn | error | fatal
 * @param pkg     - the application package/layer generating the log
 * @param message - descriptive message about the event
 * @returns       - Promise resolving to the server's log response
 *
 * @example
 * // Log a successful DB write
 * await Log("backend", "info", "db", "User record inserted successfully - userId=abc123");
 *
 * // Log an error in the handler layer
 * await Log("backend", "error", "handler", "received string, expected bool");
 */
export async function Log(
  stack: Stack,
  level: Level,
  pkg: Package,
  message: string
): Promise<LogResponse | null> {
  if (!_authToken) {
    console.error(
      "[Logger] authToken not configured. Call configureLogger() first."
    );
    return null;
  }

  const payload = {
    stack,
    level,
    package: pkg,
    message,
  };

  try {
    const response = await fetch(LOG_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${_authToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Use console.error as fallback only when the log API itself fails
      console.error(
        `[Logger] Failed to send log. Status: ${response.status}`,
        payload
      );
      return null;
    }

    const data: LogResponse = await response.json() as LogResponse;
    return data;
  } catch (err) {
    // Network-level failure - fallback to console to avoid silent loss
    console.error("[Logger] Network error while sending log:", err, payload);
    return null;
  }
}

/**
 * Convenience wrappers for each log level.
 * Use these for cleaner call sites in your application code.
 */
export const logger = {
  debug: (pkg: Package, message: string) =>
    Log("backend", "debug", pkg, message),
  info: (pkg: Package, message: string) =>
    Log("backend", "info", pkg, message),
  warn: (pkg: Package, message: string) =>
    Log("backend", "warn", pkg, message),
  error: (pkg: Package, message: string) =>
    Log("backend", "error", pkg, message),
  fatal: (pkg: Package, message: string) =>
    Log("backend", "fatal", pkg, message),
};

export const frontendLogger = {
  debug: (pkg: FrontendPackage, message: string) =>
    Log("frontend", "debug", pkg, message),
  info: (pkg: FrontendPackage, message: string) =>
    Log("frontend", "info", pkg, message),
  warn: (pkg: FrontendPackage, message: string) =>
    Log("frontend", "warn", pkg, message),
  error: (pkg: FrontendPackage, message: string) =>
    Log("frontend", "error", pkg, message),
  fatal: (pkg: FrontendPackage, message: string) =>
    Log("frontend", "fatal", pkg, message),
};
