import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { randomUUID } from 'crypto';

// Polyfill crypto.randomUUID for Jest test environment
if (!global.crypto) {
  global.crypto = {} as Crypto;
}
if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = () => randomUUID();
}

// Polyfill structuredClone for Jest test environment
if (!global.structuredClone) {
  global.structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
}
