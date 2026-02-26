export type RgbaColor = { red: number; green: number; blue: number; alpha: number };

export const pxStringToNumber = (string: string): number => {
    const stringdigit = string.replaceAll(/\D/g, '');
    return +stringdigit;
};

export const divideStringByNumber = (string: string, number: number): number => {
    const stringNum: number = pxStringToNumber(string);
    return stringNum / number;
};

export const toRgbaString = (color: RgbaColor): string => {
    return `rgba(${color.red}, ${color.green}, ${color.blue}, ${color.alpha})`;
};

export const toPixels = (string: string): string => {
    if (!string.endsWith('px')) {
        return `${string}px`;
    } else {
        return string;
    }
};
