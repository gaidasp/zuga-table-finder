import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock SvelteKit modules
vi.mock('$app/environment', () => ({
  browser: false,
  dev: true,
  building: false,
  version: 'test'
}));

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  invalidate: vi.fn(),
  invalidateAll: vi.fn(),
  preloadData: vi.fn(),
  preloadCode: vi.fn(),
  beforeNavigate: vi.fn(),
  afterNavigate: vi.fn()
}));

vi.mock('$app/stores', () => {
  const getStores = () => {
    const navigating = { subscribe: vi.fn() };
    const page = { subscribe: vi.fn() };
    const updated = { subscribe: vi.fn(), check: vi.fn() };

    return { navigating, page, updated };
  };

  return {
    getStores,
    navigating: { subscribe: vi.fn() },
    page: { subscribe: vi.fn() },
    updated: { subscribe: vi.fn(), check: vi.fn() }
  };
});
