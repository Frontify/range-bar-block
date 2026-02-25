import { Color } from '@frontify/fondue';

export const pxStringToNumber = (string: string): number => {
    // eslint-disable-next-line prettier/prettier
    const stringdigit = string.replace(/\D/g,'');
    return +stringdigit;
};

export const divideStringByNumber = (string: string, number: number): number => {
    const stringNum: number = pxStringToNumber(string);
    return stringNum / number;
};

export const toRgbaString = (color: Color): string => {
    return `rgba(${color.red}, ${color.green}, ${color.blue}, ${color.alpha})`;
};

export const toPixels = (string: string): string => {
    if (!string.endsWith('px')) {
        return `${string}px`;
    } else {
        return string;
    }
};
