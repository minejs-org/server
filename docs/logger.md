<!-- ╔══════════════════════════════ BEG ══════════════════════════════╗ -->

# Logger

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->



<!-- ╔══════════════════════════════ DOC ══════════════════════════════╗ -->

- ## Quick Start 🔥

    - ##### Basic Logging
        ```ts
        // Create a logger instance
        const logger = new Logger('info', false);

        // Log at different levels
        logger.debug({ userId: 123 }, 'User lookup');
        logger.info({ status: 'ready' }, 'Server initialized');
        logger.warn({ memory: '85%' }, 'High memory usage');
        logger.error({ code: 'ECONNREFUSED' }, 'Database connection failed');
        logger.fatal({ error: 'OutOfMemory' }, 'Critical system error');

        // Output (JSON format):
        // {"timestamp":"2024-12-04T01:35:12.665Z","level":"INFO","message":"Server initialized","status":"ready"}
        ```

    ---

    - ##### Pretty Mode (Human-Readable)
        ```ts
        // Enable pretty mode for colorful, readable logs
        const logger = new Logger('info', true);

        logger.info({ userId: 123 }, 'User authenticated');
        // Output: 01:35:12 ● User authenticated userId:123

        logger.warn({ disk: '90%' }, 'Low disk space');
        // Output: 01:35:12 ⚠ Low disk space disk:90%

        logger.error({ code: 500 }, 'Internal error');
        // Output: 01:35:12 ✖ Internal error code:500
        ```

    ---

    - ##### HTTP Request Logging (Morgan-Style)
        ```ts
        const logger = new Logger('info', true);

        // Automatically formats HTTP request logs
        logger.info({
            method: 'GET',
            path: '/api/users',
            status: 200,
            duration: 45
        });
        // Output: 01:35:12 GET /api/users 200 45ms (colored)
        ```

    ---

    - ##### Child Loggers with Prefixes
        ```ts
        const logger = new Logger('info', false);

        // Create namespaced loggers for different services
        const apiLogger = logger.child('API');
        const dbLogger = logger.child('Database');

        apiLogger.info({ endpoint: '/users' }, 'Request received');
        // Output: {"timestamp":"...","level":"INFO","message":"[API] Request received","endpoint":"/users"}

        // Nested child loggers
        const userService = apiLogger.child('Users');
        userService.info({ userId: 123 }, 'User created');
        // Output: {"timestamp":"...","level":"INFO","message":"[API:Users] User created","userId":123}
        ```

    ---

    - ##### Log Levels & Filtering
        ```ts
        // Set minimum log level (debug < info < warn < error < fatal)
        const logger = new Logger('warn', false);

        logger.debug({ test: 1 }, 'Debug msg');  // ❌ Won't log
        logger.info({ test: 2 }, 'Info msg');    // ❌ Won't log
        logger.warn({ test: 3 }, 'Warning msg'); // ✅ Will log
        logger.error({ test: 4 }, 'Error msg');  // ✅ Will log
        logger.fatal({ test: 5 }, 'Fatal msg');  // ✅ Will log
        ```

    ---

    - ##### Special Formatting (Pretty Mode)
        ```ts
        const logger = new Logger('info', true);

        // Route registration
        logger.info({ method: 'GET', path: '/api/users' }, 'Route added');
        // Output: 01:35:12 → GET    /api/users

        logger.info({ method: ['GET', 'POST'], path: '/api/auth' }, 'Route added');
        // Output: 01:35:12 → GET|POST /api/auth

        // Database connection
        logger.info({ name: 'PostgreSQL' }, '✔ Database connected');
        // Output: 01:35:12 ✓ Database connected (PostgreSQL)

        // Server startup
        logger.info({ url: 'http://localhost:3000' }, 'Server started');
        // Output: 01:35:12 ✓ Server started at http://localhost:3000
        ```

    ---

    - ##### String Messages
        ```ts
        const logger = new Logger('info', false);

        // You can pass a string directly as the data parameter
        logger.info('Simple message');
        // Output: {"timestamp":"...","level":"INFO","message":"Simple message"}

        // Works in pretty mode too
        const prettyLogger = new Logger('info', true);
        prettyLogger.info('Application started');
        // Output: 01:35:12 ● Application started
        ```

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->



<!-- ╔══════════════════════════════ END ══════════════════════════════╗ -->

<br>

---

<div align="center">
    <a href="https://github.com/maysara-elshewehy"><img src="https://img.shields.io/badge/by-Maysara-black"/></a>
</div>

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->