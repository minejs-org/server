import { DB } from '@minejs/db';
export { ColumnDefinition, ColumnType, DB, QueryBuilder, SqlValue, TableSchema, WhereCondition, blob, column, defaultValue, index, integer, notNull, numeric, primaryKey, real, references, table, text, unique } from '@minejs/db';
import { I18nManager, I18nConfig } from '@minejs/i18n';
export { I18nConfig, TranslationSet, TranslationToken, genPageTitle, getI18n, getLanguage, getSupportedLanguages, loadLanguage, loadTranslations, setLanguage, setupI18n, t, tLang, tParse } from '@minejs/i18n';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
type RouteHandler$1 = (c: AppContext) => Response | Promise<Response>;
type AppMiddleware = (c: AppContext, next: () => Promise<void>) => void | Promise<void>;
interface AppContext {
    ip: string;
    request: Request;
    params: Record<string, string>;
    query: Record<string, string>;
    body: any;
    headers: Headers;
    db: DB | undefined;
    logger: Logger$1 | null;
    i18n: I18nManager | null;
    lang?: string;
    user?: unknown;
    requestId: string;
    state: Record<string, unknown>;
    json(data: unknown, status?: number): Response;
    text(data: string, status?: number): Response;
    html(data: string, status?: number): Response;
    redirect(url: string, status?: number): Response;
    file(path: string, contentType?: string): Response;
    setCookie(name: string, value: string, options?: CookieOptions): AppContext;
    getCookie(name: string): string | undefined;
    deleteCookie(name: string, options?: Partial<CookieOptions>): AppContext;
    setHeader(key: string, value: string): AppContext;
    getHeader(key: string): string | undefined;
    status(code: number): AppContext;
    statusCode: number;
    _setCookieHeaders(): Record<string, string | string[]>;
}
interface StaticConfig$1 {
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
interface CookieOptions {
    maxAge?: number;
    expires?: Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
}
interface ValidationSchema {
    body?: unknown;
    query?: unknown;
    params?: unknown;
}
interface RouteDefinition {
    method: HttpMethod | HttpMethod[];
    path: string;
    handler: RouteHandler$1;
    validate?: ValidationSchema;
    middlewares?: AppMiddleware[];
    timeout?: number;
    rateLimit?: {
        max: number;
        windowMs: number;
    };
    cache?: number;
    tags?: string[];
}
interface DatabaseConfig {
    name?: string;
    connection: string;
    schema?: Record<string, unknown>;
    timeout?: number;
}
interface SecurityConfig {
    cors?: boolean | CorsConfig;
    rateLimit?: boolean | RateLimitConfig;
    csrf?: boolean | CsrfConfig;
    helmet?: boolean | HelmetConfig;
    auth?: boolean | AuthConfig;
    validation?: boolean;
    sanitize?: boolean;
}
interface CorsConfig {
    origin?: string | string[] | ((origin: string) => boolean);
    methods?: HttpMethod[];
    allowedHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
}
interface RateLimitConfig {
    windowMs?: number;
    max?: number;
    keyGenerator?: (c: AppContext) => string;
    message?: string;
}
interface CsrfConfig {
    secret?: string;
    headerName?: string;
    tokenTTL?: number;
}
interface HelmetConfig {
    contentSecurityPolicy?: Record<string, string[]> | boolean;
    hsts?: boolean | {
        maxAge?: number;
        includeSubDomains?: boolean;
        preload?: boolean;
    };
    frameguard?: boolean | {
        action: 'deny' | 'sameorigin';
    };
    noSniff?: boolean;
    xssFilter?: boolean;
    referrerPolicy?: string | boolean;
}
interface AuthConfig {
    jwt?: boolean | {
        secret: string;
        expiresIn?: string;
    };
    apiKey?: boolean | {
        header?: string;
    };
    bearer?: boolean;
}
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
interface LoggingConfig {
    level?: LogLevel;
    pretty?: boolean;
}
interface ServerConfig {
    port?: number | string;
    hostname?: string;
    requestTimeout?: number;
    maxRequestSize?: number;
    maxJsonSize?: number;
    database?: DatabaseConfig | DatabaseConfig[];
    security?: boolean | SecurityConfig;
    compression?: boolean | {
        threshold?: number;
    };
    logging?: boolean | LoggingConfig;
    i18n?: boolean | I18nConfig;
    static?: StaticConfig$1 | StaticConfig$1[];
    routes?: RouteDefinition[];
    middlewares?: AppMiddleware[];
    errorHandler?: (error: Error, context: AppContext) => void | Promise<void>;
    onError?: (statusCode: number, path: string, method: string) => Response | Promise<Response>;
    onStartup?: (app: any) => void | Promise<void>;
    onReady?: (app: ServerInstance, db: Map<string, DB>) => void | Promise<void>;
    onShutdown?: () => void | Promise<void>;
    apiPrefix?: string;
    apiVersion?: string;
    gracefulShutdownTimeout?: number;
}
interface ServerInstance {
    app: unknown;
    logger: Logger$1 | null;
    db: Map<string, unknown>;
    bunServer: unknown;
    start: () => Promise<void>;
    stop: () => Promise<void>;
    addRoute: (route: RouteDefinition) => void;
    addRoutes: (routes: RouteDefinition[]) => void;
    getRoutes: () => RouteDefinition[];
}
interface Logger$1 {
    debug(data: unknown, msg?: string): void;
    info(data: unknown, msg?: string): void;
    warn(data: unknown, msg?: string): void;
    error(data: unknown, msg?: string): void;
    fatal(data: unknown, msg?: string): void;
}
declare class AppError extends Error {
    message: string;
    statusCode: number;
    code?: string | undefined;
    constructor(message: string, statusCode?: number, code?: string | undefined);
}
declare class ValidationError extends AppError {
    issues?: unknown | undefined;
    constructor(message: string, issues?: unknown | undefined);
}
declare class DatabaseError extends AppError {
    constructor(message: string);
}
declare class TimeoutError extends AppError {
    constructor(message?: string);
}
declare class RateLimitError extends AppError {
    constructor(message?: string);
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

declare function server(config?: ServerConfig): Promise<ServerInstance>;

export { type AppContext, AppError, type AppMiddleware, type AuthConfig, type CookieOptions, type CorsConfig, type CsrfConfig, type DatabaseConfig, DatabaseError, type HelmetConfig, type HttpMethod, type LogLevel, Logger, type LoggingConfig, type RateLimitConfig, RateLimitError, type RouteDefinition, type RouteHandler$1 as RouteHandler, Router, type SecurityConfig, SecurityManager, type ServerConfig, type ServerInstance, type StaticConfig, StaticFileServer, TimeoutError, ValidationError, type ValidationSchema, createStatic, server as default, server };
