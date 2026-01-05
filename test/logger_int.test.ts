// test/logger_int.test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { describe, test, expect } from 'bun:test';
	import { server, type AppContext } from '../src/main';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

	describe('Logger Integration - Enabled Logging', () => {
		test('provides logger instance when enabled', async () => {
			const app = server({
				port: 3224,
				logging: {
					level: 'info',
					pretty: false
				},
				routes: [
					{
						method: 'GET',
						path: '/test',
						handler: (c: AppContext) => {
							return c.json({
								hasLogger: !!c.logger,
								loggerType: typeof c.logger
							});
						}
					}
				]
			});

			await app.start();

			const res = await fetch('http://localhost:3224/test');
			const data = await res.json();

			expect(data.hasLogger).toBe(true);
			expect(data.loggerType).toBe('object');
			expect(app.logger).not.toBe(null);

			await app.stop();
		});

		test('logger is accessible in route handlers', async () => {
			const app = server({
				port: 3225,
				logging: {
					level: 'debug',
					pretty: true
				},
				routes: [
					{
						method: 'GET',
						path: '/log-test',
						handler: (c: AppContext) => {
							// Route can use logger
							c.logger?.info({ test: 'data' }, 'Test log from route');
							return c.json({ logged: true });
						}
					}
				]
			});

			await app.start();

			const res = await fetch('http://localhost:3225/log-test');
			const data = await res.json();

			expect(res.status).toBe(200);
			expect(data.logged).toBe(true);

			await app.stop();
		});
	});

	describe('Logger Integration - Disabled Logging', () => {
		test('logger is null when disabled', async () => {
			const app = server({
				port: 3226,
				logging: false,
				routes: [
					{
						method: 'GET',
						path: '/test',
						handler: (c: AppContext) => {
							return c.json({
								hasLogger: !!c.logger,
								isNull: c.logger === null
							});
						}
					}
				]
			});

			await app.start();

			const res = await fetch('http://localhost:3226/test');
			const data = await res.json();

			expect(data.hasLogger).toBe(false);
			expect(data.isNull).toBe(true);
			expect(app.logger).toBe(null);

			await app.stop();
		});
	});

	describe('Logger Integration - Default Config', () => {
		test('logging disabled by default', async () => {
			const app = server({
				port: 3227,
				routes: [
					{
						method: 'GET',
						path: '/test',
						handler: (c: AppContext) => c.json({ ok: true })
					}
				]
			});

			await app.start();
			expect(app.logger).toBe(null);
			await app.stop();
		});
	});

	describe('Logger Integration - Different Levels', () => {
		test('supports debug level', async () => {
			const app = server({
				port: 3228,
				logging: {
					level: 'debug',
					pretty: false
				}
			});

			await app.start();
			expect(app.logger).not.toBe(null);
			await app.stop();
		});

		test('supports info level', async () => {
			const app = server({
				port: 3229,
				logging: {
					level: 'info',
					pretty: false
				}
			});

			await app.start();
			expect(app.logger).not.toBe(null);
			await app.stop();
		});

		test('supports warn level', async () => {
			const app = server({
				port: 3230,
				logging: {
					level: 'warn',
					pretty: true
				}
			});

			await app.start();
			expect(app.logger).not.toBe(null);
			await app.stop();
		});

		test('supports error level', async () => {
			const app = server({
				port: 3231,
				logging: {
					level: 'error',
					pretty: false
				}
			});

			await app.start();
			expect(app.logger).not.toBe(null);
			await app.stop();
		});
	});

	describe('Logger Integration - Pretty Mode', () => {
		test('enables pretty mode', async () => {
			const app = server({
				port: 3232,
				logging: {
					level: 'info',
					pretty: true
				}
			});

			await app.start();
			expect(app.logger).not.toBe(null);
			await app.stop();
		});

		test('disables pretty mode', async () => {
			const app = server({
				port: 3233,
				logging: {
					level: 'info',
					pretty: false
				}
			});

			await app.start();
			expect(app.logger).not.toBe(null);
			await app.stop();
		});
	});

	describe('Logger Integration - Boolean Config', () => {
		test('accepts boolean true for logging', async () => {
			const app = server({
				port: 3234,
				logging: true
			});

			await app.start();
			expect(app.logger).not.toBe(null);
			await app.stop();
		});

		test('accepts boolean false for logging', async () => {
			const app = server({
				port: 3235,
				logging: false
			});

			await app.start();
			expect(app.logger).toBe(null);
			await app.stop();
		});
	});

// ╚══════════════════════════════════════════════════════════════════════════════════════╝
