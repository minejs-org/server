/* eslint-disable @typescript-eslint/no-explicit-any */
// test/health_lifecycle.test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
	import { server, type ServerInstance } from '../src/main';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

	describe('Health Endpoints - Basic', () => {
		let app: ServerInstance;
		const baseUrl = 'http://localhost:3249';

		beforeAll(async () => {
			app = server({
				port: 3249,
				logging: false
			});

			await app.start();
		});

		afterAll(async () => {
			await app.stop();
		});

		test('/health - responds with healthy status', async () => {
			const res = await fetch(`${baseUrl}/health`);
			const data = await res.json();

			expect(res.status).toBe(200);
			expect(data.status).toBe('healthy');
			expect(data.timestamp).toBeTruthy();
			expect(typeof data.uptime).toBe('number');
			expect(data.activeRequests).toBeDefined();
		});

		test('/readiness - responds with ready status', async () => {
			const res = await fetch(`${baseUrl}/readiness`);
			const data = await res.json();

			expect(res.status).toBe(200);
			expect(data.ready).toBe(true);
			expect(data.checks).toBeDefined();
			expect(data.checks.database).toBe('not configured');
			expect(data.timestamp).toBeTruthy();
		});

		test('/health - includes security headers', async () => {
			const res = await fetch(`${baseUrl}/health`);

			expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
			expect(res.headers.get('X-Frame-Options')).toBe('DENY');
			expect(res.headers.get('X-XSS-Protection')).toBe('1; mode=block');
			expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
		});

		test('/health - includes request ID', async () => {
			const res = await fetch(`${baseUrl}/health`);
			const requestId = res.headers.get('X-Request-ID');

			expect(requestId).toBeTruthy();
			expect(typeof requestId).toBe('string');
		});
	});

	describe('Health Endpoints - With Database', () => {
		let app: ServerInstance;
		const baseUrl = 'http://localhost:3250';

		beforeAll(async () => {
			app = server({
				port: 3250,
				logging: false,
				database: {
					connection: ':memory:'
				}
			});

			await app.start();
		});

		afterAll(async () => {
			await app.stop();
		});

		test('/readiness - shows database connected', async () => {
			const res = await fetch(`${baseUrl}/readiness`);
			const data = await res.json();

			expect(res.status).toBe(200);
			expect(data.ready).toBe(true);
			expect(data.checks.database).toBe('connected');
		});
	});

	describe('Health Endpoints - Concurrent Requests', () => {
		let app: ServerInstance;
		const baseUrl = 'http://localhost:3251';

		beforeAll(async () => {
			app = server({
				port: 3251,
				logging: false
			});

			await app.start();
		});

		afterAll(async () => {
			await app.stop();
		});

		test('handles concurrent health checks', async () => {
			const requests = Array.from({ length: 10 }, () =>
				fetch(`${baseUrl}/health`)
			);

			const responses = await Promise.all(requests);

			expect(responses.every(r => r.status === 200)).toBe(true);
		});

		test('tracks active requests', async () => {
			const res = await fetch(`${baseUrl}/health`);
			const data = await res.json();

			expect(typeof data.activeRequests).toBe('number');
		});
	});

	describe('Server Lifecycle - Configuration', () => {
		test('accepts custom port and hostname', async () => {
			const app = server({
				port: 3252,
				hostname: 'localhost',
				logging: false
			});

			await app.start();

			const res = await fetch('http://localhost:3252/health');
			expect(res.status).toBe(200);

			await app.stop();
		});

		test('uses default values when config is empty', async () => {
			const app = server({});

			expect(app.logger).toBe(null);
			expect(app.db.size).toBe(0);
		});

		test('accepts custom timeouts', async () => {
			const app = server({
				port: 3253,
				requestTimeout: 5000,
				gracefulShutdownTimeout: 2000,
				logging: false,
				routes: [
					{
						method: 'GET',
						path: '/test',
						handler: (c) => c.json({ ok: true })
					}
				]
			});

			await app.start();

			const res = await fetch('http://localhost:3253/test');
			expect(res.status).toBe(200);

			await app.stop();
		});
	});

	describe('Server Lifecycle - Startup', () => {
		test('calls onStartup handler', async () => {
			let startupCalled = false;

			const app = server({
				port: 3254,
				logging: false,
				onStartup: async () => {
					startupCalled = true;
				}
			});

			await app.start();
			await app.stop();

			expect(startupCalled).toBe(true);
		});

		test('passes app instance to onStartup handler', async () => {
			let receivedApp: any = null;

			const app = server({
				port: 3254,
				logging: false,
				onStartup: async (appInstance: any) => {
					receivedApp = appInstance;
				}
			});

			await app.start();

			expect(receivedApp).toBeTruthy();
			expect(receivedApp.logger).toBeDefined();
			expect(receivedApp.db).toBeDefined();

			await app.stop();
		});

		test('handles error in startup handler', async () => {
			const app = server({
				port: 3254,
				logging: false,
				onStartup: async () => {
					throw new Error('Startup error');
				}
			});

			let error: any = null;
			try {
				await app.start();
			} catch (e) {
				error = e;
			}

			// Should not throw, should handle error gracefully
			expect(error).toBe(null);
			await app.stop();
		});
	});

	describe('Server Lifecycle - Shutdown', () => {
		test('calls onShutdown handler', async () => {
			let shutdownCalled = false;

			const app = server({
				port: 3255,
				logging: false,
				onShutdown: async () => {
					shutdownCalled = true;
				}
			});

			await app.start();
			await app.stop();

			expect(shutdownCalled).toBe(true);
		});

		test('handles error in shutdown handler', async () => {
			const app = server({
				port: 3256,
				logging: false,
				onShutdown: async () => {
					throw new Error('Shutdown error');
				}
			});

			await app.start();

			let error: any = null;
			try {
				await app.stop();
			} catch (e) {
				error = e;
			}

			expect(error).toBe(null);
		});
	});

	describe('Server Lifecycle - API Configuration', () => {
		test('accepts apiPrefix and apiVersion', async () => {
			const app = server({
				port: 3257,
				apiPrefix: '/v2',
				apiVersion: 'v2',
				logging: false
			});

			await app.start();

			const routes = app.getRoutes();
			expect(routes.length).toBeGreaterThanOrEqual(2);

			await app.stop();
		});
	});

// ╚══════════════════════════════════════════════════════════════════════════════════════╝
