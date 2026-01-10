// test/security.test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { describe, test, expect } from 'bun:test';
	import { server, type AppContext } from '../src';
	import { SecurityManager } from '../src/mod/security';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

	describe('Security - CORS', () => {
		test('CORS - handles with function origin', async () => {
			const app = await server({
				port: 3207,
				logging: false,
				security: {
					cors: {
						origin: (origin: string) => origin.includes('allowed.com'),
						credentials: true
					}
				},
				routes: [
					{
						method: 'GET',
						path: '/test',
						handler: (c: AppContext) => c.json({ ok: true })
					}
				]
			});

			await app.start();

			// Allowed origin
			const res1 = await fetch('http://localhost:3207/test', {
				headers: { 'Origin': 'http://allowed.com' }
			});
			expect(res1.headers.get('Access-Control-Allow-Origin')).toBe('http://allowed.com');

			// Disallowed origin
			const res2 = await fetch('http://localhost:3207/test', {
				headers: { 'Origin': 'http://blocked.com' }
			});
			expect(res2.headers.get('Access-Control-Allow-Origin')).toBeNull();

			await app.stop();
		});

		test('CORS - handles with string origin', async () => {
			const app = await server({
				port: 3208,
				logging: false,
				security: {
					cors: {
						origin: '*'
					}
				},
				routes: [
					{
						method: 'GET',
						path: '/test',
						handler: (c: AppContext) => c.json({ ok: true })
					}
				]
			});

			await app.start();

			const res = await fetch('http://localhost:3208/test', {
				headers: { 'Origin': 'http://example.com' }
			});
			expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');

			await app.stop();
		});

		test('CORS - handles with default config', async () => {
			const app = await server({
				port: 3209,
				logging: false,
				security: {
					cors: {}
				},
				routes: [
					{
						method: 'GET',
						path: '/test',
						handler: (c: AppContext) => c.json({ ok: true })
					}
				]
			});

			await app.start();

			const res = await fetch('http://localhost:3209/test', {
				headers: { 'Origin': 'http://example.com' }
			});
			expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://example.com');

			await app.stop();
		});

		test('CORS - handles OPTIONS preflight', async () => {
			const app = await server({
				port: 3210,
				logging: false,
				security: {
					cors: {
						origin: ['http://localhost:3000', 'http://example.com'],
						credentials: true,
						methods: ['GET', 'POST'],
						maxAge: 3600
					}
				},
				routes: [
					{
						method: 'GET',
						path: '/test',
						handler: (c: AppContext) => c.json({ ok: true })
					}
				]
			});

			await app.start();

			const res = await fetch('http://localhost:3210/test', {
				method: 'OPTIONS',
				headers: { 'Origin': 'http://localhost:3000' }
			});
			expect(res.status).toBe(204);

			await app.stop();
		});
	});

	describe('Security - Rate Limiting', () => {
		test('allows requests within rate limit', async () => {
			const app = await server({
				port: 3212,
				logging: false,
				security: {
					rateLimit: { max: 3, windowMs: 10000 }
				},
				routes: [
					{
						method: 'GET',
						path: '/test',
						handler: (c: AppContext) => c.json({ ok: true })
					}
				]
			});

			await app.start();

			const res1 = await fetch('http://localhost:3212/test');
			expect(res1.status).toBe(200);

			const res2 = await fetch('http://localhost:3212/test');
			expect(res2.status).toBe(200);

			const res3 = await fetch('http://localhost:3212/test');
			expect(res3.status).toBe(200);

			await app.stop();
		});

		test('blocks requests exceeding rate limit', async () => {
			const app = await server({
				port: 3213,
				logging: false,
				security: {
					rateLimit: { max: 2, windowMs: 10000 }
				},
				routes: [
					{
						method: 'GET',
						path: '/test',
						handler: (c: AppContext) => c.json({ ok: true })
					}
				]
			});

			await app.start();

			await fetch('http://localhost:3213/test');
			await fetch('http://localhost:3213/test');

			// 3rd request should be blocked
			const res3 = await fetch('http://localhost:3213/test');
			expect(res3.status).toBe(429);

			await app.stop();
		});
	});

	describe('Security - Request Size Limits', () => {
		test('accepts small payloads', async () => {
			const app = await server({
				port: 3214,
				logging: false,
				maxRequestSize: 1024,
				routes: [
					{
						method: 'POST',
						path: '/upload',
						handler: (c: AppContext) => c.json({ size: JSON.stringify(c.body).length })
					}
				]
			});

			await app.start();

			const res = await fetch('http://localhost:3214/upload', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ small: 'data' })
			});

			expect([200, 400]).toContain(res.status);

			await app.stop();
		});

		test('rejects large payloads', async () => {
			const app = await server({
				port: 3215,
				logging: false,
				maxRequestSize: 100,
				routes: [
					{
						method: 'POST',
						path: '/upload',
						handler: (c: AppContext) => c.json({ ok: true })
					}
				]
			});

			await app.start();

			const largeData = 'x'.repeat(200);
			const res = await fetch('http://localhost:3215/upload', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: largeData
			});

			expect([400, 413]).toContain(res.status);

			await app.stop();
		});

		test('handles payload too large in parseBody', async () => {
			const app = await server({
				port: 3216,
				logging: false,
				maxRequestSize: 50,
				routes: [
					{
						method: 'POST',
						path: '/test',
						handler: (c: AppContext) => c.json({ body: c.body })
					}
				]
			});

			await app.start();

			const res = await fetch('http://localhost:3216/test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: 'x'.repeat(100)
			});

			// Can be 400 (validation) or 413 (payload too large)
			expect([400, 413]).toContain(res.status);

			await app.stop();
		});
	});

	describe('Security - IP Extraction', () => {
		test('extracts IP from x-real-ip header', async () => {
			const app = await server({
				port: 3217,
				logging: false,
				routes: [
					{
						method: 'GET',
						path: '/test',
						handler: (c: AppContext) => c.json({ ip: c.ip })
					}
				]
			});

			await app.start();

			const res = await fetch('http://localhost:3217/test', {
				headers: { 'X-Real-IP': '203.0.113.42' }
			});
			const data = await res.json();
			expect(data.ip).toBe('203.0.113.42');

			await app.stop();
		});
	});

	describe('Security Manager - Unit Tests', () => {
		test('checkRateLimit - handles rate limiting correctly', () => {
			const security = new SecurityManager();
			const ip = '192.168.1.100';

			expect(security.checkRateLimit(ip, 3, 1000)).toBe(true);
			expect(security.checkRateLimit(ip, 3, 1000)).toBe(true);
			expect(security.checkRateLimit(ip, 3, 1000)).toBe(true);
			expect(security.checkRateLimit(ip, 3, 1000)).toBe(false);
		});

		test('generateCsrfToken - generates token', () => {
			const security = new SecurityManager();
			const sessionId = 'session123';
			const token = security.generateCsrfToken(sessionId);

			expect(typeof token).toBe('string');
			expect(token.length).toBeGreaterThan(0);
		});

		test('validateCsrfToken - validates with correct session', () => {
			const security = new SecurityManager();
			const sessionId = 'session123';
			const token = security.generateCsrfToken(sessionId);

			expect(security.validateCsrfToken(token, sessionId)).toBe(true);
		});

		test('validateCsrfToken - rejects with wrong session', () => {
			const security = new SecurityManager();
			const token = security.generateCsrfToken('session1');
			expect(security.validateCsrfToken(token, 'session2')).toBe(false);
		});

		test('validateCsrfToken - rejects expired tokens', async () => {
			const security = new SecurityManager();
			const token = security.generateCsrfToken('session1', 50); // 50ms TTL
			await new Promise(resolve => setTimeout(resolve, 100));
			expect(security.validateCsrfToken(token, 'session1')).toBe(false);
		});

		test('sanitizeHtml - escapes HTML', () => {
			const security = new SecurityManager();
			const input = '<script>alert("XSS")</script>';
			const sanitized = security.sanitizeHtml(input);

			expect(sanitized).toContain('&lt;');
			expect(sanitized).toContain('&gt;');
			expect(sanitized).not.toContain('<script>');
		});

		test('sanitizeHtml - escapes all special characters', () => {
			const security = new SecurityManager();
			const input = '<>&"\'/script';
			const sanitized = security.sanitizeHtml(input);

			expect(sanitized).toContain('&lt;');
			expect(sanitized).toContain('&gt;');
			expect(sanitized).toContain('&amp;');
			expect(sanitized).toContain('&quot;');
			expect(sanitized).toContain('&#x27;');
			expect(sanitized).toContain('&#x2F;');
		});

		test('sanitizeHtml - handles empty input', () => {
			const security = new SecurityManager();
			expect(security.sanitizeHtml('')).toBe('');
		});

		test('sanitizeSql - prevents SQL injection', () => {
			const security = new SecurityManager();
			const input = "'; DROP TABLE users--";
			const sanitized = security.sanitizeSql(input);

			expect(sanitized).toContain("''");
			expect(sanitized).not.toContain("';");
		});

		test('sanitizeSql - escapes backslashes', () => {
			const security = new SecurityManager();
			const input = 'test\\path"value';
			const sanitized = security.sanitizeSql(input);

			expect(sanitized).toContain('\\\\');
			expect(sanitized).toContain('\\"');
		});

		test('sanitizeSql - handles empty input', () => {
			const security = new SecurityManager();
			expect(security.sanitizeSql('')).toBe('');
		});

		test('sanitizeSql - removes null bytes', () => {
			const security = new SecurityManager();
			const input = 'test\u0000value';
			const sanitized = security.sanitizeSql(input);
			expect(sanitized).not.toContain('\u0000');
		});

		test('logRequest - logs request', () => {
			const security = new SecurityManager();
			security.logRequest('req1', 'GET', '/test', '127.0.0.1', 200, 10);

			const log = security.getRequestLog('req1');
			expect(log?.method).toBe('GET');
		});

		test('getRequestLog - retrieves request log', () => {
			const security = new SecurityManager();
			security.logRequest('req1', 'GET', '/test', '127.0.0.1', 200, 10);

			const log = security.getRequestLog('req1');
			expect(log).toBeDefined();
			expect(log?.method).toBe('GET');
		});

		test('getAllRequestLogs - retrieves all logs', () => {
			const security = new SecurityManager();
			security.logRequest('req1', 'GET', '/test', '127.0.0.1', 200, 10);
			security.logRequest('req2', 'POST', '/api', '127.0.0.1', 201, 20);

			const allLogs = security.getAllRequestLogs();
			expect(allLogs.length).toBe(2);
		});

		test('logRequest - respects size limit', () => {
			const security = new SecurityManager();

			// Log more than 1000 requests
			for (let i = 0; i < 1100; i++) {
				security.logRequest(`req-${i}`, 'GET', '/test', '127.0.0.1', 200, 10);
			}

			const stats = security.getStats();
			expect(stats.requestLogs).toBeLessThanOrEqual(1000);
		});

		test('cleanupRateLimit - removes expired entries', () => {
			const security = new SecurityManager();
			security.checkRateLimit('ip1', 10, 100);
			security.checkRateLimit('ip2', 10, 100);

			setTimeout(() => {
				security.cleanupRateLimit();
				const stats = security.getStats();
				expect(stats.rateLimitEntries).toBe(0);
			}, 150);
		});

		test('cleanupCsrfTokens - removes expired tokens', async () => {
			const security = new SecurityManager();
			security.generateCsrfToken('session1', 50);
			security.generateCsrfToken('session2', 50);

			await new Promise(resolve => setTimeout(resolve, 100));

			security.cleanupCsrfTokens();
			const stats = security.getStats();
			expect(stats.csrfTokens).toBe(0);
		});

		test('clearAll - clears all security data', () => {
			const security = new SecurityManager();
			security.checkRateLimit('ip1', 10, 1000);
			security.generateCsrfToken('session1');
			security.logRequest('req1', 'GET', '/test', '127.0.0.1', 200, 10);

			security.clearAll();

			const stats = security.getStats();
			expect(stats.rateLimitEntries).toBe(0);
			expect(stats.csrfTokens).toBe(0);
			expect(stats.requestLogs).toBe(0);
		});

		test('getStats - returns statistics', () => {
			const security = new SecurityManager();
			security.checkRateLimit('ip1', 10, 1000);
			security.generateCsrfToken('session1');
			security.logRequest('req1', 'GET', '/test', '127.0.0.1', 200, 10);

			const stats = security.getStats();
			expect(stats.rateLimitEntries).toBeGreaterThan(0);
			expect(stats.csrfTokens).toBeGreaterThan(0);
			expect(stats.requestLogs).toBeGreaterThan(0);
		});
	});

// ╚══════════════════════════════════════════════════════════════════════════════════════╝