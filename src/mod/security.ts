// src/mod/security.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import crypto from 'crypto';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    interface RateLimitRecord {
        count               : number;
        reset               : number;
    }

    interface CsrfTokenData {
        sessionId           : string;
        expires             : number;
    }

    interface RequestLogEntry {
        timestamp           : string;
        method              : string;
        path                : string;
        ip                  : string;
        status              : number;
        duration            : number;
    }

    interface SecurityStats {
        rateLimitEntries    : number;
        csrfTokens          : number;
        requestLogs         : number;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class SecurityManager {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            private rateLimitStore  = new Map<string, RateLimitRecord>();
            private csrfTokens      = new Map<string, CsrfTokenData>();
            private requestLog      = new Map<string, RequestLogEntry>();

            private readonly MAX_REQUEST_LOG_SIZE = 1000;

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── MAIN ──────────────────────────────┐

            // Rate Limiting with proper overflow handling
            checkRateLimit(key: string, max: number, windowMs: number): boolean {
                const now = Date.now();
                const record = this.rateLimitStore.get(key);

                if (record) {
                    if (now < record.reset) {
                        // Within the current window
                        if (record.count >= max) {
                            return false; // Rate limit exceeded
                        }
                        record.count++;
                        return true;
                    } else {
                        // Window expired, reset
                        this.rateLimitStore.set(key, { count: 1, reset: now + windowMs });
                        return true;
                    }
                } else {
                    // First request for this key
                    this.rateLimitStore.set(key, { count: 1, reset: now + windowMs });
                    return true;
                }
            }

            // Cleanup old rate limit records
            cleanupRateLimit(): void {
                const now = Date.now();
                for (const [key, record] of this.rateLimitStore.entries()) {
                    if (now > record.reset) {
                        this.rateLimitStore.delete(key);
                    }
                }
            }

            // CSRF Token Generation with TTL
            generateCsrfToken(sessionId: string, ttl = 3600000): string {
                const token = crypto.randomBytes(32).toString('hex');
                this.csrfTokens.set(token, {
                    sessionId,
                    expires: Date.now() + ttl
                });
                return token;
            }

            // Validate CSRF Token with expiration check
            validateCsrfToken(token: string, sessionId: string): boolean {
                const stored = this.csrfTokens.get(token);

                if (!stored) {
                    return false;
                }

                // Check if token has expired
                if (Date.now() > stored.expires) {
                    this.csrfTokens.delete(token);
                    return false;
                }

                // Validate session ID
                if (stored.sessionId === sessionId) {
                    this.csrfTokens.delete(token); // One-time use
                    return true;
                }

                return false;
            }

            // Cleanup expired CSRF tokens
            cleanupCsrfTokens(): void {
                const now = Date.now();
                for (const [token, data] of this.csrfTokens.entries()) {
                    if (now > data.expires) {
                        this.csrfTokens.delete(token);
                    }
                }
            }

            // HTML Sanitization - comprehensive
            sanitizeHtml(html: string): string {
                if (!html) return '';

                return html
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#x27;')
                    .replace(/\//g, '&#x2F;');
            }

            // SQL Injection Prevention
            sanitizeSql(input: string): string {
                if (!input) return '';

                return input
                    .replace(/\\/g, '\\\\')  // Escape backslashes first
                    .replace(/;/g, '')       // Remove semicolons to prevent multi-statement injection
                    .replace(/'/g, "''")     // Escape single quotes (SQL standard)
                    .replace(/"/g, '\\"')    // Escape double quotes
                    // eslint-disable-next-line no-control-regex
                    .replace(/\u0000/g, ''); // Remove null bytes
            }

            // Log request for audit trail with size limit
            logRequest(
                id: string,
                method: string,
                path: string,
                ip: string,
                status: number,
                duration: number
            ): void {
                this.requestLog.set(id, {
                    timestamp: new Date().toISOString(),
                    method,
                    path,
                    ip,
                    status,
                    duration
                });

                // Keep only last MAX_REQUEST_LOG_SIZE requests
                if (this.requestLog.size > this.MAX_REQUEST_LOG_SIZE) {
                    const { value: first } = this.requestLog.keys().next() || { value: null };
                    if (first) {
                        this.requestLog.delete(first);
                    }
                }
            }

            // Get request log by ID
            getRequestLog(id: string): RequestLogEntry | undefined {
                return this.requestLog.get(id);
            }

            // Get all request logs
            getAllRequestLogs(): RequestLogEntry[] {
                return Array.from(this.requestLog.values());
            }

            // Clear all
            clearAll(): void {
                this.rateLimitStore.clear();
                this.csrfTokens.clear();
                this.requestLog.clear();
            }

            // Get stats
            getStats(): SecurityStats {
                return {
                    rateLimitEntries: this.rateLimitStore.size,
                    csrfTokens: this.csrfTokens.size,
                    requestLogs: this.requestLog.size
                };
            }

        // └────────────────────────────────────────────────────────────────────┘

    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝