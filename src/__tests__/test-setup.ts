import '@testing-library/jest-dom';

// jsdom does not implement ResizeObserver — provide a no-op stub
window.ResizeObserver = class implements ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
};
