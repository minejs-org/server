// test/context_api.test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
	import { server, type ServerInstance, type AppContext } from '../src/main';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

	describe('Context API - Response Methods', () => {
		let app: ServerInstance;
		const baseUrl = 'http://localhost:3203';

		beforeAll(async () => {
			app = server({
				port: 3203,
				logging: false,
				routes: [
					{
						method: 'GET',
						path: '/text',
						handler: (c: AppContext) => c.text('Hello World')
					},
					{
						method: 'GET',
						path: '/html',
						handler: (c: AppContext) => c.html('<h1>Hello</h1>')
					},
					{
						method: 'GET',
						path: '/redirect',
						handler: (c: AppContext) => c.redirect('/text')
					},
					{
						method: 'GET',
						path: '/file',
						handler: (c: AppContext) => c.file('./package.json', 'application/json')
					},
					{
						method: 'GET',
						path: '/status-chain',
						handler: (c: AppContext) => c.status(201).json({ created: true })
					}
				]
			});

			await app.start();
		});

		afterAll(async () => {
			await app.stop();
		});

		test('text() - returns text response', async () => {
			const res = await fetch(`${baseUrl}/text`);
			expect(res.status).toBe(200);
			expect(res.headers.get('Content-Type')).toBe('text/plain');
			const text = await res.text();
			expect(text).toBe('Hello World');
		});

		test('html() - returns HTML response', async () => {
			const res = await fetch(`${baseUrl}/html`);
			expect(res.status).toBe(200);
			expect(res.headers.get('Content-Type')).toContain('text/html');
			const html = await res.text();
			expect(html).toBe('<h1>Hello</h1>');
		});

		test('redirect() - returns redirect response', async () => {
			const res = await fetch(`${baseUrl}/redirect`, { redirect: 'manual' });
			expect(res.status).toBe(302);
			expect(res.headers.get('Location')).toBe('/text');
		});

		test('status() - allows status chaining', async () => {
			const res = await fetch(`${baseUrl}/status-chain`);
			expect(res.status).toBe(201);
			const data = await res.json();
			expect(data.created).toBe(true);
		});
	});

	describe('Context API - Headers', () => {
		let app: ServerInstance;
		const baseUrl = 'http://localhost:3204';

		beforeAll(async () => {
			app = server({
				port: 3204,
				logging: false,
				routes: [
					{
						method: 'GET',
						path: '/set-header',
						handler: (c: AppContext) => {
							c.setHeader('X-Custom', 'value');
							const custom = c.getHeader('X-Custom');
							return c.json({ custom });
						}
					},
					{
						method: 'GET',
						path: '/get-header',
						handler: (c: AppContext) => {
							const userAgent = c.getHeader('User-Agent');
							return c.json({ userAgent: userAgent || 'none' });
						}
					}
				]
			});

			await app.start();
		});

		afterAll(async () => {
			await app.stop();
		});

		test('setHeader() - sets custom header', async () => {
			const res = await fetch(`${baseUrl}/set-header`);
			const data = await res.json();
			expect(data.custom).toBe('value');
		});

		test('getHeader() - gets request header', async () => {
			const res = await fetch(`${baseUrl}/get-header`, {
				headers: { 'User-Agent': 'TestAgent/1.0' }
			});
			const data = await res.json();
			expect(data.userAgent).toBe('TestAgent/1.0');
		});
	});

	describe('Context API - Cookies', () => {
		let app: ServerInstance;
		const baseUrl = 'http://localhost:3205';

		beforeAll(async () => {
			app = server({
				port: 3205,
				logging: false,
				routes: [
					{
						method: 'GET',
						path: '/set-cookie',
						handler: (c: AppContext) => {
							c.setCookie('test', 'value123', {
								maxAge: 3600,
								path: '/',
								httpOnly: true,
								secure: true,
								sameSite: 'Strict'
							});
							return c.json({ set: true });
						}
					},
					{
						method: 'GET',
						path: '/set-cookie-expires',
						handler: (c: AppContext) => {
							c.setCookie('test', 'value', {
								expires: new Date(Date.now() + 3600000),
								domain: 'example.com',
								secure: true
							});
							return c.json({ ok: true });
						}
					},
					{
						method: 'GET',
						path: '/get-cookie',
						handler: (c: AppContext) => {
							const value = c.getCookie('test');
							return c.json({ value });
						}
					},
					{
						method: 'GET',
						path: '/delete-cookie',
						handler: (c: AppContext) => {
							c.deleteCookie('test');
							return c.json({ deleted: true });
						}
					},
					{
						method: 'GET',
						path: '/multiple-cookies',
						handler: (c: AppContext) => {
							c.setCookie('cookie1', 'value1');
							c.setCookie('cookie2', 'value2');
							c.setCookie('cookie3', 'value3');
							return c.json({ set: 3 });
						}
					}
				]
			});

			await app.start();
		});

		afterAll(async () => {
			await app.stop();
		});

		test('setCookie() - sets cookie with all options', async () => {
			const res = await fetch(`${baseUrl}/set-cookie`);
			const setCookieHeader = res.headers.get('Set-Cookie');

			expect(setCookieHeader).toBeTruthy();
			expect(setCookieHeader).toContain('test=value123');
			expect(setCookieHeader).toContain('Max-Age=3600');
			expect(setCookieHeader).toContain('Path=/');
			expect(setCookieHeader).toContain('HttpOnly');
			expect(setCookieHeader).toContain('Secure');
			expect(setCookieHeader).toContain('SameSite=Strict');
		});

		test('setCookie() - with expires option', async () => {
			const res = await fetch(`${baseUrl}/set-cookie-expires`);
			const setCookie = res.headers.get('Set-Cookie');
			expect(setCookie).toContain('Expires=');
			expect(setCookie).toContain('Domain=example.com');
		});

		test('getCookie() - gets cookie from request', async () => {
			const res = await fetch(`${baseUrl}/get-cookie`, {
				headers: { 'Cookie': 'test=value123' }
			});
			const data = await res.json();
			expect(data.value).toBe('value123');
		});

		test('getCookie() - returns undefined for missing cookie', async () => {
			const res = await fetch(`${baseUrl}/get-cookie`);
			const data = await res.json();
			expect(data.value).toBeUndefined();
		});

		test('getCookie() - handles empty cookie header', async () => {
			const res = await fetch(`${baseUrl}/get-cookie`, {
				headers: { Cookie: '' }
			});
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.value).toBeUndefined();
		});

		test('getCookie() - handles cookie with equals in value', async () => {
			const res = await fetch(`${baseUrl}/get-cookie`, {
				headers: { 'Cookie': 'test=value=with=equals' }
			});
			const data = await res.json();
			expect(data.value).toBe('value=with=equals');
		});

		test('getCookie() - handles multiple cookies in request', async () => {
			const res = await fetch(`${baseUrl}/get-cookie`, {
				headers: { 'Cookie': 'cookie1=value1; test=myvalue; cookie2=value2' }
			});
			const data = await res.json();
			expect(data.value).toBe('myvalue');
		});

		test('getCookie() - handles URL-encoded cookie values', async () => {
			const res = await fetch(`${baseUrl}/get-cookie`, {
				headers: { 'Cookie': 'test=Hello%20World' }
			});
			const data = await res.json();
			expect(data.value).toBe('Hello World');
		});

		test('deleteCookie() - deletes cookie', async () => {
			const res = await fetch(`${baseUrl}/delete-cookie`);
			const setCookieHeader = res.headers.get('Set-Cookie');

			expect(setCookieHeader).toBeTruthy();
			expect(setCookieHeader).toContain('Max-Age=0');
		});

		test('multiple cookies - handles multiple set-cookie headers', async () => {
			const res = await fetch(`${baseUrl}/multiple-cookies`);
			const setCookieHeaders = res.headers.get('Set-Cookie');
			expect(setCookieHeaders).toBeTruthy();
		});
	});

	describe('Context API - Request ID', () => {
		let app: ServerInstance;
		const baseUrl = 'http://localhost:3206';

		beforeAll(async () => {
			app = server({
				port: 3206,
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

// ╚══════════════════════════════════════════════════════════════════════════════════════╝
