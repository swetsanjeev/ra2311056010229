"use strict";
/**
 * Logging Middleware
 * A reusable logging package that sends structured logs to the Affordmed Test Server.
 * Captures the full lifecycle of application events - debug, info, warn, error, fatal.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.frontendLogger = exports.logger = void 0;
exports.configureLogger = configureLogger;
exports.Log = Log;
const LOG_API_URL = "http://20.207.122.201/evaluation-service/logs";
let _authToken = "";
/**
 * Configure the logger with an authorization token.
 * Must be called before using Log().
 */
function configureLogger(config) {
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
async function Log(stack, level, pkg, message) {
    if (!_authToken) {
        console.error("[Logger] authToken not configured. Call configureLogger() first.");
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
            console.error(`[Logger] Failed to send log. Status: ${response.status}`, payload);
            return null;
        }
        const data = await response.json();
        return data;
    }
    catch (err) {
        // Network-level failure - fallback to console to avoid silent loss
        console.error("[Logger] Network error while sending log:", err, payload);
        return null;
    }
}
/**
 * Convenience wrappers for each log level.
 * Use these for cleaner call sites in your application code.
 */
exports.logger = {
    debug: (pkg, message) => Log("backend", "debug", pkg, message),
    info: (pkg, message) => Log("backend", "info", pkg, message),
    warn: (pkg, message) => Log("backend", "warn", pkg, message),
    error: (pkg, message) => Log("backend", "error", pkg, message),
    fatal: (pkg, message) => Log("backend", "fatal", pkg, message),
};
exports.frontendLogger = {
    debug: (pkg, message) => Log("frontend", "debug", pkg, message),
    info: (pkg, message) => Log("frontend", "info", pkg, message),
    warn: (pkg, message) => Log("frontend", "warn", pkg, message),
    error: (pkg, message) => Log("frontend", "error", pkg, message),
    fatal: (pkg, message) => Log("frontend", "fatal", pkg, message),
};
//# sourceMappingURL=logger.js.map