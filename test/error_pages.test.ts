/* eslint-disable @typescript-eslint/no-explicit-any */
// test/error_pages.test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
	import { server, type ServerInstance, type AppContext } from '../src/main';
	import { join } from 'path';
	import { mkdirSync, writeFileSync, rmSync } from 'fs';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

	describe('Error Pages - onError Handler', () => {
		let app: ServerInstance;
		const baseUrl = 'http://localhost:3210';
		const staticDir = './test-static-error-pages';

		beforeAll(async () => {
			// Create test static directory
			mkdirSync(staticDir, { recursive: true });
			writeFileSync(join(staticDir, 'index.html'), '<h1>Home</h1>');
			writeFileSync(join(staticDir, 'style.css'), 'body { color: blue; }');

			app = server({
				port: 3210,
				logging: false,
				static: {
					path: '/public',
					directory: staticDir
				},
				routes: [
					{
						method: 'GET',
						path: '/api/users',
						handler: (c: AppContext) => c.json({ users: [{ id: 1, name: 'Ahmed' }] })
					}
				],
				onError: async (statusCode, path, method) => {
					// Custom error page handler
					const errorPageHtml = `
						<!DOCTYPE html>
						<html>
						<head>
							<title>Error ${statusCode}</title>
							<style>
								body { 
									font-family: Arial, sans-serif; 
									display: flex;
									justify-content: center;
									align-items: center;
									height: 100vh;
									margin: 0;
									background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
								}
								.container {
									text-align: center;
									background: white;
									padding: 40px;
									border-radius: 10px;
									box-shadow: 0 10px 25px rgba(0,0,0,0.2);
								}
								h1 { color: #333; margin: 0; }
								p { color: #666; margin: 10px 0 0 0; }
								code { 
									background: #f4f4f4; 
									padding: 2px 6px; 
									border-radius: 3px;
									font-size: 12px;
								}
							</style>
						</head>
						<body>
							<div class="container">
								<h1>${statusCode}</h1>
								<p>Page not found</p>
								<code>${method} ${path}</code>
								<p style="font-size: 12px; color: #999; margin-top: 20px;">
									Back to <a href="/public/index.html">home</a>
								</p>
							</div>
						</body>
						</html>
					`;
					
					return new Response(errorPageHtml, {
						status: statusCode,
						headers: { 'Content-Type': 'text/html; charset=utf-8' }
					});
				}
			});

			await app.start();
		});

		afterAll(async () => {
			await app.stop();
			// Cleanup
			rmSync(staticDir, { recursive: true, force: true });
		});

		test('Static files are accessible without error pages interfering', async () => {
			const res = await fetch(`${baseUrl}/public/index.html`);
			expect(res.status).toBe(200);
			expect(res.headers.get('content-type')).toContain('text/html');
			const text = await res.text();
			expect(text).toContain('<h1>Home</h1>');
		});

		test('Static CSS files are accessible', async () => {
			const res = await fetch(`${baseUrl}/public/style.css`);
			expect(res.status).toBe(200);
			expect(res.headers.get('content-type')).toContain('text/css');
			const text = await res.text();
			expect(text).toContain('body { color: blue; }');
		});

		test('API routes work normally', async () => {
			const res = await fetch(`${baseUrl}/api/users`);
			expect(res.status).toBe(200);
			const data = await res.json() as any;
			expect(data.users).toBeDefined();
			expect(data.users.length).toBe(1);
		});

		test('onError handler is called for non-existent routes', async () => {
			const res = await fetch(`${baseUrl}/api/non-existent`);
			expect(res.status).toBe(404);
			expect(res.headers.get('content-type')).toContain('text/html');
			const html = await res.text();
			expect(html).toContain('404');
			expect(html).toContain('GET /api/non-existent');
		});

		test('onError handler returns custom error page for 404', async () => {
			const res = await fetch(`${baseUrl}/does-not-exist`);
			expect(res.status).toBe(404);
			const html = await res.text();
			expect(html).toContain('Page not found');
			expect(html).toContain('does-not-exist');
		});

		test('onError handler is called with correct status code', async () => {
			const res = await fetch(`${baseUrl}/missing-page`);
			expect(res.status).toBe(404);
			const html = await res.text();
			expect(html).toContain('<h1>404</h1>');
		});

		test('Static files remain accessible when onError is defined', async () => {
			// This is the key test - ensuring static files work even with wildcard routes
			const res1 = await fetch(`${baseUrl}/public/index.html`);
			expect(res1.status).toBe(200);

			// And 404 pages work for non-existent routes
			const res2 = await fetch(`${baseUrl}/api/missing`);
			expect(res2.status).toBe(404);
			const html = await res2.text();
			expect(html).toContain('404');

			// And static files still work after 404
			const res3 = await fetch(`${baseUrl}/public/style.css`);
			expect(res3.status).toBe(200);
		});
	});

	describe('Error Pages - Without onError Handler', () => {
		let app: ServerInstance;
		const baseUrl = 'http://localhost:3211';
		const staticDir = './test-static-default-errors';

		beforeAll(async () => {
			mkdirSync(staticDir, { recursive: true });
			writeFileSync(join(staticDir, 'test.txt'), 'test content');

			app = server({
				port: 3211,
				logging: false,
				static: {
					path: '/static',
					directory: staticDir
				}
				// No onError handler - should use default behavior
			});

			await app.start();
		});

		afterAll(async () => {
			await app.stop();
			rmSync(staticDir, { recursive: true, force: true });
		});

		test('Returns default 404 response when onError is not provided', async () => {
			const res = await fetch(`${baseUrl}/api/unknown`);
			expect(res.status).toBe(404);
			const data = await res.json() as any;
			expect(data.error).toBe('Not Found');
			expect(data.path).toBe('/api/unknown');
		});

		test('Static files still work without onError handler', async () => {
			const res = await fetch(`${baseUrl}/static/test.txt`);
			expect(res.status).toBe(200);
			const text = await res.text();
			expect(text).toBe('test content');
		});
	});

	describe('Error Pages - Advanced Scenarios', () => {
		let app: ServerInstance;
		const baseUrl = 'http://localhost:3212';
		const staticDir = './test-static-advanced';

		beforeAll(async () => {
			mkdirSync(staticDir, { recursive: true });
			writeFileSync(join(staticDir, 'app.js'), 'console.log("test");');

			app = server({
				port: 3212,
				logging: false,
				static: {
					path: '/assets',
					directory: staticDir
				},
				routes: [
					{
						method: 'GET',
						path: '/api/status',
						handler: (c: AppContext) => c.json({ ok: true })
					}
				],
				onError: async (statusCode, path) => {
					// Context-aware error handler
					if (path.startsWith('/api/')) {
						// JSON error for API paths
						return new Response(
							JSON.stringify({
								error: 'Not Found',
								path,
								statusCode,
								timestamp: new Date().toISOString()
							}),
							{
								status: statusCode,
								headers: { 'Content-Type': 'application/json' }
							}
						);
					} else if (path.startsWith('/assets/')) {
						// File not found for assets
						return new Response(
							'File not found',
							{ status: 404, headers: { 'Content-Type': 'text/plain' } }
						);
					} else {
						// HTML error for other paths
						return new Response(
							'<h1>404 - Page Not Found</h1>',
							{ status: 404, headers: { 'Content-Type': 'text/html' } }
						);
					}
				}
			});

			await app.start();
		});

		afterAll(async () => {
			await app.stop();
			rmSync(staticDir, { recursive: true, force: true });
		});

		test('onError handler receives correct path information', async () => {
			const res = await fetch(`${baseUrl}/api/missing`);
			expect(res.status).toBe(404);
			const data = await res.json() as any;
			expect(data.path).toBe('/api/missing');
			expect(data.error).toBe('Not Found');
		});

		test('onError handler can differentiate API errors from others', async () => {
			// API error
			const apiRes = await fetch(`${baseUrl}/api/unknown`);
			expect(apiRes.status).toBe(404);
			const apiData = await apiRes.json() as any;
			expect(apiData.path).toBe('/api/unknown');

			// Regular page error
			const pageRes = await fetch(`${baseUrl}/page`);
			expect(pageRes.status).toBe(404);
			const pageHtml = await pageRes.text();
			expect(pageHtml).toContain('404 - Page Not Found');
		});

		test('Static files work correctly with context-aware error handler', async () => {
			const res = await fetch(`${baseUrl}/assets/app.js`);
			expect(res.status).toBe(200);
			const content = await res.text();
			expect(content).toContain('console.log');
		});

		test('Existing API routes still work with error handler', async () => {
			const res = await fetch(`${baseUrl}/api/status`);
			expect(res.status).toBe(200);
			const data = await res.json() as any;
			expect(data.ok).toBe(true);
		});
	});

// ╚══════════════════════════════════════════════════════════════════════════════════════╝
