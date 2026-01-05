// src/mod/static.ts
//
// Static file serving module with security and performance features
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { join, extname, resolve, relative } from 'path';
    import { existsSync, statSync } from 'fs';
    import type { AppContext } from '../types';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export interface StaticConfig {
        path            : string;        // URL path prefix (e.g., '/public' or '/static')
        directory       : string;        // Local directory to serve from
        maxAge?         : number;        // Cache control in seconds (default: 3600)
        index?          : string[];      // Index files (default: ['index.html'])
        dotfiles?       : 'allow' | 'deny' | 'ignore';  // How to handle dotfiles (default: 'deny')
        etag?           : boolean;       // Enable ETag headers (default: true)
        lastModified?   : boolean;       // Enable Last-Modified headers (default: true)
        immutable?      : boolean;       // Add immutable to cache-control (default: false)
        extensions?     : string[];      // Try these extensions if file not found (e.g., ['html', 'htm'])
        fallthrough?    : boolean;       // Continue to next handler if file not found (default: false)
        setHeaders?     : (ctx: AppContext, path: string) => void;  // Custom header setter
    }

    interface CacheEntry {
        etag            : string;
        lastModified    : Date;
        size            : number;
        mtime           : number;
    }

    interface FileStats {
        size: number;
        mtime: Date;
        mtimeMs: number;
        isDirectory(): boolean;
        isFile(): boolean;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class StaticFileServer {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            private config          : Required<Omit<StaticConfig, 'setHeaders'>> & Pick<StaticConfig, 'setHeaders'>;
            private resolvedDir     : string;
            private fileCache       = new Map<string, CacheEntry>();
            private readonly CACHE_MAX_SIZE = 1000;

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── CONS ──────────────────────────────┐

            constructor(config: StaticConfig) {
                // Validate directory exists
                if (!existsSync(config.directory)) {
                    throw new Error(`Static directory does not exist: ${config.directory}`);
                }

                const stats = statSync(config.directory);
                if (!stats.isDirectory()) {
                    throw new Error(`Static path is not a directory: ${config.directory}`);
                }

                // Resolve absolute path to prevent directory traversal
                this.resolvedDir = resolve(config.directory);

                // Set defaults
                this.config = {
                    path            : config.path,
                    directory       : config.directory,
                    maxAge          : config.maxAge ?? 3600,
                    index           : config.index ?? ['index.html'],
                    dotfiles        : config.dotfiles ?? 'deny',
                    etag            : config.etag ?? true,
                    lastModified    : config.lastModified ?? true,
                    immutable       : config.immutable ?? false,
                    extensions      : config.extensions ?? [],
                    fallthrough     : config.fallthrough ?? false,
                    setHeaders      : config.setHeaders
                };
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── MAIN ──────────────────────────────┐

            /**
             * Create request handler for static files
             */
            handler(): (ctx: AppContext) => Promise<Response> {
                return async (ctx: AppContext): Promise<Response> => {
                    const requestPath = ctx.request.url;
                    const url = new URL(requestPath);
                    let pathname = url.pathname;

                    // Remove prefix from pathname
                    if (pathname.startsWith(this.config.path)) {
                        pathname = pathname.slice(this.config.path.length);
                    }

                    // Decode URI component
                    try {
                        pathname = decodeURIComponent(pathname);
                    } catch {
                        return ctx.json({ error: 'Invalid URL encoding' }, 400);
                    }

                    // Security: Prevent directory traversal
                    if (pathname.includes('..') || pathname.includes('\\')) {
                        return ctx.json({ error: 'Forbidden' }, 403);
                    }

                    // Handle dotfiles
                    if (this.config.dotfiles !== 'allow' && pathname.split('/').some(p => p.startsWith('.'))) {
                        if (this.config.dotfiles === 'deny') {
                            return ctx.json({ error: 'Forbidden' }, 403);
                        }
                        // 'ignore' - treat as not found
                        return this.handleNotFound(ctx);
                    }

                    // Resolve file path
                    const filePath = this.resolveFilePath(pathname);
                    if (!filePath) {
                        return this.handleNotFound(ctx);
                    }

                    // Check if file exists and is within allowed directory
                    if (!this.isPathSafe(filePath)) {
                        return ctx.json({ error: 'Forbidden' }, 403);
                    }

                    if (!existsSync(filePath)) {
                        return this.handleNotFound(ctx);
                    }

                    const stats = statSync(filePath) as FileStats;

                    // If directory, try to serve index file
                    if (stats.isDirectory()) {
                        return this.serveDirectory(ctx, filePath, pathname);
                    }

                    // Serve file
                    return this.serveFile(ctx, filePath, stats);
                };
            }

            /**
             * Get URL path pattern for router
             */
            getPathPattern(): string {
                // Match the prefix and anything after it
                return `${this.config.path}/*`;
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── HELP ──────────────────────────────┐

            private resolveFilePath(pathname: string): string | null {
                // Remove leading slash
                if (pathname.startsWith('/')) {
                    pathname = pathname.slice(1);
                }

                const filePath = join(this.resolvedDir, pathname);

                // Try with extensions if file doesn't exist
                if (!existsSync(filePath) && this.config.extensions.length > 0) {
                    for (const ext of this.config.extensions) {
                        const withExt = `${filePath}.${ext}`;
                        if (existsSync(withExt)) {
                            return withExt;
                        }
                    }
                }

                return filePath;
            }

            private isPathSafe(filePath: string): boolean {
                // Ensure the resolved path is within the static directory
                const rel = relative(this.resolvedDir, resolve(filePath));
                return !rel.startsWith('..') && !resolve(filePath).startsWith('..');
            }

            private async serveDirectory(ctx: AppContext, dirPath: string, _: string): Promise<Response> {
                // Try index files
                for (const indexFile of this.config.index) {
                    const indexPath = join(dirPath, indexFile);
                    if (existsSync(indexPath)) {
                        const stats = statSync(indexPath) as FileStats;
                        if (stats.isFile()) {
                            return this.serveFile(ctx, indexPath, stats);
                        }
                    }
                }

                // No index file found
                return this.handleNotFound(ctx);
            }

            private async serveFile(ctx: AppContext, filePath: string, stats: FileStats): Promise<Response> {
                const method = ctx.request.method.toUpperCase();

                // Only allow GET and HEAD
                if (method !== 'GET' && method !== 'HEAD') {
                    return ctx.json({ error: 'Method not allowed' }, 405);
                }

                // Get or create cache entry
                const cacheKey = filePath;
                let cacheEntry = this.fileCache.get(cacheKey);

                // Check if cache is stale
                if (cacheEntry && cacheEntry.mtime !== stats.mtimeMs) {
                    cacheEntry = undefined;
                }

                if (!cacheEntry) {
                    cacheEntry = {
                        etag            : this.generateEtag(stats),
                        lastModified    : new Date(stats.mtime),
                        size            : stats.size,
                        mtime           : stats.mtimeMs
                    };

                    // Add to cache with size limit
                    if (this.fileCache.size >= this.CACHE_MAX_SIZE) {
                        const firstKey = this.fileCache.keys().next().value;
                        if (firstKey) this.fileCache.delete(firstKey);
                    }
                    this.fileCache.set(cacheKey, cacheEntry);
                }

                // Check conditional requests
                const ifNoneMatch = ctx.request.headers.get('if-none-match');
                const ifModifiedSince = ctx.request.headers.get('if-modified-since');

                if (this.config.etag && ifNoneMatch === cacheEntry.etag) {
                    return new Response(null, {
                        status: 304,
                        headers: this.buildHeaders(filePath, cacheEntry)
                    });
                }

                if (this.config.lastModified && ifModifiedSince) {
                    const ifModDate = new Date(ifModifiedSince);
                    if (cacheEntry.lastModified <= ifModDate) {
                        return new Response(null, {
                            status: 304,
                            headers: this.buildHeaders(filePath, cacheEntry)
                        });
                    }
                }

                // Read file using Bun.file
                const file = Bun.file(filePath);
                const headers = this.buildHeaders(filePath, cacheEntry);

                // Set custom headers if provided
                if (this.config.setHeaders) {
                    this.config.setHeaders(ctx, filePath);
                }

                // Return 200 with file content (or just headers for HEAD)
                if (method === 'HEAD') {
                    return new Response(null, {
                        status: 200,
                        headers
                    });
                }

                return new Response(file, {
                    status: 200,
                    headers
                });
            }

            private buildHeaders(filePath: string, cache: CacheEntry): Headers {
                const headers = new Headers();

                // Content-Type
                const mimeType = this.getMimeType(filePath);
                headers.set('Content-Type', mimeType);

                // Content-Length
                headers.set('Content-Length', cache.size.toString());

                // ETag
                if (this.config.etag) {
                    headers.set('ETag', cache.etag);
                }

                // Last-Modified
                if (this.config.lastModified) {
                    headers.set('Last-Modified', cache.lastModified.toUTCString());
                }

                // Cache-Control
                if (this.config.maxAge > 0) {
                    let cacheControl = `public, max-age=${this.config.maxAge}`;
                    if (this.config.immutable) {
                        cacheControl += ', immutable';
                    }
                    headers.set('Cache-Control', cacheControl);
                } else {
                    headers.set('Cache-Control', 'no-cache');
                }

                // Accept-Ranges for partial content support
                headers.set('Accept-Ranges', 'bytes');

                return headers;
            }

            private generateEtag(stats: FileStats): string {
                // Simple ETag: size-mtime
                return `"${stats.size.toString(16)}-${stats.mtimeMs.toString(16)}"`;
            }

            private getMimeType(filePath: string): string {
                const ext = extname(filePath).toLowerCase();
                return MIME_TYPES[ext] || 'application/octet-stream';
            }

            private handleNotFound(ctx: AppContext): Response {
                if (this.config.fallthrough) {
                    // Let the next handler deal with it
                    return ctx.json({ error: 'Not Found' }, 404);
                }
                return ctx.json({ error: 'Not Found' }, 404);
            }

            /**
             * Clear file cache
             */
            clearCache(): void {
                this.fileCache.clear();
            }

            /**
             * Get cache statistics
             */
            getCacheStats(): { entries: number; maxSize: number } {
                return {
                    entries: this.fileCache.size,
                    maxSize: this.CACHE_MAX_SIZE
                };
            }

        // └────────────────────────────────────────────────────────────────────┘

    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ UTIL ════════════════════════════════════════╗

    /**
     * Helper function to create static file server
     */
    export function createStatic(config: StaticConfig): StaticFileServer {
        return new StaticFileServer(config);
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ DATA ════════════════════════════════════════╗

    /**
     * Comprehensive MIME type mapping
     */
    const MIME_TYPES: Record<string, string> = {
        // Text
        '.html'         : 'text/html; charset=utf-8',
        '.htm'          : 'text/html; charset=utf-8',
        '.css'          : 'text/css; charset=utf-8',
        '.txt'          : 'text/plain; charset=utf-8',
        '.xml'          : 'text/xml; charset=utf-8',
        '.csv'          : 'text/csv; charset=utf-8',
        '.md'           : 'text/markdown; charset=utf-8',

        // JavaScript
        '.js'           : 'application/javascript; charset=utf-8',
        '.mjs'          : 'application/javascript; charset=utf-8',
        '.json'         : 'application/json; charset=utf-8',
        '.jsonld'       : 'application/ld+json',
        '.map'          : 'application/json; charset=utf-8',

        // Images
        '.png'          : 'image/png',
        '.jpg'          : 'image/jpeg',
        '.jpeg'         : 'image/jpeg',
        '.gif'          : 'image/gif',
        '.svg'          : 'image/svg+xml',
        '.ico'          : 'image/x-icon',
        '.webp'         : 'image/webp',
        '.avif'         : 'image/avif',
        '.bmp'          : 'image/bmp',
        '.tiff'         : 'image/tiff',

        // Fonts
        '.woff'         : 'font/woff',
        '.woff2'        : 'font/woff2',
        '.ttf'          : 'font/ttf',
        '.otf'          : 'font/otf',
        '.eot'          : 'application/vnd.ms-fontobject',

        // Audio
        '.mp3'          : 'audio/mpeg',
        '.wav'          : 'audio/wav',
        '.ogg'          : 'audio/ogg',
        '.m4a'          : 'audio/mp4',
        '.aac'          : 'audio/aac',
        '.flac'         : 'audio/flac',

        // Video
        '.mp4'          : 'video/mp4',
        '.webm'         : 'video/webm',
        '.ogv'          : 'video/ogg',
        '.mov'          : 'video/quicktime',
        '.avi'          : 'video/x-msvideo',
        '.mkv'          : 'video/x-matroska',

        // Documents
        '.pdf'          : 'application/pdf',
        '.doc'          : 'application/msword',
        '.docx'         : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls'          : 'application/vnd.ms-excel',
        '.xlsx'         : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.ppt'          : 'application/vnd.ms-powerpoint',
        '.pptx'         : 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

        // Archives
        '.zip'          : 'application/zip',
        '.rar'          : 'application/x-rar-compressed',
        '.7z'           : 'application/x-7z-compressed',
        '.tar'          : 'application/x-tar',
        '.gz'           : 'application/gzip',

        // Other
        '.wasm'         : 'application/wasm',
        '.manifest'     : 'text/cache-manifest',
        '.webmanifest'  : 'application/manifest+json',
    };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝