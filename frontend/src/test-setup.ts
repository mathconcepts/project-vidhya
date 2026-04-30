import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  // Clear localStorage between tests so dismiss state doesn't leak.
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.clear();
  }
});
