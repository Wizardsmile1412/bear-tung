import '@testing-library/jest-dom/vitest';

// jsdom has no layout engine, so `getBoundingClientRect` always returns 0x0
// and there is no real `ResizeObserver`. Recharts' `ResponsiveContainer`
// relies on both to measure its container — without this polyfill every
// chart renders at 0x0 and none of its children (axes, bars, slices) mount,
// which makes chart tests unable to assert on rendered content.
class MockResizeObserver implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver = MockResizeObserver;

Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
  configurable: true,
  value: () => ({
    width: 600,
    height: 300,
    top: 0,
    left: 0,
    bottom: 300,
    right: 600,
    x: 0,
    y: 0,
    toJSON() {
      return this;
    },
  }),
});