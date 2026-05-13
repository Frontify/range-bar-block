export type RgbaColor = { red: number; green: number; blue: number; alpha: number };

export const pxStringToNumber = (value: string): number => {
    const result = parseFloat(value);
    return isNaN(result) ? 0 : result;
};

export const dividePixelValue = (value: string, divisor: number): number => {
    return pxStringToNumber(value) / divisor;
};

export const toRgbaString = (color: RgbaColor): string => {
    return `rgba(${color.red}, ${color.green}, ${color.blue}, ${color.alpha})`;
};

export const toPixels = (value: string): string => (value.endsWith('px') ? value : `${value}px`);
