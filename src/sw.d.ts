/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

declare module 'workbox-precaching' {
  export function precacheAndRoute(entries: Array<string | { url: string; revision?: string | null }>): void;
}

declare module 'workbox-core' {
  export function skipWaiting(): void;
  export function clientsClaim(): void;
}

declare module 'workbox-strategies' {
  export class CacheFirst {
    constructor(options?: { cacheName?: string });
  }
}

declare module 'workbox-routing' {
  export function registerRoute(
    matcher: (options: { request: Request }) => boolean,
    handler: any
  ): void;
}

// Workbox manifest injection
declare const __WB_MANIFEST: Array<string | { url: string; revision?: string | null }>;
