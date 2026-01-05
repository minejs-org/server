/* eslint-disable @typescript-eslint/no-explicit-any */
// test/index.test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test';
    import { Logger } from '../src/mod/logger';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

	describe('Logger - Levels', () => {
		test('should handle debug level logging', () => {
			const logger = new Logger('debug', false);

			expect(() => logger.debug({ test: 1 }, 'debug message')).not.toThrow();
			expect(() => logger.info({ test: 1 }, 'info message')).not.toThrow();
			expect(() => logger.warn({ test: 1 }, 'warn message')).not.toThrow();
			expect(() => logger.error({ test: 1 }, 'error message')).not.toThrow();
		});

		test('should handle info level logging', () => {
			const logger = new Logger('info', false);

			expect(() => logger.debug({ test: 1 }, 'debug')).not.toThrow();
			expect(() => logger.info({ test: 1 }, 'info')).not.toThrow();
			expect(() => logger.warn({ test: 1 }, 'warn')).not.toThrow();
			expect(() => logger.error({ test: 1 }, 'error')).not.toThrow();
		});

		test('should handle warn level logging', () => {
			const logger = new Logger('warn', false);

			expect(() => logger.debug({ test: 1 }, 'debug')).not.toThrow();
			expect(() => logger.info({ test: 1 }, 'info')).not.toThrow();
			expect(() => logger.warn({ test: 1 }, 'warn')).not.toThrow();
			expect(() => logger.error({ test: 1 }, 'error')).not.toThrow();
		});

		test('should handle error level logging', () => {
			const logger = new Logger('error', false);

			expect(() => logger.debug({ test: 1 }, 'debug')).not.toThrow();
			expect(() => logger.info({ test: 1 }, 'info')).not.toThrow();
			expect(() => logger.warn({ test: 1 }, 'warn')).not.toThrow();
			expect(() => logger.error({ test: 1 }, 'error')).not.toThrow();
		});

		test('should handle fatal level logging', () => {
			const logger = new Logger('error', false);

			expect(() => logger.fatal({ test: 1 }, 'fatal error')).not.toThrow();
		});

		test('should handle fatal level logging in production', () => {
			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = 'production';

			const logger = new Logger('error', false);
			expect(() => logger.fatal({ test: 1 }, 'fatal in production')).not.toThrow();

			process.env.NODE_ENV = originalEnv;
		});
	});

	describe('Logger - Data Types', () => {
		test('should handle null data in logs', () => {
			const logger = new Logger('info', false);

			expect(() => logger.info(null, 'null data')).not.toThrow();
		});

		test('should handle undefined data in logs', () => {
			const logger = new Logger('info', false);

			expect(() => logger.info(undefined, 'undefined data')).not.toThrow();
		});

		test('should handle empty object data', () => {
			const logger = new Logger('info', false);

			expect(() => logger.info({}, 'empty object')).not.toThrow();
		});

		test('should handle complex object data', () => {
			const logger = new Logger('info', false);

			const complexData = {
				nested: {
					deep: {
						value: 123
					}
				},
				array: [1, 2, 3],
				string: 'test'
			};

			expect(() => logger.info(complexData, 'complex data')).not.toThrow();
		});

		test('should handle string as data parameter', () => {
			const logger = new Logger('info', false);

			expect(() => logger.info('This is a string message')).not.toThrow();
		});

		test('should handle string as data parameter in pretty mode', () => {
			const logger = new Logger('info', true);

			expect(() => logger.info('This is a pretty string message')).not.toThrow();
		});
	});

	describe('Logger - Pretty Mode', () => {
		test('should handle pretty mode', () => {
			const logger = new Logger('info', true);

			expect(() => logger.info({ test: 'data' }, 'pretty log')).not.toThrow();
		});

		test('should handle pretty mode with null message', () => {
			const logger = new Logger('info', true);

			expect(() => logger.info({ test: 'data' })).not.toThrow();
		});

		test('should handle pretty mode with request logs (morgan-style)', () => {
			const logger = new Logger('info', true);

			expect(() => logger.info({
				method: 'GET',
				path: '/api/users',
				status: 200,
				duration: 45
			})).not.toThrow();
		});

		test('should handle pretty mode with route registration', () => {
			const logger = new Logger('info', true);

			expect(() => logger.info({
				method: 'GET',
				path: '/api/users'
			}, 'Route added')).not.toThrow();
		});

		test('should handle pretty mode with multiple HTTP methods', () => {
			const logger = new Logger('info', true);

			expect(() => logger.info({
				method: ['GET', 'POST'],
				path: '/api/users'
			}, 'Route added')).not.toThrow();
		});

		test('should handle pretty mode with database connection', () => {
			const logger = new Logger('info', true);

			expect(() => logger.info({
				name: 'PostgreSQL'
			}, '✔ Database connected')).not.toThrow();
		});

		test('should handle pretty mode with server start', () => {
			const logger = new Logger('info', true);

			expect(() => logger.info({
				url: 'http://localhost:3000'
			}, 'Server started')).not.toThrow();
		});

		test('should handle pretty mode with different log levels', () => {
			const logger = new Logger('debug', true);

			expect(() => logger.debug({ test: 'debug' }, 'debug message')).not.toThrow();
			expect(() => logger.info({ test: 'info' }, 'info message')).not.toThrow();
			expect(() => logger.warn({ test: 'warn' }, 'warn message')).not.toThrow();
			expect(() => logger.error({ test: 'error' }, 'error message')).not.toThrow();
			expect(() => logger.fatal({ test: 'fatal' }, 'fatal message')).not.toThrow();
		});

		test('should handle pretty mode with complex data types', () => {
			const logger = new Logger('info', true);

			expect(() => logger.info({
				stringValue: 'test',
				numberValue: 42,
				booleanValue: true,
				objectValue: { nested: 'data' },
				arrayValue: [1, 2, 3]
			}, 'complex data')).not.toThrow();
		});

		test('should handle pretty mode with different HTTP methods', () => {
			const logger = new Logger('info', true);

			expect(() => logger.info({
				method: 'POST',
				path: '/api/users',
				status: 201,
				duration: 78
			})).not.toThrow();

			expect(() => logger.info({
				method: 'PUT',
				path: '/api/users/1',
				status: 200,
				duration: 56
			})).not.toThrow();

			expect(() => logger.info({
				method: 'DELETE',
				path: '/api/users/1',
				status: 204,
				duration: 23
			})).not.toThrow();

			expect(() => logger.info({
				method: 'PATCH',
				path: '/api/users/1',
				status: 200,
				duration: 34
			})).not.toThrow();

			expect(() => logger.info({
				method: 'OPTIONS',
				path: '/api/users',
				status: 200,
				duration: 12
			})).not.toThrow();
		});

		test('should handle pretty mode with different status codes', () => {
			const logger = new Logger('info', true);

			// 2xx Success
			expect(() => logger.info({
				method: 'GET',
				path: '/api/test',
				status: 200,
				duration: 10
			})).not.toThrow();

			// 3xx Redirect
			expect(() => logger.info({
				method: 'GET',
				path: '/api/test',
				status: 301,
				duration: 10
			})).not.toThrow();

			// 4xx Client Error
			expect(() => logger.info({
				method: 'GET',
				path: '/api/test',
				status: 404,
				duration: 10
			})).not.toThrow();

			// 5xx Server Error
			expect(() => logger.info({
				method: 'GET',
				path: '/api/test',
				status: 500,
				duration: 10
			})).not.toThrow();

			// Undefined status
			expect(() => logger.info({
				method: 'GET',
				path: '/api/test',
				status: undefined,
				duration: 10
			})).not.toThrow();
		});

		test('should handle pretty mode with no duration', () => {
			const logger = new Logger('info', true);

			expect(() => logger.info({
				method: 'GET',
				path: '/api/test',
				status: 200
			})).not.toThrow();
		});
	});

	describe('Logger - Default Values', () => {
		test('should use default log level', () => {
			const logger = new Logger();

			expect(() => logger.info({ test: 1 }, 'default level')).not.toThrow();
		});

		test('should handle invalid log level', () => {
			const logger = new Logger('invalid' as any, false);

			expect(() => logger.info({ test: 1 }, 'invalid level')).not.toThrow();
		});
	});

	describe('Logger - Console Methods', () => {
		let consoleLogSpy: any;
		let consoleWarnSpy: any;
		let consoleErrorSpy: any;

		beforeEach(() => {
			consoleLogSpy = spyOn(console, 'log');
			consoleWarnSpy = spyOn(console, 'warn');
			consoleErrorSpy = spyOn(console, 'error');
		});

		afterEach(() => {
			consoleLogSpy.mockRestore();
			consoleWarnSpy.mockRestore();
			consoleErrorSpy.mockRestore();
		});

		test('should use console.log for info and debug', () => {
			const logger = new Logger('debug', false);

			logger.debug({ test: 1 }, 'debug');
			expect(consoleLogSpy).toHaveBeenCalled();

			logger.info({ test: 1 }, 'info');
			expect(consoleLogSpy).toHaveBeenCalled();
		});

		test('should use console.warn for warn', () => {
			const logger = new Logger('warn', false);

			logger.warn({ test: 1 }, 'warn');
			expect(consoleWarnSpy).toHaveBeenCalled();
		});

		test('should use console.error for error and fatal', () => {
			const logger = new Logger('error', false);

			logger.error({ test: 1 }, 'error');
			expect(consoleErrorSpy).toHaveBeenCalled();

			logger.fatal({ test: 1 }, 'fatal');
			expect(consoleErrorSpy).toHaveBeenCalled();
		});
	});

	describe('Logger - Level Filtering', () => {
		let consoleWarnSpy: any;

		beforeEach(() => {
			consoleWarnSpy = spyOn(console, 'warn');
		});

		afterEach(() => {
			consoleWarnSpy.mockRestore();
		});

		test('should filter logs below set level', () => {
			const logger = new Logger('warn', false);

			logger.debug({ test: 1 }, 'should not log');
			logger.info({ test: 1 }, 'should not log');

			// These should not have triggered any console.warn calls yet
			expect(consoleWarnSpy.mock.calls.length).toBe(0);

			logger.warn({ test: 1 }, 'should log');

			// Now console.warn should have been called
			expect(consoleWarnSpy.mock.calls.length).toBe(1);
		});

		test('should respect log level hierarchy', () => {
			const logger = new Logger('error', false);
			const errorSpy = spyOn(console, 'error');

			logger.debug({ test: 1 }, 'should not log');
			logger.info({ test: 1 }, 'should not log');
			logger.warn({ test: 1 }, 'should not log');

			expect(errorSpy.mock.calls.length).toBe(0);

			logger.error({ test: 1 }, 'should log');

			expect(errorSpy.mock.calls.length).toBe(1);

			errorSpy.mockRestore();
		});
	});

	describe('Logger - Child Logger with Prefix', () => {
		test('should create child logger with prefix', () => {
			const logger = new Logger('info', false);
			const child = logger.child('API');

			expect(child).toBeInstanceOf(Logger);
			expect(() => child.info({ test: 1 }, 'child log')).not.toThrow();
		});

		test('should create nested child loggers', () => {
			const logger = new Logger('info', false);
			const child1 = logger.child('API');
			const child2 = child1.child('Users');

			expect(() => child2.info({ test: 1 }, 'nested child log')).not.toThrow();
		});

		test('should inherit log level from parent', () => {
			const logger = new Logger('warn', false);
			const child = logger.child('API');

			expect(() => child.warn({ test: 1 }, 'child warning')).not.toThrow();
		});

		test('should work with pretty mode', () => {
			const logger = new Logger('info', true);
			const child = logger.child('API');

			expect(() => child.info({ test: 1 }, 'pretty child log')).not.toThrow();
		});

		test('should handle child logger with no parent prefix', () => {
			const logger = new Logger('info', false);
			const child = logger.child('Service');

			expect(() => child.info({ userId: 123 }, 'service log')).not.toThrow();
		});

		test('should handle prefix with string data', () => {
			const logger = new Logger('info', false);
			const child = logger.child('Auth');

			expect(() => child.info('User logged in')).not.toThrow();
		});
	});

	describe('Logger - Edge Cases', () => {
		test('should handle empty prefix', () => {
			const logger = new Logger('info', false, '');

			expect(() => logger.info({ test: 1 }, 'no prefix')).not.toThrow();
		});

		test('should handle special characters in prefix', () => {
			const logger = new Logger('info', false, 'API/v2');

			expect(() => logger.info({ test: 1 }, 'special chars')).not.toThrow();
		});

		test('should handle very long prefixes', () => {
			const logger = new Logger('info', false, 'VeryLongServiceNameThatMightBeUnusualButPossible');

			expect(() => logger.info({ test: 1 }, 'long prefix')).not.toThrow();
		});
	});

// ╚══════════════════════════════════════════════════════════════════════════════════════╝