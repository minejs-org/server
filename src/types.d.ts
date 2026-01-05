// src/types.d.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { DB } from '@je-es/sdb';
    import type { I18nManager, I18nConfig, TranslationSet } from '@minejs/i18n';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗


    export type HttpMethod      = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
    export type RouteHandler    = (c: AppContext) => Response | Promise<Response>;
    export type AppMiddleware   = (c: AppContext, next: () => Promise<void>) => void | Promise<void>;

    export interface AppContext {
        ip              : string;
        request         : Request;
        params          : Record<string, string>;
        query           : Record<string, string>;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body            : any;
        headers         : Headers;
        db              : DB | undefined;
        logger          : Logger | null;
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

    export interface StaticConfig {
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

    export interface CookieOptions {
        maxAge?         : number;
        expires?        : Date;
        path?           : string;
        domain?         : string;
        secure?         : boolean;
        httpOnly?       : boolean;
        sameSite?       : 'Strict' | 'Lax' | 'None';
    }

    export interface ValidationSchema {
        body?: unknown;
        query?: unknown;
        params?: unknown;
    }

    export interface RouteDefinition {
        method          : HttpMethod | HttpMethod[];
        path            : string;
        handler         : RouteHandler;
        validate?       : ValidationSchema;
        middlewares?    : AppMiddleware[];
        timeout?        : number;
        rateLimit?      : { max: number; windowMs: number };
        cache?          : number;
        tags?           : string[];
    }

    // Database types
    export interface DatabaseConfig {
        name?           : string;
        connection      : string;    // File path or ':memory:'
        schema?         : Record<string, unknown>;
        timeout?        : number;
    }

    export interface SecurityConfig {
        cors?           : boolean | CorsConfig;
        rateLimit?      : boolean | RateLimitConfig;
        csrf?           : boolean | CsrfConfig;
        helmet?         : boolean | HelmetConfig;
        auth?           : boolean | AuthConfig;
        validation?     : boolean;
        sanitize?       : boolean;
    }

    export interface CorsConfig {
        origin?         : string | string[] | ((origin: string) => boolean);
        methods?        : HttpMethod[];
        allowedHeaders? : string[];
        credentials?    : boolean;
        maxAge?         : number;
    }

    export interface RateLimitConfig {
        windowMs?       : number;
        max?            : number;
        keyGenerator?   : (c: AppContext) => string;
        message?        : string;
    }

    export interface CsrfConfig {
        secret?         : string;
        headerName?     : string;
        tokenTTL?       : number;
    }

    export interface HelmetConfig {
        contentSecurityPolicy?  : Record<string, string[]> | boolean;
        hsts?                   : boolean | { maxAge?: number; includeSubDomains?: boolean; preload?: boolean };
        frameguard?             : boolean | { action: 'deny' | 'sameorigin' };
        noSniff?                : boolean;
        xssFilter?              : boolean;
        referrerPolicy?         : string | boolean;
    }

    export interface AuthConfig {
        jwt?            : boolean | { secret: string; expiresIn?: string };
        apiKey?         : boolean | { header?: string };
        bearer?         : boolean;
    }

    export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

    export interface LoggingConfig {
        level?: LogLevel;
        pretty?: boolean;
    }

    export interface ServerConfig {
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
        static?         : StaticConfig | StaticConfig[];

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

    export interface ServerInstance {
        app             : unknown;
        logger          : Logger | null;
        db              : Map<string, unknown>;
        bunServer       : unknown;
        start           : () => Promise<void>;
        stop            : () => Promise<void>;
        addRoute        : (route: RouteDefinition) => void;
        addRoutes       : (routes: RouteDefinition[]) => void;
        getRoutes       : () => RouteDefinition[];
    }

    export interface Logger {
        debug   (data: unknown, msg?: string): void;
        info    (data: unknown, msg?: string): void;
        warn    (data: unknown, msg?: string): void;
        error   (data: unknown, msg?: string): void;
        fatal   (data: unknown, msg?: string): void;
    }

    export class AppError extends Error {
        constructor(public message: string, public statusCode: number = 500, public code?: string) {
            super(message);
            this.name = 'AppError';
        }
    }

    export class ValidationError extends AppError {
        constructor(message: string, public issues?: unknown) {
            super(message, 400, 'VALIDATION_ERROR');
            this.name = 'ValidationError';
        }
    }

    export class DatabaseError extends AppError {
        constructor(message: string) {
            super(message, 500, 'DATABASE_ERROR');
            this.name = 'DatabaseError';
        }
    }

    export class TimeoutError extends AppError {
        constructor(message = 'Request timeout') {
            super(message, 408, 'TIMEOUT_ERROR');
            this.name = 'TimeoutError';
        }
    }

    export class RateLimitError extends AppError {
        constructor(message = 'Too many requests') {
            super(message, 429, 'RATE_LIMIT_ERROR');
            this.name = 'RateLimitError';
        }
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝