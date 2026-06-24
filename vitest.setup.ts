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

// jsdom does not implement `window.matchMedia` at all. `usePrefersReducedMotion`
// (and any future code reading other media queries) needs a default mock so
// it can run under tests. Defaults to `matches: true` (i.e. simulates a user
// who prefers reduced motion) so chart components default to
// `isAnimationActive={false}` under jsdom — jsdom has no rAF-driven paint
// loop, so an *animating* Recharts element (Bar/Pie/RadialBar/Line) never
// mounts its final shape/path synchronously, which would make every chart
// test that asserts on rendered bars/sectors/sectors flaky-by-default.
// Tests that specifically want to exercise the "no reduced-motion
// preference" (animation on) branch mock `usePrefersReducedMotion` directly
// instead of overriding this global.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: (query: string) => ({
    matches: true,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});