// test/on_ready.test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { describe, test, expect } from 'bun:test';
	import { server, type ServerInstance, table, integer, text, primaryKey, notNull } from '../src/main';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

	describe('onReady Hook', () => {
		let app: ServerInstance;
		test('onReady is called after server and databases are initialized', async () => {
			const readyCalls: unknown[] = [];

			app = server({
				port: 3258,
				logging: false,
				routes: [
					{
						method: 'GET',
						path: '/ready',
						handler: (c) => c.json({ ready: true })
					}
				],
				onReady: async (appInstance, dbMap) => {
					readyCalls.push({
						hasApp: !!appInstance,
						hasDb: dbMap.size > 0,
						timestamp: Date.now()
					});
				}
			});

			await app.start();
			expect(readyCalls.length).toBe(1);
			expect(readyCalls[0]).toMatchObject({
				hasApp: true,
				hasDb: false
			});
			await app.stop();
		});

		test('onReady receives database instances', async () => {
			const users = table('users', [
				primaryKey(integer('id'), true),
				notNull(text('name'))
			]);

			const readyData: unknown = {};

			app = server({
				port: 3259,
				logging: false,
				database: {
					connection: ':memory:',
					schema: { users }
				},
				routes: [],
				onReady: async (appInstance, dbMap) => {
					// eslint-disable-next-line @typescript-eslint/no-unused-expressions
					readyData as Record<string, unknown>;
					(readyData as Record<string, unknown>).hasDefaultDb = dbMap.has('default');
					(readyData as Record<string, unknown>).dbCount = dbMap.size;
					(readyData as Record<string, unknown>).isServerRunning = !!appInstance.bunServer;
				}
			});

			await app.start();
			expect(readyData).toMatchObject({
				hasDefaultDb: true,
				dbCount: 1,
				isServerRunning: true
			});
			await app.stop();
		});

		test('onReady can access server instance methods', async () => {
			const routeAdded: { added: boolean; routeName: string | null } = {
				added: false,
				routeName: null
			};

			app = server({
				port: 3260,
				logging: false,
				routes: [
					{
						method: 'GET',
						path: '/health',
						handler: (c) => c.json({ status: 'ok' })
					}
				],
				onReady: async (appInstance) => {
					appInstance.addRoute({
						method: 'GET',
						path: '/ready-added',
						handler: (c) => c.json({ addedByReady: true })
					});
					const routes = appInstance.getRoutes();
					const hasReadyRoute = routes.some((r) => r.path === '/ready-added');
					routeAdded.added = hasReadyRoute;
					routeAdded.routeName = hasReadyRoute ? '/ready-added' : null;
				}
			});

			await app.start();
			expect(routeAdded.added).toBe(true);
			expect(routeAdded.routeName).toBe('/ready-added');

			const response = await fetch('http://localhost:3260/ready-added');
			const data = await response.json();
			expect(data).toEqual({ addedByReady: true });

			await app.stop();
		});

		test('onReady is called after onStartup', async () => {
			const callOrder: string[] = [];

			app = server({
				port: 3261,
				logging: false,
				routes: [],
				onStartup: async () => {
					callOrder.push('startup');
					await new Promise(r => setTimeout(r, 10)); // Small delay
				},
				onReady: async () => {
					callOrder.push('ready');
				}
			});

			await app.start();
			expect(callOrder).toEqual(['startup', 'ready']);
			await app.stop();
		});

		test('onReady handles errors gracefully', async () => {
			const errorHandled: unknown = {};

			app = server({
				port: 3262,
				logging: false,
				routes: [],
				onReady: async () => {
					throw new Error('Test error in ready handler');
				}
			});

			try {
				await app.start();
				(errorHandled as Record<string, unknown>).started = true;
			} catch (e) {
				(errorHandled as Record<string, unknown>).started = false;
				(errorHandled as Record<string, unknown>).error = String(e);
			}

			// Should still start despite error
			expect((errorHandled as Record<string, unknown>).started).toBe(true);
			await app.stop();
		});

		test('onReady with multiple named databases', async () => {
			const users = table('users', [
				primaryKey(integer('id'), true),
				notNull(text('name'))
			]);

			const dbNames: string[] = [];

			app = server({
				port: 3263,
				logging: false,
				database: [
					{
						name: 'users_db',
						connection: ':memory:',
						schema: { users }
					},
					{
						name: 'logs_db',
						connection: ':memory:'
					}
				],
				routes: [],
				onReady: async (_, dbMap) => {
					dbMap.forEach((_, name) => {
						dbNames.push(name);
					});
				}
			});

			await app.start();
			expect(dbNames.sort()).toEqual(['logs_db', 'users_db']);
			await app.stop();
		});
	});

// ╚══════════════════════════════════════════════════════════════════════════════════════╝
