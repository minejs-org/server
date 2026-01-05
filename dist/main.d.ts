import { DB } from '@je-es/sdb';
import { I18nManager, I18nConfig } from '@minejs/i18n';
export { I18nConfig, I18nManager, LazyLoader, TranslationSet, TranslationToken, fetchTranslations, getI18n, getLanguage, getSupportedLanguages, loadLanguage, loadTranslations, setLanguage, setupAuto, setupI18n, setupLazy, t, tLang, tParse } from '@minejs/i18n';
export { ColumnDefinition, ColumnType, DB, QueryBuilder, SqlValue, TableSchema, WhereCondition, blob, column, defaultValue, index, integer, notNull, numeric, primaryKey, real, references, table, text, unique } from '@minejs/db';

// src/types.d.ts
//
// Developed with ❤️ by Maysara.



// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗


    type HttpMethod      = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
    type RouteHandler$1    = (c: AppContext) => Response | Promise<Response>;
    type AppMiddleware   = (c: AppContext, next: () => Promise<void>) => void | Promise<void>;

    interface AppContext {
        ip              : string;
        request         : Request;
        params          : Record<string, string>;
        query           : Record<string, string>;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body            : any;
        headers         : Headers;
        db              : DB | undefined;
        logger          : Logger$1 | null;
        i18n            : I18nManager | null;
        lang?           : string;
        user?           : unknown;
        requestId       : string;

        state           : Record<string, unknown>;

        // Response methods
        json        (data: unknown,     status?: number): Response;
        text        (data: string,  status?: number): Response;
        html        (data: string,  status?: number): Response;
        redirect    (url: string,   status?: number): Response;
        file        (path: string,  contentType?: string): Response;

        // Cookie methods
        setCookie       (name: string, value: string, options?: CookieOptions): AppContext;
        getCookie       (name: string): string | undefined;
        deleteCookie    (name: string, options?: Partial<CookieOptions>): AppContext;

        // Header methods
        setHeader(key: string, value: string): AppContext;
        getHeader(key: string): string | undefined;

        // Status code
        status(code: number): AppContext;
        statusCode: number;

        // Internal helper
        _setCookieHeaders(): Record<string, string | string[]>;
    }

    interface StaticConfig$1 {
        path            : string;        // URL path prefix (e.g., '/public' or '/static')
        directory       : string;        // Local directory to serve from
        maxAge?         : number;        // Cache control in seconds (default: 3600)
        index?          : string[];      // Index files (default: ['index.html'])
        dotfiles?       : 'allow' | 'deny' | 'ignore';  // How to handle dotfiles (default: 'deny')
        etag?           : boolean;       // Enable ETag headers (default: true)
        lastModified?   : boolean;       // Enable Last-Modified headers (default: true)
        immutable?      : boolean;       // Add immutable to cache-control (default: false)
        extensions?     : string[];      // Try these extensions if file not found (e.g., ['html', 'htm'])
        fallthrough?    : boolean;       // Continue to next handler if file not found (default: false)
        setHeaders?     : (ctx: AppContext, path: string) => void;  // Custom header setter
    }

    interface CookieOptions {
        maxAge?         : number;
        expires?        : Date;
        path?           : string;
        domain?         : string;
        secure?         : boolean;
        httpOnly?       : boolean;
        sameSite?       : 'Strict' | 'Lax' | 'None';
    }

    interface ValidationSchema {
        body?: unknown;
        query?: unknown;
        params?: unknown;
    }

    interface RouteDefinition {
        method          : HttpMethod | HttpMethod[];
        path            : string;
        handler         : RouteHandler$1;
        validate?       : ValidationSchema;
        middlewares?    : AppMiddleware[];
        timeout?        : number;
        rateLimit?      : { max: number; windowMs: number };
        cache?          : number;
        tags?           : string[];
    }

    // Database types
    interface DatabaseConfig {
        name?           : string;
        connection      : string;    // File path or ':memory:'
        schema?         : Record<string, unknown>;
        timeout?        : number;
    }

    interface SecurityConfig {
        cors?           : boolean | CorsConfig;
        rateLimit?      : boolean | RateLimitConfig;
        csrf?           : boolean | CsrfConfig;
        helmet?         : boolean | HelmetConfig;
        auth?           : boolean | AuthConfig;
        validation?     : boolean;
        sanitize?       : boolean;
    }

    interface CorsConfig {
        origin?         : string | string[] | ((origin: string) => boolean);
        methods?        : HttpMethod[];
        allowedHeaders? : string[];
        credentials?    : boolean;
        maxAge?         : number;
    }

    interface RateLimitConfig {
        windowMs?       : number;
        max?            : number;
        keyGenerator?   : (c: AppContext) => string;
        message?        : string;
    }

    interface CsrfConfig {
        secret?         : string;
        headerName?     : string;
        tokenTTL?       : number;
    }

    interface HelmetConfig {
        contentSecurityPolicy?  : Record<string, string[]> | boolean;
        hsts?                   : boolean | { maxAge?: number; includeSubDomains?: boolean; preload?: boolean };
        frameguard?             : boolean | { action: 'deny' | 'sameorigin' };
        noSniff?                : boolean;
        xssFilter?              : boolean;
        referrerPolicy?         : string | boolean;
    }

    interface AuthConfig {
        jwt?            : boolean | { secret: string; expiresIn?: string };
        apiKey?         : boolean | { header?: string };
        bearer?         : boolean;
    }

    type LogLevel = 'debug' | 'info' | 'warn' | 'error';

    interface LoggingConfig {
        level?: LogLevel;
        pretty?: boolean;
    }

    interface ServerConfig {
        port?           : number | string;
        hostname?       : string;
        requestTimeout? : number;
        maxRequestSize? : number;
        maxJsonSize?    : number;

        database?       : DatabaseConfig | DatabaseConfig[];

        security?       : boolean | SecurityConfig;

        compression?    : boolean | { threshold?: number };

        logging?        : boolean | LoggingConfig;

        // Internationalization (i18n)
        i18n?           : boolean | I18nConfig;

        // Static file serving
        static?         : StaticConfig$1 | StaticConfig$1[];

        routes?         : RouteDefinition[];
        middlewares?    : AppMiddleware[];

        errorHandler?   : (error: Error, context: AppContext) => void | Promise<void>;
        // Error page handler - returns Response for custom error pages
        onError?        : (statusCode: number, path: string, method: string) => Response | Promise<Response>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onStartup?      : (app: any) => void | Promise<void>;
        onReady?        : (app: ServerInstance, db: Map<string, DB>) => void | Promise<void>;
        onShutdown?     : () => void | Promise<void>;

        apiPrefix?      : string;
        apiVersion?     : string;

        gracefulShutdownTimeout?: number;
    }

    interface ServerInstance {
        app             : unknown;
        logger          : Logger$1 | null;
        db              : Map<string, unknown>;
        bunServer       : unknown;
        start           : () => Promise<void>;
        stop            : () => Promise<void>;
        addRoute        : (route: RouteDefinition) => void;
        addRoutes       : (routes: RouteDefinition[]) => void;
        getRoutes       : () => RouteDefinition[];
    }

    interface Logger$1 {
        debug   (data: unknown, msg?: string): void;
        info    (data: unknown, msg?: string): void;
        warn    (data: unknown, msg?: string): void;
        error   (data: unknown, msg?: string): void;
        fatal   (data: unknown, msg?: string): void;
    }

    declare class AppError extends Error {
        constructor(public message: string, public statusCode: number = 500, public code?: string) {
            super(message);
            this.name = 'AppError';
        }
    }

    declare class ValidationError extends AppError {
        constructor(message: string, public issues?: unknown) {
            super(message, 400, 'VALIDATION_ERROR');
            this.name = 'ValidationError';
        }
    }

    declare class DatabaseError extends AppError {
        constructor(message: string) {
            super(message, 500, 'DATABASE_ERROR');
            this.name = 'DatabaseError';
        }
    }

    declare class TimeoutError extends AppError {
        constructor(message = 'Request timeout') {
            super(message, 408, 'TIMEOUT_ERROR');
            this.name = 'TimeoutError';
        }
    }

    declare class RateLimitError extends AppError {
        constructor(message = 'Too many requests') {
            super(message, 429, 'RATE_LIMIT_ERROR');
            this.name = 'RateLimitError';
        }
    }

type RouteHandler = (ctx: AppContext) => Response | Promise<Response>;
interface RouteMatch {
    handler: RouteHandler;
    params: Record<string, string>;
    metadata?: unknown;
}
interface RouteInfo {
    method: string;
    path: string;
    handler: RouteHandler;
}
declare class Router {
    private routes;
    private regexRoutes;
    match(method: string, path: string): RouteMatch | null;
    getAll(): RouteInfo[];
    clear(): void;
    remove(method: string, path: string): boolean;
    register(method: string, path: string, handler: RouteHandler, metadata?: unknown): void;
    private pathToRegex;
}

interface RequestLogEntry {
    timestamp: string;
    method: string;
    path: string;
    ip: string;
    status: number;
    duration: number;
}
interface SecurityStats {
    rateLimitEntries: number;
    csrfTokens: number;
    requestLogs: number;
}
declare class SecurityManager {
    private rateLimitStore;
    private csrfTokens;
    private requestLog;
    private readonly MAX_REQUEST_LOG_SIZE;
    checkRateLimit(key: string, max: number, windowMs: number): boolean;
    cleanupRateLimit(): void;
    generateCsrfToken(sessionId: string, ttl?: number): string;
    validateCsrfToken(token: string, sessionId: string): boolean;
    cleanupCsrfTokens(): void;
    sanitizeHtml(html: string): string;
    sanitizeSql(input: string): string;
    logRequest(id: string, method: string, path: string, ip: string, status: number, duration: number): void;
    getRequestLog(id: string): RequestLogEntry | undefined;
    getAllRequestLogs(): RequestLogEntry[];
    clearAll(): void;
    getStats(): SecurityStats;
}

declare class Logger {
    private level;
    private pretty;
    private prefix;
    private levels;
    private colors;
    constructor(level?: 'debug' | 'info' | 'warn' | 'error', pretty?: boolean, prefix?: string);
    debug(data: unknown, msg?: string): void;
    info(data: unknown, msg?: string): void;
    warn(data: unknown, msg?: string): void;
    error(data: unknown, msg?: string): void;
    fatal(data: unknown, msg?: string): void;
    child(prefix: string): Logger;
    private log;
    private prettyLog;
    private colorizeMethod;
    private colorizeStatus;
    private getLevelIcon;
    private getLevelColor;
}

interface StaticConfig {
    path: string;
    directory: string;
    maxAge?: number;
    index?: string[];
    dotfiles?: 'allow' | 'deny' | 'ignore';
    etag?: boolean;
    lastModified?: boolean;
    immutable?: boolean;
    extensions?: string[];
    fallthrough?: boolean;
    setHeaders?: (ctx: AppContext, path: string) => void;
}
declare class StaticFileServer {
    private config;
    private resolvedDir;
    private fileCache;
    private readonly CACHE_MAX_SIZE;
    constructor(config: StaticConfig);
    /**
     * Create request handler for static files
     */
    handler(): (ctx: AppContext) => Promise<Response>;
    /**
     * Get URL path pattern for router
     */
    getPathPattern(): string;
    private resolveFilePath;
    private isPathSafe;
    private serveDirectory;
    private serveFile;
    private buildHeaders;
    private generateEtag;
    private getMimeType;
    private handleNotFound;
    /**
     * Clear file cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        entries: number;
        maxSize: number;
    };
}
/**
 * Helper function to create static file server
 */
declare function createStatic(config: StaticConfig): StaticFileServer;

declare function server(config?: ServerConfig): ServerInstance;

export { type AppContext, AppError, type AppMiddleware, type AuthConfig, type CookieOptions, type CorsConfig, type CsrfConfig, type DatabaseConfig, DatabaseError, type HelmetConfig, type HttpMethod, type LogLevel, Logger, type LoggingConfig, type RateLimitConfig, RateLimitError, type RouteDefinition, type RouteHandler$1 as RouteHandler, Router, type SecurityConfig, SecurityManager, type ServerConfig, type ServerInstance, type StaticConfig, StaticFileServer, TimeoutError, ValidationError, type ValidationSchema, createStatic, server as default, server };
