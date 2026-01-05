// src/mod/router.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import type { AppContext } from '../types.d';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export type RouteHandler        = (ctx: AppContext) => Response | Promise<Response>;
    export type RegexRoutes         = RegexRoute[];

    export interface RegexRoute {
        pattern                     : RegExp;
        method                      : string;
        handler                     : RouteHandler;
        key                         : string;
        metadata?                   : unknown;
    }

    export interface RouteMatch {
        handler                     : RouteHandler;
        params                      : Record<string, string>;
        metadata?                   : unknown;
    }

    export interface RouteInfo {
        method                      : string;
        path                        : string;
        handler                     : RouteHandler;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class Router {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            private routes = new Map<string, { handler: RouteHandler; metadata?: unknown }>();
            private regexRoutes: RegexRoutes = [];

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── MAIN ──────────────────────────────┐

            match(method: string, path: string): RouteMatch | null {
                const key = `${method}:${path}`;

                // Try static route first (faster)
                if (this.routes.has(key)) {
                    const route = this.routes.get(key)!;
                    return {
                        handler: route.handler,
                        params: {},
                        metadata: route.metadata
                    };
                }

                // Try dynamic routes
                for (const route of this.regexRoutes) {
                    if (route.method === method) {
                        const match = path.match(route.pattern);
                        if (match) {
                            // Extract named groups if they exist
                            const params = match.groups || {};
                            return {
                                handler: route.handler,
                                params,
                                metadata: route.metadata
                            };
                        }
                    }
                }

                return null;
            }

            getAll(): RouteInfo[] {
                const staticRoutes = Array.from(this.routes.entries()).map(([key, route]) => {
                    const colonIndex = key.indexOf(':');
                    const method = key.substring(0, colonIndex);
                    const path = key.substring(colonIndex + 1);
                    return { method, path, handler: route.handler };
                });

                const dynamicRoutes = this.regexRoutes.map(route => {
                    const colonIndex = route.key.indexOf(':');
                    return {
                        method: route.method,
                        path: route.key.substring(colonIndex + 1),
                        handler: route.handler
                    };
                });

                return [...staticRoutes, ...dynamicRoutes];
            }

            clear(): void {
                this.routes.clear();
                this.regexRoutes = [];
            }

            remove(method: string, path: string): boolean {
                const key = `${method}:${path}`;

                if (this.routes.has(key)) {
                    this.routes.delete(key);
                    return true;
                }

                const index = this.regexRoutes.findIndex(r => r.key === key);
                if (index >= 0) {
                    this.regexRoutes.splice(index, 1);
                    return true;
                }

                return false;
            }

            register(method: string, path: string, handler: RouteHandler, metadata: unknown = {}): void {
                const key = `${method}:${path}`;

                // Check if path needs regex (has :params or wildcards)
                if (path.includes(':') || path.includes('*')) {
                    // Dynamic route with params or wildcards
                    const pattern = this.pathToRegex(path);

                    // Check if route already exists to prevent duplicates
                    const existingIndex = this.regexRoutes.findIndex(r => r.key === key);

                    const route: RegexRoute = {
                        pattern,
                        method,
                        handler,
                        key,
                        metadata
                    };

                    if (existingIndex >= 0) {
                        // Update existing route
                        this.regexRoutes[existingIndex] = route;
                    } else {
                        // Add new route
                        this.regexRoutes.push(route);
                    }
                } else {
                    // Static route
                    this.routes.set(key, { handler, metadata });
                }
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── HELP ──────────────────────────────┐

            private pathToRegex(path: string): RegExp {
                // Escape special regex characters except ':' and '*'
                let pattern = path.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

                // Replace :param with named capture groups
                pattern = pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)');

                // Replace * with wildcard pattern (matches everything including slashes)
                pattern = pattern.replace(/\*/g, '.*');

                return new RegExp(`^${pattern}$`);
            }

        // └────────────────────────────────────────────────────────────────────┘

    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝