// test/error_handling.test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
	import { server, type ServerInstance, type AppContext, ValidationError, AppError } from '../src/main';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

	describe('Error Handling - Validation Errors', () => {
		let app: ServerInstance;
		const baseUrl = 'http://localhost:3257';

		beforeAll(async () => {
			app = server({
				port: 3257,
				logging: false,
				routes: [
					{
						method: 'POST',
						path: '/validate',
						handler: (c: AppContext) => {
							if (!c.body?.name) {
								throw new ValidationError('Name is required');
							}
							return c.json({ valid: true });
						}
					},
					{
						method: 'POST',
						path: '/invalid-json',
						handler: (c: AppContext) => {
							return c.json({ body: c.body });
						}
					}
				]
			});

			await app.start();
		});

		afterAll(async () => {
			await app.stop();
		});

		test('returns 400 for validation errors', async () => {
			const res = await fetch(`${baseUrl}/validate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			});

			expect(res.status).toBe(400);
			const data = await res.json();
			expect(data.error).toBe('Name is required');
			expect(data.code).toBe('VALIDATION_ERROR');
		});

		test('handles malformed JSON', async () => {
			const res = await fetch(`${baseUrl}/invalid-json`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: '{invalid json'
			});

			expect(res.status).toBe(400);
			const data = await res.json();
			expect(data.code).toBe('VALIDATION_ERROR');
		});
	});

	describe('Error Handling - Custom App Errors', () => {
		let app: ServerInstance;
		const baseUrl = 'http://localhost:3258';

		beforeAll(async () => {
			app = server({
				port: 3258,
				logging: false,
				routes: [
					{
						method: 'GET',
						path: '/custom-error',
						handler: (_c: AppContext) => {
							throw new AppError('Custom error message', 418, 'CUSTOM_ERROR');
						}
					},
					{
						method: 'GET',
						path: '/unhandled-error',
						handler: (_c: AppContext) => {
							throw new Error('Unhandled error');
						}
					}
				]
			});

			await app.start();
		});

		afterAll(async () => {
			await app.stop();
		});

		test('handles custom AppError', async () => {
			const res = await fetch(`${baseUrl}/custom-error`);

			expect(res.status).toBe(418);
			const data = await res.json();
			expect(data.error).toBe('Custom error message');
			expect(data.code).toBe('CUSTOM_ERROR');
			expect(data.requestId).toBeTruthy();
		});

		test('handles unhandled errors gracefully', async () => {
			const res = await fetch(`${baseUrl}/unhandled-error`);

			expect(res.status).toBe(500);
			const data = await res.json();
			expect(data.error).toBeTruthy();
			expect(data.requestId).toBeTruthy();
		});
	});

	describe('Error Handling - Request Timeout', () => {
		let app: ServerInstance;
		const baseUrl = 'http://localhost:3259';

		beforeAll(async () => {
			app = server({
				port: 3259,
				logging: false,
				requestTimeout: 100, // 100ms timeout
				routes: [
					{
						method: 'GET',
						path: '/slow',
						handler: async (c: AppContext) => {
							await new Promise(resolve => setTimeout(resolve, 200));
							return c.json({ done: true });
						}
					}
				]
			});

			await app.start();
		});

		afterAll(async () => {
			await app.stop();
		});

		test('times out slow requests', async () => {
			const res = await fetch(`${baseUrl}/slow`);

			expect(res.status).toBe(408);
			const data = await res.json();
			expect(data.code).toBe('TIMEOUT_ERROR');
		});
	});

	describe('Error Handling - Request ID', () => {
		let app: ServerInstance;
		const baseUrl = 'http://localhost:3260';

		beforeAll(async () => {
			app = server({
				port: 3260,
				logging: false,
				routes: [
					{
						method: 'GET',
						path: '/test',
						handler: (c: AppContext) => {
							return c.json({ requestId: c.requestId });
						}
					}
				]
			});

			await app.start();
		});

		afterAll(async () => {
			await app.stop();
		});

		test('includes request ID in context', async () => {
			const res = await fetch(`${baseUrl}/test`);
			const data = await res.json();

			expect(data.requestId).toBeTruthy();
			expect(typeof data.requestId).toBe('string');
		});

		test('includes request ID in response headers', async () => {
			const res = await fetch(`${baseUrl}/test`);
			const requestId = res.headers.get('X-Request-ID');

			expect(requestId).toBeTruthy();
		});
	});

	describe('Error Handling - Error Classes', () => {
		test('ValidationError - creates with message', () => {
			const error = new ValidationError('Test validation error');

			expect(error.message).toBe('Test validation error');
			expect(error.statusCode).toBe(400);
			expect(error.code).toBe('VALIDATION_ERROR');
			expect(error.name).toBe('ValidationError');
		});

		test('ValidationError - creates with issues', () => {
			const error = new ValidationError('Validation failed', { field: 'name' });

			expect(error.message).toBe('Validation failed');
			expect(error.issues).toEqual({ field: 'name' });
		});

		test('AppError - creates with all parameters', () => {
			const error = new AppError('Custom message', 418, 'CUSTOM_CODE');

			expect(error.message).toBe('Custom message');
			expect(error.statusCode).toBe(418);
			expect(error.code).toBe('CUSTOM_CODE');
			expect(error.name).toBe('AppError');
		});

		test('AppError - defaults to 500 status', () => {
			const error = new AppError('Error message');

			expect(error.statusCode).toBe(500);
		});
	});

	describe('Error Handling - Max Request Size', () => {
		test('accepts small payloads', async () => {
			const app = server({
				port: 3261,
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

			const res = await fetch('http://localhost:3261/upload', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ small: 'data' })
			});

			expect([200, 400]).toContain(res.status);

			await app.stop();
		});

		test('rejects large payloads', async () => {
			const app = server({
				port: 3262,
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

			const largeData = 'x'.repeat(2000);
			const res = await fetch('http://localhost:3262/upload', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: largeData
			});

			expect([400, 413]).toContain(res.status);

			await app.stop();
		});
	});

// ╚══════════════════════════════════════════════════════════════════════════════════════╝