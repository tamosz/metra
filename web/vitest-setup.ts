// Node 22+ ships a built-in localStorage that lacks full Storage API (no removeItem, etc.).
// Vitest's jsdom environment doesn't override globals already present on globalThis,
// so the broken Node localStorage leaks through. Fix by grabbing jsdom's implementation
// from the jsdom instance that vitest attaches to globalThis.
const dom = (globalThis as any).jsdom;
if (dom) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: dom.window.localStorage,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: dom.window.sessionStorage,
    writable: true,
    configurable: true,
  });
}
