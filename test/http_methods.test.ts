// test/http_methods.test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
	import { server, type ServerInstance, type AppContext } from '../src/main';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

	describe('HTTP Methods', () => {
		let app: ServerInstance;
		const baseUrl = 'http://localhost:3200';

		beforeAll(async () => {
			app = server({
				port: 3200,
				logging: false,
				routes: [
					{
						method: 'GET',
						path: '/test',
						handler: (c: AppContext) => c.json({ method: 'GET' })
					},
					{
						method: 'POST',
						path: '/test',
						handler: (c: AppContext) => c.json({ method: 'POST', body: c.body })
					},
					{
						method: 'PUT',
						path: '/update',
						handler: (c: AppContext) => c.json({ method: 'PUT', body: c.body })
					},
					{
						method: 'PATCH',
						path: '/patch',
						handler: (c: AppContext) => c.json({ method: 'PATCH', body: c.body })
					},
					{
						method: 'DELETE',
						path: '/delete',
						handler: (c: AppContext) => c.json({ method: 'DELETE' })
					}
				]
			});

			await app.start();
		});

		afterAll(async () => {
			await app.stop();
		});

		test('GET - handles GET requests', async () => {
			const res = await fetch(`${baseUrl}/test`);
			const data = await res.json();
			expect(res.status).toBe(200);
			expect(data.method).toBe('GET');
		});

		test('POST - handles POST with JSON body', async () => {
			const res = await fetch(`${baseUrl}/test`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ test: 'data' })
			});
			const data = await res.json();
			expect(res.status).toBe(200);
			expect(data.method).toBe('POST');
			expect(data.body).toEqual({ test: 'data' });
		});

		test('POST - handles empty JSON body', async () => {
			const res = await fetch(`${baseUrl}/test`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: ''
			});
			const data = await res.json();
			expect(res.status).toBe(200);
			expect(data.body).toEqual({});
		});

		test('POST - handles form-urlencoded body', async () => {
			const res = await fetch(`${baseUrl}/test`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: 'name=John&age=30'
			});

			const data = await res.json();
			expect(res.status).toBe(200);
			expect(data.body).toEqual({ name: 'John', age: '30' });
		});

		test('POST - handles multipart form data', async () => {
			const formData = new FormData();
			formData.append('file', 'test content');

			const res = await fetch(`${baseUrl}/test`, {
				method: 'POST',
				body: formData
			});

			const data = await res.json();
			expect(res.status).toBe(200);
			expect(data.body).toBeDefined();
		});

		test('POST - handles non-JSON/form content types', async () => {
			const res = await fetch(`${baseUrl}/test`, {
				method: 'POST',
				headers: { 'Content-Type': 'text/plain' },
				body: 'plain text'
			});

			const data = await res.json();
			expect(data.body).toEqual({});
		});

		test('POST - handles request without content-type', async () => {
			const res = await fetch(`${baseUrl}/test`, {
				method: 'POST',
				body: 'plain text data'
			});
			const data = await res.json();
			expect(data.body).toEqual({});
		});

		test('PUT - handles PUT requests', async () => {
			const res = await fetch(`${baseUrl}/update`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ update: true })
			});
			const data = await res.json();
			expect(res.status).toBe(200);
			expect(data.method).toBe('PUT');
			expect(data.body).toEqual({ update: true });
		});

		test('PATCH - handles PATCH requests', async () => {
			const res = await fetch(`${baseUrl}/patch`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ field: 'value' })
			});
			const data = await res.json();
			expect(res.status).toBe(200);
			expect(data.method).toBe('PATCH');
			expect(data.body).toEqual({ field: 'value' });
		});

		test('DELETE - handles DELETE requests', async () => {
			const res = await fetch(`${baseUrl}/delete`, { method: 'DELETE' });
			const data = await res.json();
			expect(res.status).toBe(200);
			expect(data.method).toBe('DELETE');
		});

		test('404 - returns 404 for non-existent routes', async () => {
			const res = await fetch(`${baseUrl}/nonexistent`);
			expect(res.status).toBe(404);
			const data = await res.json();
			expect(data.error).toBe('Not Found');
		});
	});

// ╚══════════════════════════════════════════════════════════════════════════════════════╝
