// test/database_int.test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
	import { server, type ServerInstance, type AppContext, table, integer, text, primaryKey, notNull } from '../src/main';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

	describe('Database Integration - Single Database', () => {
		let app: ServerInstance;
		const baseUrl = 'http://localhost:3218';

		beforeAll(async () => {
			app = server({
				port: 3218,
				logging: false,
				database: {
					connection: ':memory:'
				},
				routes: [
					{
						method: 'GET',
						path: '/has-db',
						handler: (c: AppContext) => {
							return c.json({
								hasDb: !!c.db,
								dbType: typeof c.db
							});
						}
					}
				]
			});

			await app.start();
		});

		afterAll(async () => {
			await app.stop();
		});

		test('provides db instance in context', async () => {
			const res = await fetch(`${baseUrl}/has-db`);
			const data = await res.json();
			
			expect(data.hasDb).toBe(true);
			expect(data.dbType).toBe('object');
		});

		test('readiness check shows database connected', async () => {
			const res = await fetch(`${baseUrl}/readiness`);
			const data = await res.json();
			
			expect(res.status).toBe(200);
			expect(data.checks.database).toBe('connected');
		});
	});

	describe('Database Integration - Multiple Databases', () => {
		let app: ServerInstance;
		const baseUrl = 'http://localhost:3219';

		beforeAll(async () => {
			app = server({
				port: 3219,
				logging: false,
				database: [
					{
						name: 'default',
						connection: ':memory:'
					},
					{
						name: 'analytics',
						connection: ':memory:'
					}
				],
				routes: [
					{
						method: 'GET',
						path: '/db-count',
						handler: (c: AppContext) => {
							return c.json({
								hasDb: !!c.db,
								dbCount: app.db.size
							});
						}
					}
				]
			});

			await app.start();
		});

		afterAll(async () => {
			await app.stop();
		});

		test('supports multiple database connections', async () => {
			const res = await fetch(`${baseUrl}/db-count`);
			const data = await res.json();
			
			expect(data.hasDb).toBe(true);
			expect(data.dbCount).toBe(2);
		});
	});

	describe('Database Integration - With Schema', () => {
		let app: ServerInstance;
		const baseUrl = 'http://localhost:3220';

		beforeAll(async () => {
			const users = table('users', [
				primaryKey(integer('id'), true),
				notNull(text('name')),
				notNull(text('email'))
			]);

			app = server({
				port: 3220,
				logging: false,
				database: {
					connection: ':memory:',
					schema: { users }
				},
				routes: [
					{
						method: 'POST',
						path: '/users',
						handler: (c: AppContext) => {
							const user = c.db!.insert('users', c.body);
							return c.json(user);
						}
					},
					{
						method: 'GET',
						path: '/users',
						handler: (c: AppContext) => {
							const users = c.db!.all('users');
							return c.json(users);
						}
					}
				]
			});

			await app.start();
		});

		afterAll(async () => {
			await app.stop();
		});

		test('routes can access db with schema', async () => {
			// Insert
			const insertRes = await fetch(`${baseUrl}/users`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'Test User',
					email: 'test@example.com'
				})
			});
			const insertData = await insertRes.json();
			
			expect(insertRes.status).toBe(200);
			expect(insertData.name).toBe('Test User');
			expect(insertData.email).toBe('test@example.com');

			// Get all
			const getRes = await fetch(`${baseUrl}/users`);
			const getData = await getRes.json();
			
			expect(Array.isArray(getData)).toBe(true);
			expect(getData.length).toBeGreaterThan(0);
		});
	});

	describe('Database Integration - File-based Connection', () => {
		test('handles file-based database', async () => {
			const app = server({
				port: 3221,
				logging: false,
				database: {
					connection: './test-db.sqlite'
				}
			});

			await app.start();
			expect(app.db.size).toBe(1);
			await app.stop();

			// Cleanup
			try {
				await Bun.write('./test-db.sqlite', '');
			} catch {
				// Ignore cleanup errors
			}
		});
	});

	describe('Database Integration - No Database', () => {
		let app: ServerInstance;
		const baseUrl = 'http://localhost:3222';

		beforeAll(async () => {
			app = server({
				port: 3222,
				logging: false,
				routes: [
					{
						method: 'GET',
						path: '/test',
						handler: (c: AppContext) => c.json({ ok: true })
					}
				]
			});

			await app.start();
		});

		afterAll(async () => {
			await app.stop();
		});

		test('readiness shows not configured when no database', async () => {
			const res = await fetch(`${baseUrl}/readiness`);
			const data = await res.json();
			
			expect(res.status).toBe(200);
			expect(data.checks.database).toBe('not configured');
		});
	});

	describe('Database Integration - Context Usage', () => {
		let app: ServerInstance;
		const baseUrl = 'http://localhost:3223';

		beforeAll(async () => {
			const products = table('products', [
				primaryKey(integer('id'), true),
				notNull(text('name')),
				integer('price')
			]);

			app = server({
				port: 3223,
				logging: false,
				database: {
					connection: ':memory:',
					schema: { products }
				},
				routes: [
					{
						method: 'POST',
						path: '/products',
						handler: (c: AppContext) => {
							const product = c.db!.insert('products', c.body);
							return c.json(product);
						}
					},
					{
						method: 'GET',
						path: '/products/:id',
						handler: (c: AppContext) => {
							const product = c.db!.findById('products', parseInt(c.params.id));
							if (!product) return c.status(404).json({ error: 'Not found' });
							return c.json(product);
						}
					},
					{
						method: 'PUT',
						path: '/products/:id',
						handler: (c: AppContext) => {
							const product = c.db!.update('products', parseInt(c.params.id), c.body);
							if (!product) return c.status(404).json({ error: 'Not found' });
							return c.json(product);
						}
					},
					{
						method: 'DELETE',
						path: '/products/:id',
						handler: (c: AppContext) => {
							c.db!.delete('products', parseInt(c.params.id));
							return c.json({ deleted: true });
						}
					}
				]
			});

			await app.start();
		});

		afterAll(async () => {
			await app.stop();
		});

		test('routes can perform CRUD via context.db', async () => {
			// Create
			const createRes = await fetch(`${baseUrl}/products`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: 'Laptop', price: 1500 })
			});
			const created = await createRes.json();
			expect(created.id).toBeDefined();

			// Read
			const readRes = await fetch(`${baseUrl}/products/${created.id}`);
			const product = await readRes.json();
			expect(product.name).toBe('Laptop');

			// Update
			const updateRes = await fetch(`${baseUrl}/products/${created.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: 'Gaming Laptop', price: 2000 })
			});
			const updated = await updateRes.json();
			expect(updated.name).toBe('Gaming Laptop');

			// Delete
			const deleteRes = await fetch(`${baseUrl}/products/${created.id}`, {
				method: 'DELETE'
			});
			const deleteData = await deleteRes.json();
			expect(deleteData.deleted).toBe(true);

			// Verify deleted
			const verifyRes = await fetch(`${baseUrl}/products/${created.id}`);
			expect(verifyRes.status).toBe(404);
		});
	});

// ╚══════════════════════════════════════════════════════════════════════════════════════╝
