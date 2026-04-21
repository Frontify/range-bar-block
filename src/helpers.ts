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

export const toPixels = (string: string): string => {
    if (!string.endsWith('px')) {
        return `${string}px`;
    }
    return string;
};
