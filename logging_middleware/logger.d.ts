/**
 * Logging Middleware
 * A reusable logging package that sends structured logs to the Affordmed Test Server.
 * Captures the full lifecycle of application events - debug, info, warn, error, fatal.
 */
type Stack = "backend" | "frontend";
type Level = "debug" | "info" | "warn" | "error" | "fatal";
type BackendPackage = "cache" | "controller" | "cron_job" | "db" | "domain" | "handler" | "repository" | "route" | "service" | "auth" | "config" | "middleware" | "utils";
type FrontendPackage = "api" | "component" | "hook" | "page" | "state" | "style" | "auth" | "config" | "middleware" | "utils";
type Package = BackendPackage | FrontendPackage;
interface LogResponse {
    logID: string;
    message: string;
}
interface LoggerConfig {
    authToken: string;
}
/**
 * Configure the logger with an authorization token.
 * Must be called before using Log().
 */
export declare function configureLogger(config: LoggerConfig): void;
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
export declare function Log(stack: Stack, level: Level, pkg: Package, message: string): Promise<LogResponse | null>;
/**
 * Convenience wrappers for each log level.
 * Use these for cleaner call sites in your application code.
 */
export declare const logger: {
    debug: (pkg: Package, message: string) => Promise<LogResponse | null>;
    info: (pkg: Package, message: string) => Promise<LogResponse | null>;
    warn: (pkg: Package, message: string) => Promise<LogResponse | null>;
    error: (pkg: Package, message: string) => Promise<LogResponse | null>;
    fatal: (pkg: Package, message: string) => Promise<LogResponse | null>;
};
export declare const frontendLogger: {
    debug: (pkg: FrontendPackage, message: string) => Promise<LogResponse | null>;
    info: (pkg: FrontendPackage, message: string) => Promise<LogResponse | null>;
    warn: (pkg: FrontendPackage, message: string) => Promise<LogResponse | null>;
    error: (pkg: FrontendPackage, message: string) => Promise<LogResponse | null>;
    fatal: (pkg: FrontendPackage, message: string) => Promise<LogResponse | null>;
};
export {};
//# sourceMappingURL=logger.d.ts.map