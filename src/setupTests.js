// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfills for Node.js APIs needed by Firebase and modern libraries
import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream, TransformStream } from 'stream/web';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.ReadableStream = ReadableStream;
global.TransformStream = TransformStream;

// Mock Headers, Request, Response for undici/Firebase
global.Headers = class Headers {
  constructor(init) {
    this.map = new Map();
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.map.set(key.toLowerCase(), value);
      });
    }
  }
  get(name) { return this.map.get(name.toLowerCase()); }
  set(name, value) { this.map.set(name.toLowerCase(), value); }
  has(name) { return this.map.has(name.toLowerCase()); }
  delete(name) { this.map.delete(name.toLowerCase()); }
  forEach(callback) { this.map.forEach(callback); }
  entries() { return this.map.entries(); }
  keys() { return this.map.keys(); }
  values() { return this.map.values(); }
};

// Mock window.matchMedia (used by some UI libraries)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
