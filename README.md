<!-- ╔══════════════════════════════ BEG ══════════════════════════════╗ -->

<br>
<div align="center">
    <p>
        <img src="./assets/img/logo.png" alt="logo" style="" height="60" />
    </p>
</div>

<div align="center">
    <img src="https://img.shields.io/badge/v-0.0.8-black"/>
    <a href="https://github.com/minejs-org"><img src="https://img.shields.io/badge/🔥-@minejs-black"/></a>
    <br>
    <img src="https://img.shields.io/badge/coverage-98.78%25-brightgreen" alt="Test Coverage" />
    <img src="https://img.shields.io/github/issues/minejs-org/server?style=flat" alt="Github Repo Issues" />
    <img src="https://img.shields.io/github/stars/minejs-org/server?style=social" alt="GitHub Repo stars" />
</div>
<br>

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->



<!-- ╔══════════════════════════════ DOC ══════════════════════════════╗ -->

- ## Overview 👀

    - #### Why ?
        > To provide a lightweight, type-safe HTTP server framework with built-in security, routing, database support, and i18n - enabling fast, production-ready server applications.

    - #### When ?
        > When you need to build a production-grade server with:
        > - Type-safe routing and middleware
        > - Built-in security (CORS, CSRF, rate limiting, helmet)
        > - Database integration
        > - Internationalization (i18n) support
        > - Request validation
        > - Static file serving
        > - Comprehensive logging

        > When you want to write modern server applications without complex boilerplate.

        > When you use [@cruxjs/app](https://github.com/cruxjs-org/app).

    <br>
    <br>

- ## Quick Start 🔥

    > install [`hmm`](https://github.com/minejs-org/hmm) first.

    ```bash
    # in your terminal
    hmm i @minejs/server
    ```

    <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> </div>

    - #### Setup

        > ***🌟 If you are using [`@cruxjs/app`](https://github.com/cruxjs-org/app), add the configuration directly to your `.\src\index.ts` file, inside `AppConfig` and skip the manual setup/startup steps. 🌟***

        > Create a basic server configuration:

        ```typescript
        import { server, type ServerConfig } from '@minejs/server';

        const config: ServerConfig = {
            port                : 3000,
            hostname            : 'localhost',

            security: {
                cors            : true,
                rateLimit: {
                    max         : 100,
                    windowMs    : 60000
                }
            },

            logging: {
                level           : 'info',
                pretty          : true
            }
        };

        const app = await server(config);
        await app.start();
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> </div>
        <br>

    - #### Usage

        > Define routes and add them to your server:

        ```typescript
        import { server, type ServerConfig, type AppContext } from '@minejs/server';

        const config: ServerConfig = {
            port            : 3000,
            hostname        : 'localhost',

            routes: [
                {
                    method  : 'GET',
                    path    : '/api/hello',
                    handler : (c: AppContext) => {
                        return c.json({ message: 'Hello World!' });
                    }
                },
                {
                    method  : 'POST',
                    path    : '/api/users',
                    handler : (c: AppContext) => {
                        const userData = c.body;
                        // Process user data
                        return c.json({ id: 1, ...userData }, 201);
                    }
                },
                {
                    method  : 'GET',
                    path    : '/api/users/:id',
                    handler : (c: AppContext) => {
                        const userId = c.params.id;
                        return c.json({ id: userId, name: 'John Doe' });
                    }
                }
            ],

            logging: {
                level   : 'info',
                pretty  : true
            }
        };

        const app = await server(config);
        await app.start();
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> </div>

        - #### Server Configuration

            ```typescript
            server: {
                // Port and hostname
                port            : 3000,
                hostname        : 'localhost',

                // Request handling
                requestTimeout  : 30000,        // Request timeout in ms
                maxRequestSize  : 10485760,     // Max request body size in bytes

                // Logging
                logging: {
                    level       : 'info',       // 'debug' | 'info' | 'warn' | 'error'
                    pretty      : true          // Pretty-print logs
                },

                // Shutdown
                gracefulShutdownTimeout: 10000  // Graceful shutdown timeout in ms
            }
            ```

        - #### Routing

            ```typescript
            routes: [
                {
                    // HTTP method(s)
                    method          : 'GET',            // or ['GET', 'POST']

                    // Route path with parameters
                    path            : '/api/users/:id', // supports :param syntax

                    // Handler function
                    handler         : (c: AppContext) => {
                        return c.json({ id: c.params.id });
                    },

                    // Optional middleware
                    middlewares: [
                        async (c, next) => {
                            // Before handler
                            await next();
                            // After handler
                        }
                    ],

                    // Optional validation
                    validate: {
                        body        : { /* schema */ },
                        query       : { /* schema */ },
                        params      : { /* schema */ }
                    },

                    // Optional rate limiting
                    rateLimit: {
                        max         : 10,
                        windowMs    : 60000
                    },

                    // Optional caching
                    cache           : 3600, // Cache in seconds

                    // Optional route tags
                    tags            : ['users', 'api']
                }
            ]
            ```

        - #### Security Configuration

            ```typescript
            security: {
                // Cross-Origin Resource Sharing
                cors: {
                    origin          : 'http://localhost:3000',  // or ['url1', 'url2'] or function
                    methods         : ['GET', 'POST', 'PUT', 'DELETE'],
                    allowedHeaders  : ['Content-Type', 'Authorization'],
                    credentials     : true,
                    maxAge          : 86400
                },

                // Rate limiting
                rateLimit: {
                    windowMs        : 60000,        // Time window in ms
                    max             : 100,          // Max requests per window
                    message         : 'Too many requests',
                    keyGenerator    : (c) => c.ip   // Custom key generator
                },

                // CSRF protection
                csrf: {
                    secret          : 'your-secret',
                    headerName      : 'X-CSRF-Token',
                    tokenTTL        : 3600000
                },

                // Helmet (security headers)
                helmet: {
                    contentSecurityPolicy: true,
                    hsts            : true,
                    frameguard      : true,
                    noSniff         : true,
                    xssFilter       : true
                },

                // Request validation
                validation          : true,

                // HTML sanitization
                sanitize            : true
            }
            ```

        - #### Database Integration

            ```typescript
            database: {
                name            : 'app',
                connection      : './data/app.db',   // File path or ':memory:'
                timeout         : 5000
            },

            // Or multiple databases
            database: [
                { name: 'main',  connection: './data/main.db' },
                { name: 'cache', connection: './data/cache.db' }
            ]
            ```

        - #### i18n Configuration

            ```typescript
            i18n: {
                defaultLanguage     : 'en',
                supportedLanguages  : ['en', 'ar', 'fr'],
                basePath            : './src/public/dist/i18n'
            }
            ```

        - #### Static File Serving

            ```typescript
            static: {
                path            : '/',              // URL path prefix
                directory       : './src/public',   // Local directory
                maxAge          : 3600,             // Cache control in seconds
                index           : ['index.html'],   // Index files
                etag            : true,             // Enable ETag
                lastModified    : true,             // Enable Last-Modified
                fallthrough     : false             // Continue if not found
            },

            // Or multiple static dirs
            static: [
                { path: '/', directory: './src/public' },
                { path: '/assets', directory: './src/assets' }
            ]
            ```

        - #### Context (AppContext) API

            ```typescript
            handler: (c: AppContext) => {
                // Request data
                c.request           // Original Request object
                c.ip                // Client IP address
                c.method            // HTTP method
                c.path              // Request path
                c.params            // URL parameters { id: '123' }
                c.query             // Query parameters { page: '1' }
                c.body              // Parsed request body
                c.headers           // Request headers
                c.requestId         // Unique request ID
                c.lang              // Detected language

                // Context state
                c.state             // Shared state object

                // User & Database
                c.user              // User object (if set by middleware)
                c.db                // Database instance
                c.i18n              // i18n manager
                c.logger            // Logger instance

                // Response methods
                c.json(data, status)        // JSON response
                c.text(data, status)        // Text response
                c.html(data, status)        // HTML response
                c.redirect(url, status)     // Redirect
                c.file(path, contentType)   // File response

                // Cookie methods
                c.setCookie(name, value, options)
                c.getCookie(name)
                c.deleteCookie(name, options)

                // Header methods
                c.setHeader(key, value)
                c.getHeader(key)

                // Status control
                c.status(code)              // Set status code
                c.statusCode                // Get status code

                return c.json({ success: true });
            }
            ```

        - #### Middleware

            ```typescript
            middlewares: [
                async (c: AppContext, next) => {
                    // Before handler
                    console.log('Request:', c.path);

                    // Call next middleware or handler
                    await next();

                    // After handler
                    console.log('Response sent');
                }
            ],

            // Or per-route middleware
            routes: [
                {
                    method      : 'POST',
                    path        : '/api/data',
                    middlewares : [
                        async (c, next) => {
                            if (!c.request.headers.get('authorization')) {
                                return c.json({ error: 'Unauthorized' }, 401);
                            }
                            await next();
                        }
                    ],
                    handler     : (c) => c.json({ ok: true })
                }
            ]
            ```

        - #### Lifecycle Hooks

            ```typescript
            const config: ServerConfig = {
                // Called when server is starting
                onStartup: async (app) => {
                    console.log('Server starting...');
                },

                // Called when server is ready
                onReady: async (app, databases) => {
                    console.log('Server ready!');
                    // Setup initial data, connections, etc.
                },

                // Called when server is shutting down
                onShutdown: async () => {
                    console.log('Server shutting down...');
                    // Cleanup resources
                }
            };
            ```

        - #### Error Handling

            ```typescript
            const config: ServerConfig = {
                // Custom error handler
                errorHandler: (error: Error, context: AppContext) => {
                    console.error('Error:', error);
                    context.logger?.error(error.message);
                },

                // Custom error page responses
                onError: async (statusCode: number, path: string, method: string) => {
                    if (statusCode === 404) {
                        return new Response('<h1>Page Not Found</h1>', {
                            status  : 404,
                            headers : { 'Content-Type': 'text/html' }
                        });
                    }
                    return new Response('Error', { status: statusCode });
                }
            };
            ```

        - #### Dynamic Route Management

            ```typescript
            const app = await server(config);
            await app.start();

            // Add routes dynamically
            app.addRoute({
                method  : 'GET',
                path    : '/dynamic',
                handler : (c) => c.json({ dynamic: true })
            });

            // Add multiple routes
            app.addRoutes([
                { method: 'GET',  path: '/route1', handler: (c) => c.json({}) },
                { method: 'POST', path: '/route2', handler: (c) => c.json({}) }
            ]);

            // Get all routes
            const routes = app.getRoutes();

            // Stop server
            await app.stop();
            ```

        - #### i18n Usage

            ```typescript
            handler: (c: AppContext) => {
                import { t } from '@minejs/i18n';

                // Current language (auto-detected from ?lang, cookie, or header)
                const lang = c.lang;

                // Translate
                const message = t('hello');

                // With parameters
                const greeting = t('greeting', { name: 'John' });

                // Get supported languages
                const supported = c.i18n?.getSupportedLanguages();

                return c.json({ message, lang, supported });
            }
            ```

    <br>
    <br>

- ## Complete Example 📑

    - ### src/server/config.ts

        ```typescript
        import { ServerConfig } from '@minejs/server';
        import path from 'path';

        const port          = process.env.PORT          || 3000;
        const hostname      = process.env.HOSTNAME      || 'localhost';
        const origin        = (process.env.CORS_ORIGINS || `http://${hostname}:${port}`).split(',');
        const logLevel      = (process.env.LOG_LEVEL    || 'info') as 'error' | 'warn' | 'info' | 'debug';
        const staticPath    = process.env.STATIC_PATH   || '/';
        const staticDir     = path.resolve(process.env.STATIC_DIR   || './src/public');
        const i18nPath      = path.resolve(process.env.I18N_PATH    || './src/public/dist/i18n');

        export const config: ServerConfig = {
            port                    : port,
            hostname                : hostname,
            requestTimeout          : 30000,
            maxRequestSize          : 10485760,

            static: {
                path                : staticPath,
                directory           : staticDir
            },

            security: {
                rateLimit: {
                    max             : 100,
                    windowMs        : 60000,
                    message         : 'Too many requests',
                    keyGenerator    : (c) => {
                        const apiKey = c.request?.headers?.get?.('x-api-key');
                        return apiKey || c.ip || 'unknown';
                    }
                },
                cors: {
                    origin          : origin,
                    credentials     : true,
                    methods         : ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
                    allowedHeaders  : ['Content-Type', 'Authorization', 'X-Request-ID']
                },
                csrf: true
            },

            logging: {
                level               : logLevel,
                pretty              : true
            },

            i18n: {
                defaultLanguage     : 'en',
                supportedLanguages  : ['en', 'ar'],
                basePath            : i18nPath
            },

            onShutdown: async () => {
                console.log('Server shutting down...');
            }
        };
        ```

    - ### src/server/routes.ts

        ```typescript
        import { RouteDefinition, type AppContext, t } from '@minejs/server';

        export const routes: RouteDefinition[] = [
            {
                method  : 'GET',
                path    : '/api/hello',

                handler : (c: AppContext) => {
                    return c.json({
                        message     : t('hello'),
                        language    : c.lang,
                        supported   : c.i18n?.getSupportedLanguages()
                    });
                }
            },

            {
                method  : ['GET', 'POST'],
                path    : '/api/users',

                handler : (c: AppContext) => {
                    if (c.request.method === 'GET') {
                        return c.json([
                            { id: 1, name: 'John' },
                            { id: 2, name: 'Jane' }
                        ]);
                    } else {
                        const user = c.body;
                        return c.json({ id: 3, ...user }, 201);
                    }
                }
            },

            {
                method  : 'GET',
                path    : '/api/users/:id',

                handler : (c: AppContext) => {
                    const userId = c.params.id;
                    return c.json({ id: userId, name: 'John Doe' });
                }
            }
        ];
        ```

    - ### src/index.ts

        ```typescript
        import { server } from '@minejs/server';
        import { config } from './server/config';
        import { routes } from './server/routes';

        const main = async () => {
            const app = await server({
                ...config,
                routes
            });

            await app.start();
            console.log(`Server running on http://${config.hostname}:${config.port}`);
        };

        main().catch(console.error);
        ```

    <br>
    <br>

- ## API Documentation 📖

    - ### Types

        ```typescript
        type HttpMethod     = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

        type RouteHandler   = (c: AppContext) => Response | Promise<Response>;

        type AppMiddleware  = (c: AppContext, next: () => Promise<void>) => void | Promise<void>;

        interface AppContext {
            // Request data
            ip              : string;
            request         : Request;
            params          : Record<string, string>;
            query           : Record<string, string>;
            body            : any;
            headers         : Headers;
            requestId       : string;
            lang?           : string;

            // Context
            state           : Record<string, unknown>;
            user?           : unknown;

            // Managers
            db              : DB            | undefined;
            logger          : Logger        | null;
            i18n            : I18nManager   | null;

            // Response methods
            json            (data: unknown, status?: number): Response;
            text            (data: string,  status?: number): Response;
            html            (data: string,  status?: number): Response;
            redirect        (url:  string,  status?: number): Response;
            file            (path: string,  contentType?: string): Response;

            // Cookie methods
            setCookie       (name: string, value: string, options?: CookieOptions): AppContext;
            getCookie       (name: string): string | undefined;
            deleteCookie    (name: string, options?: Partial<CookieOptions>): AppContext;

            // Header methods
            setHeader       (key: string, value: string): AppContext;
            getHeader       (key: string): string | undefined;

            // Status
            status          (code: number): AppContext;
            statusCode      : number;
        }

        interface ServerInstance {
            start           (): Promise<void>;
            stop            (): Promise<void>;
            addRoute        (route: RouteDefinition): void;
            addRoutes       (routes: RouteDefinition[]): void;
            getRoutes       (): RouteDefinition[];
        }

        interface ServerConfig {
            port?           : number | string;
            hostname?       : string;
            requestTimeout? : number;
            maxRequestSize? : number;
            database?       : DatabaseConfig    | DatabaseConfig[];
            security?       : boolean           | SecurityConfig;
            logging?        : boolean           | LoggingConfig;
            i18n?           : boolean           | I18nConfig;
            static?         : StaticConfig      | StaticConfig[];
            routes?         : RouteDefinition[];
            middlewares?    : AppMiddleware[];
            errorHandler?   : (error: Error, context: AppContext) => void | Promise<void>;
            onError?        : (statusCode: number, path: string, method: string) => Response | Promise<Response>;
            onStartup?      : (app: any) => void | Promise<void>;
            onReady?        : (app: ServerInstance, db: Map<string, DB>) => void | Promise<void>;
            onShutdown?     : () => void | Promise<void>;
        }
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> </div>

    - ### Functions

        - `server(config?: ServerConfig): Promise<ServerInstance>` - Create and initialize server
        - `getRoutes(): RouteDefinition[]` - Get all registered routes
        - `addRoute(route: RouteDefinition): void` - Add single route
        - `addRoutes(routes: RouteDefinition[]): void` - Add multiple routes
        - `start(): Promise<void>` - Start server listening
        - `stop(): Promise<void>` - Stop server gracefully

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> </div>

    - #### Related

        - ##### [@minejs/db](https://github.com/minejs-org/db)

        - ##### [@minejs/i18n](https://github.com/minejs-org/i18n)

        - ##### [@cruxjs/app](https://github.com/cruxjs-org/app)

        - ##### [@cruxjs/client](https://github.com/cruxjs-org/client)

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->



<!-- ╔══════════════════════════════ END ══════════════════════════════╗ -->

<br>

---

<div align="center">
    <a href="https://github.com/maysara-elshewehy"><img src="https://img.shields.io/badge/by-Maysara-black"/></a>
</div>

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->
