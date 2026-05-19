import { IndicatorShape } from './enums';
import { toPixels } from './helpers';

export type SliderRow = {
    id: string;
    value: number;
    left: string;
    right: string;
    label: string;
};

export type IndicatorSize = {
    width: string;
    height: string;
    radius: string;
};

export const toIndicatorSize = (indicatorStyle: IndicatorShape, size: string, lineHeight: number): IndicatorSize => {
    if (indicatorStyle === IndicatorShape.Circle) return { height: size, width: size, radius: '50%' };
    if (indicatorStyle === IndicatorShape.Square) return { height: size, width: size, radius: '10%' };
    return { height: size, width: lineHeight <= 10 ? toPixels(lineHeight.toString()) : '10px', radius: '0%' };
};

export const getIndicatorOffset = (
    indicatorStyle: IndicatorShape,
    isEditing: boolean,
    row: SliderRow,
    lineHeight: number,
    indicatorSize: number,
): number => {
    if (indicatorStyle !== IndicatorShape.Bar) {
        if (lineHeight > 20 && indicatorSize / lineHeight < 2) {
            return -(indicatorSize / 10);
        }
        return 0;
    }
    // Bar shape
    if (lineHeight <= 2) {
        if (!isEditing) return 1.2;
        return !row.left || !row.right ? 1.6 : 1.8;
    }
    if (lineHeight === 3) return 1.2;
    if (lineHeight >= 4 && lineHeight < 8) return 1;
    return 0;
};
