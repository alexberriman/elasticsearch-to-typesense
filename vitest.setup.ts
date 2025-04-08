import { afterEach, beforeEach, vi } from 'vitest';

// Make common testing functions available globally
globalThis.beforeEach = beforeEach;
globalThis.afterEach = afterEach;
globalThis.vi = vi;