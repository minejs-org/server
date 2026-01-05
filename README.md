<!-- ╔══════════════════════════════ BEG ══════════════════════════════╗ -->

<br>
<div align="center">
    <p>
        <img src="./assets/img/logo.png" alt="logo" style="" height="60" />
    </p>
</div>

<div align="center">
    <img src="https://img.shields.io/badge/v-0.0.5-black"/>
    <img src="https://img.shields.io/badge/🔥-@minejs-black"/>
    <br>
    <img src="https://img.shields.io/badge/coverage-98.88%25-brightgreen" alt="Test Coverage" />
    <img src="https://img.shields.io/github/issues/minejs-org/server?style=flat" alt="Github Repo Issues" />
    <img src="https://img.shields.io/github/stars/minejs-org/server?style=social" alt="GitHub Repo stars" />
</div>
<br>

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->



<!-- ╔══════════════════════════════ DOC ══════════════════════════════╗ -->

- ## Quick Start 🔥

    > **_A lightweight, type-safe HTTP server framework for Bun with built-in security, routing, and database support._**

    - ### Setup

        > install [`hmm`](https://github.com/minejs-org/hmm) first.

        ```bash
        hmm i @minejs/server
        ```

    <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Usage

        ```ts
        import { server, type ServerInstance, type AppContext } from '@minejs/server'
        ```

        - ### 1. Basic Server

            ```typescript
            import { server } from '@minejs/server'

            const app = server({
                port: 3000,
                logging: true,
                routes: [
                    {
                        method: 'GET',
                        path: '/hello',
                        handler: (c) => c.json({ message: 'Hello, World!' })
                    }
                ]
            })

            await app.start()
            ```

        - ### 2. Route Handling with Parameters

            ```typescript
            import { server, type AppContext } from '@minejs/server'

            const app = server({
                port: 3000,
                routes: [
                    {
                        method: 'GET',
                        path: '/users/:id',
                        handler: (c: AppContext) => {
                            const userId = c.params.id
                            return c.json({ userId, name: 'John Doe' })
                        }
                    },
                    {
                        method: 'POST',
                        path: '/users',
                        handler: (c: AppContext) => {
                            const body = c.body
                            return c.json({ created: true, data: body }, 201)
                        }
                    }
                ]
            })

            await app.start()
            ```

        - ### 3. Request Context (AppContext)

            ```typescript
            import { server, type AppContext } from '@minejs/server'

            const app = server({
                port: 3000,
                routes: [
                    {
                        method: 'GET',
                        path: '/context-demo',
                        handler: (c: AppContext) => {
                            return c.json({
                                ip: c.ip,                    // Client IP
                                method: c.request.method,    // HTTP method
                                path: c.request.url,         // Request URL
                                lang: c.lang,                // Request language
                                requestId: c.requestId,      // Unique request ID
                                query: c.query,              // Query parameters
                                headers: Object.fromEntries(c.headers.entries())
                            })
                        }
                    }
                ]
            })

            await app.start()
            ```

        - ### 4. Middleware

            ```typescript
            import { server, type AppContext, type AppMiddleware } from '@minejs/server'

            // Custom middleware
            const authMiddleware: AppMiddleware = async (c, next) => {
                const token = c.getHeader('Authorization')
                
                if (!token) {
                    return c.json({ error: 'Unauthorized' }, 401)
                }

                // Set user in context
                c.user = { id: 1, name: 'John' }
                
                // Continue to next middleware/handler
                await next()
            }

            const app = server({
                port: 3000,
                routes: [
                    {
                        method: 'GET',
                        path: '/protected',
                        handler: (c: AppContext) => {
                            return c.json({ user: c.user })
                        },
                        middlewares: [authMiddleware]
                    }
                ]
            })

            await app.start()
            ```

        - ### 5. Security (CORS, Rate Limiting, Headers)

            ```typescript
            import { server } from '@minejs/server'

            const app = server({
                port: 3000,
                logging: true,
                security: {
                    cors: {
                        origin: ['https://example.com', 'https://app.example.com'],
                        credentials: true,
                        maxAge: 3600
                    },
                    rateLimit: {
                        windowMs: 60000,  // 1 minute
                        max: 100,         // 100 requests per minute
                        message: 'Too many requests'
                    }
                },
                routes: [
                    {
                        method: 'GET',
                        path: '/api/data',
                        handler: (c) => c.json({ data: [] })
                    }
                ]
            })

            await app.start()
            ```

        - ### 6. Cookie Management

            ```typescript
            import { server, type AppContext } from '@minejs/server'

            const app = server({
                port: 3000,
                routes: [
                    {
                        method: 'POST',
                        path: '/login',
                        handler: (c: AppContext) => {
                            // Set cookie
                            c.setCookie('session_id', 'abc123', {
                                maxAge: 3600,      // 1 hour
                                httpOnly: true,
                                secure: true,
                                sameSite: 'Strict'
                            })

                            return c.json({ success: true })
                        }
                    },
                    {
                        method: 'GET',
                        path: '/profile',
                        handler: (c: AppContext) => {
                            // Get cookie
                            const sessionId = c.getCookie('session_id')
                            return c.json({ sessionId })
                        }
                    },
                    {
                        method: 'POST',
                        path: '/logout',
                        handler: (c: AppContext) => {
                            // Delete cookie
                            c.deleteCookie('session_id', { path: '/' })
                            return c.json({ success: true })
                        }
                    }
                ]
            })

            await app.start()
            ```

        - ### 7. Static File Serving

            ```typescript
            import { server } from '@minejs/server'

            const app = server({
                port: 3000,
                static: {
                    path: '/public',           // URL prefix
                    directory: './public',     // Local directory
                    maxAge: 3600,              // Cache in seconds
                    dotfiles: 'deny',          // Don't serve hidden files
                    index: ['index.html']      // Index files
                }
            })

            await app.start()
            // Now http://localhost:3000/public/style.css serves ./public/style.css
            ```

        - ### 8. Database Integration

            ```typescript
            import { server, type AppContext } from '@minejs/server'

            const app = server({
                port: 3000,
                database: {
                    connection: './data.db',   // SQLite file path
                    name: 'default'
                },
                routes: [
                    {
                        method: 'GET',
                        path: '/users',
                        handler: (c: AppContext) => {
                            const db = c.db
                            if (!db) return c.json({ error: 'No database' }, 500)
                            
                            // Use database connection
                            return c.json({ users: [] })
                        }
                    }
                ]
            })

            await app.start()
            ```

        - ### 9. Response Methods

            ```typescript
            import { server, type AppContext } from '@minejs/server'

            const app = server({
                port: 3000,
                routes: [
                    {
                        method: 'GET',
                        path: '/json',
                        handler: (c: AppContext) => c.json({ message: 'Hello' })
                    },
                    {
                        method: 'GET',
                        path: '/text',
                        handler: (c: AppContext) => c.text('Plain text response')
                    },
                    {
                        method: 'GET',
                        path: '/html',
                        handler: (c: AppContext) => c.html('<h1>HTML Page</h1>')
                    },
                    {
                        method: 'GET',
                        path: '/file',
                        handler: (c: AppContext) => c.file('./public/document.pdf', 'application/pdf')
                    },
                    {
                        method: 'GET',
                        path: '/redirect',
                        handler: (c: AppContext) => c.redirect('/new-location', 301)
                    }
                ]
            })

            await app.start()
            ```

        - ### 10. Lifecycle Hooks

            ```typescript
            import { server, type ServerInstance } from '@minejs/server'

            const app = server({
                port: 3000,
                logging: true,
                
                onStartup: async (app) => {
                    console.log('Server starting up...')
                },
                
                onReady: async (app, databases) => {
                    console.log('Server is ready!')
                    console.log('Database connections:', databases.size)
                },
                
                onShutdown: async () => {
                    console.log('Server shutting down...')
                },
                
                onError: async (statusCode, path, method) => {
                    return new Response(
                        JSON.stringify({ 
                            error: 'Custom error page',
                            statusCode,
                            path,
                            method 
                        }),
                        { status: statusCode, headers: { 'Content-Type': 'application/json' } }
                    )
                }
            })

            await app.start()
            ```

        - ### 11. Internationalization (i18n)

            ```typescript
            import { server, type AppContext, setupAuto, setLanguage } from '@minejs/server'

            const app = server({
                port: 3000,
                i18n: {
                    defaultLanguage: 'en',
                    supportedLanguages: ['en', 'ar', 'fr']
                },
                
                onStartup: async () => {
                    // Auto-setup: Automatically detects server environment and loads from files
                    // On server: Reads from ./translations/en.json
                    // On browser: Fetches from http://localhost:3000/translations/en.json
                    await setupAuto({
                        defaultLanguage: 'en',
                        supportedLanguages: ['en', 'ar', 'fr'],
                        basePath: './translations/',
                        fileExtension: 'json'
                    })
                },
                
                routes: [
                    {
                        method: 'GET',
                        path: '/greeting',
                        handler: (c: AppContext) => {
                            const language = c.lang  // Detected from query, cookie, or header
                            // Use c.i18n?.t() to translate with context
                            return c.json({ 
                                language,
                                greeting: c.i18n?.t('greeting') || 'Hello' 
                            })
                        }
                    }
                ]
            })

            await app.start()
            // Language detection priority: ?lang query param > lang cookie > Accept-Language header > default
            ```

            **Translation file structure:**
            ```
            your-app/
            ├── src/
            │   └── index.ts
            ├── translations/
            │   ├── en.json
            │   ├── ar.json
            │   └── fr.json
            └── package.json
            ```

            **translations/en.json:**
            ```json
            {
                "greeting": "Hello",
                "farewell": "Goodbye",
                "welcome": "Welcome, {name}!"
            }
            ```

        - ### 12. Logging

            ```typescript
            import { server } from '@minejs/server'

            const app = server({
                port: 3000,
                logging: {
                    level: 'info',  // 'debug' | 'info' | 'warn' | 'error'
                    pretty: true     // Pretty-print logs with colors
                }
            })

            await app.start()
            ```

    <br>

- ## API Reference 🔥

    - #### `server(config?: ServerConfig): ServerInstance`
        > Create and configure an HTTP server instance.

        ```typescript
        const app = server({
            port: 3000,
            hostname: 'localhost',
            logging: true,
            routes: [],
            security: {},
            database: {},
            static: {}
        })
        ```

        **Configuration Options:**
        - `port` (number | string): Server port, default: `3000`
        - `hostname` (string): Server hostname, default: `localhost`
        - `requestTimeout` (number): Request timeout in ms, default: `30000`
        - `maxRequestSize` (number): Max request body size, default: `10MB`
        - `gracefulShutdownTimeout` (number): Shutdown timeout in ms, default: `10000`
        - `logging` (boolean | LoggingConfig): Enable logging
        - `security` (boolean | SecurityConfig): Security settings
        - `database` (DatabaseConfig | DatabaseConfig[]): Database connections
        - `i18n` (boolean | I18nConfig): Internationalization settings
        - `static` (StaticConfig | StaticConfig[]): Static file serving
        - `routes` (RouteDefinition[]): Route definitions
        - `middlewares` (AppMiddleware[]): Global middlewares
        - `onStartup` (fn): Called on startup
        - `onReady` (fn): Called when server is ready
        - `onShutdown` (fn): Called on shutdown
        - `onError` (fn): Custom error page handler

    - #### `ServerInstance`

        ```typescript
        interface ServerInstance {
            app: unknown                          // Underlying Bun server
            logger: Logger | null                 // Logger instance
            db: Map<string, unknown>              // Database connections
            bunServer: unknown                    // Bun server object
            start(): Promise<void>                // Start the server
            stop(): Promise<void>                 // Stop the server
            addRoute(route: RouteDefinition): void
            addRoutes(routes: RouteDefinition[]): void
            getRoutes(): RouteDefinition[]
        }
        ```

        **Methods:**
        ```typescript
        // Start server
        await app.start()

        // Stop server gracefully
        await app.stop()

        // Add route dynamically
        app.addRoute({
            method: 'GET',
            path: '/dynamic',
            handler: (c) => c.json({ dynamic: true })
        })

        // Add multiple routes
        app.addRoutes([
            { method: 'GET', path: '/route1', handler: (c) => c.json({}) },
            { method: 'POST', path: '/route2', handler: (c) => c.json({}) }
        ])

        // Get all routes
        const routes = app.getRoutes()
        ```

    - #### `AppContext`

        > Request context passed to every route handler and middleware.

        ```typescript
        interface AppContext {
            // Request info
            ip: string                            // Client IP address
            request: Request                      // Fetch API Request object
            params: Record<string, string>        // Route parameters
            query: Record<string, string>         // Query string parameters
            body: unknown                         // Parsed request body
            headers: Headers                      // Request headers
            
            // Server info
            db: DB | undefined                    // Database connection
            logger: Logger | null                 // Logger instance
            i18n: I18nManager | null              // i18n manager
            lang: string                          // Current language
            user?: unknown                        // User (from middleware)
            requestId: string                     // Unique request ID
            state: Record<string, unknown>        // Custom state
            
            // Response methods
            json(data: unknown, status?: number): Response
            text(data: string, status?: number): Response
            html(data: string, status?: number): Response
            redirect(url: string, status?: number): Response
            file(path: string, contentType?: string): Response
            
            // Cookie methods
            setCookie(name: string, value: string, options?: CookieOptions): AppContext
            getCookie(name: string): string | undefined
            deleteCookie(name: string, options?: CookieOptions): AppContext
            
            // Header methods
            setHeader(key: string, value: string): AppContext
            getHeader(key: string): string | undefined
            
            // Status code
            status(code: number): AppContext
            statusCode: number
        }
        ```

    - #### `RouteDefinition`

        ```typescript
        interface RouteDefinition {
            method: HttpMethod | HttpMethod[]    // 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD'
            path: string                         // Route path: '/users' or '/users/:id' or '/files/*'
            handler: RouteHandler                // Route handler function
            middlewares?: AppMiddleware[]        // Route-specific middlewares
            validate?: ValidationSchema          // Input validation schema
            timeout?: number                     // Route-specific timeout
            rateLimit?: RateLimitConfig          // Route-specific rate limiting
            cache?: number                       // Response cache duration in seconds
            tags?: string[]                      // Route tags for documentation
        }
        ```

        **Examples:**
        ```typescript
        // Static route
        { method: 'GET', path: '/hello', handler: (c) => c.json({}) }

        // Dynamic route with parameter
        { method: 'GET', path: '/users/:id', handler: (c) => c.json({ id: c.params.id }) }

        // Wildcard route
        { method: 'GET', path: '/files/*', handler: (c) => c.json({}) }

        // Multiple methods
        { method: ['GET', 'POST'], path: '/data', handler: (c) => c.json({}) }

        // With middlewares
        {
            method: 'POST',
            path: '/admin',
            handler: (c) => c.json({ admin: true }),
            middlewares: [authMiddleware, adminMiddleware]
        }
        ```

    - #### `CookieOptions`

        ```typescript
        interface CookieOptions {
            maxAge?: number                  // Cookie lifetime in seconds
            expires?: Date                   // Cookie expiration date
            path?: string                    // Cookie path (default: '/')
            domain?: string                  // Cookie domain
            secure?: boolean                 // HTTPS only
            httpOnly?: boolean               // JavaScript cannot access
            sameSite?: 'Strict' | 'Lax' | 'None'  // CSRF protection
        }
        ```

    - #### `SecurityConfig`

        ```typescript
        interface SecurityConfig {
            cors?: CorsConfig | boolean
            rateLimit?: RateLimitConfig | boolean
            csrf?: CsrfConfig | boolean
            helmet?: HelmetConfig | boolean
            auth?: AuthConfig | boolean
        }
        ```

        **CORS:**
        ```typescript
        security: {
            cors: {
                origin: '*' | string | string[] | (origin: string) => boolean
                methods: ['GET', 'POST', 'PUT', 'DELETE']
                allowedHeaders: ['Content-Type', 'Authorization']
                credentials: true
                maxAge: 3600
            }
        }
        ```

        **Rate Limiting:**
        ```typescript
        security: {
            rateLimit: {
                windowMs: 60000         // Time window in ms
                max: 100                // Max requests per window
                keyGenerator: (c) => c.ip  // Custom key generator
                message: 'Too many requests'
            }
        }
        ```

    - #### `LoggingConfig`

        ```typescript
        interface LoggingConfig {
            level?: 'debug' | 'info' | 'warn' | 'error'
            pretty?: boolean
        }
        ```

    - #### `DatabaseConfig`

        ```typescript
        interface DatabaseConfig {
            name?: string           // Database name, default: 'default'
            connection: string      // Connection string or file path
            timeout?: number        // Connection timeout
        }
        ```

    - #### `StaticConfig`

        ```typescript
        interface StaticConfig {
            path: string                           // URL prefix (e.g., '/public')
            directory: string                      // Local directory path
            maxAge?: number                        // Cache duration in seconds
            index?: string[]                       // Index files
            dotfiles?: 'allow' | 'deny' | 'ignore'
            etag?: boolean                         // Enable ETag headers
            lastModified?: boolean                 // Enable Last-Modified headers
            immutable?: boolean                    // Add immutable cache directive
            extensions?: string[]                  // Try extensions
            fallthrough?: boolean                  // Continue if file not found
            setHeaders?: (ctx: AppContext, path: string) => void
        }
        ```

    - #### `Error Classes`

        ```typescript
        class AppError extends Error {
            statusCode: number
            code?: string
        }

        class ValidationError extends AppError {
            issues?: unknown
        }

        class DatabaseError extends AppError {}
        class TimeoutError extends AppError {}
        class RateLimitError extends AppError {}
        ```

        **Usage:**
        ```typescript
        import { server, AppError, ValidationError } from '@minejs/server'

        const app = server({
            port: 3000,
            routes: [
                {
                    method: 'GET',
                    path: '/error',
                    handler: (c) => {
                        throw new AppError('Something went wrong', 500, 'INTERNAL_ERROR')
                    }
                },
                {
                    method: 'POST',
                    path: '/validate',
                    handler: (c) => {
                        if (!c.body.email) {
                            throw new ValidationError('Email is required')
                        }
                        return c.json({ valid: true })
                    }
                }
            ]
        })
        ```

    <br>

- ## Advanced Features 🚀

    - ### Middleware Chain

        Middlewares execute in order and can short-circuit the chain:

        ```typescript
        const authMiddleware: AppMiddleware = async (c, next) => {
            const token = c.getHeader('Authorization')
            if (!token) return c.json({ error: 'Unauthorized' }, 401)
            await next()  // Continue to next middleware/handler
        }

        const loggingMiddleware: AppMiddleware = async (c, next) => {
            console.log('Before:', c.request.method, c.request.url)
            await next()
            console.log('After:', c.statusCode)
        }

        app.addRoute({
            method: 'GET',
            path: '/protected',
            handler: (c) => c.json({ data: 'secret' }),
            middlewares: [loggingMiddleware, authMiddleware]
        })
        ```

    - ### Multiple Databases

        ```typescript
        const app = server({
            port: 3000,
            database: [
                { name: 'primary', connection: './primary.db' },
                { name: 'cache', connection: './cache.db' },
                { name: 'logs', connection: ':memory:' }
            ]
        })

        await app.start()

        // Access in routes
        const route = {
            method: 'GET',
            path: '/data',
            handler: (c: AppContext) => {
                const primary = app.db.get('primary')
                const cache = app.db.get('cache')
                return c.json({ primary, cache })
            }
        }
        ```

    - ### Dynamic Routes

        ```typescript
        const app = server({
            port: 3000,
            logging: false,
            routes: [
                {
                    method: 'GET',
                    path: '/api/users/:id',
                    handler: (c) => c.json({ userId: c.params.id })
                },
                {
                    method: 'GET',
                    path: '/download/*',
                    handler: (c) => c.file('./downloads/' + c.params[0])
                }
            ]
        })

        await app.start()
        ```

    - ### Error Handling

        ```typescript
        const app = server({
            port: 3000,
            errorHandler: async (error, context) => {
                // Custom error handling
                console.error('Error:', error.message)
            },
            onError: async (statusCode, path, method) => {
                // Custom error pages
                if (statusCode === 404) {
                    return new Response(
                        JSON.stringify({ error: 'Page not found', path }),
                        { status: 404, headers: { 'Content-Type': 'application/json' } }
                    )
                }
                return new Response('Error', { status: statusCode })
            }
        })
        ```

    - ### Health & Readiness Endpoints

        Built-in endpoints for monitoring:

        ```typescript
        // GET /health - Server health status
        // Response: { status: 'healthy', uptime: 123.45, activeRequests: 5, ... }

        // GET /readiness - Server readiness status
        // Response: { ready: true, checks: { database: 'connected', ... }, ... }
        ```

    - ### Request Lifecycle

        1. **Receive** - Request received by server
        2. **Parse** - URL, method, headers, body parsed
        3. **Security** - CORS, rate limiting, validation
        4. **Match** - Route matching from router
        5. **Context** - AppContext created
        6. **Middlewares** - Route middlewares execute in order
        7. **Handler** - Route handler executes
        8. **Response** - Response sent with security headers
        9. **Log** - Request logged with duration

    <br>

<!-- ╚══════════════════════════════════════════════════════════════════╝ -->



<!-- ╔══════════════════════════════ END ══════════════════════════════╗ -->

<br>

---

<div align="center">
    <a href="https://github.com/maysara-elshewehy"><img src="https://img.shields.io/badge/by-Maysara-black"/></a>
</div>

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->