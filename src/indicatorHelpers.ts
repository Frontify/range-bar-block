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
    if (indicatorStyle === IndicatorShape.Circle) {
        return { height: size, width: size, radius: '50%' };
    } else if (indicatorStyle === IndicatorShape.Square) {
        return { height: size, width: size, radius: '10%' };
    } else {
        return { height: size, width: lineHeight <= 10 ? toPixels(lineHeight.toString()) : '10px', radius: '0%' };
    }
};

export const getIndicatorOffset = (
    indicatorStyle: IndicatorShape,
    isEditing: boolean,
    row: SliderRow,
    lineHeight: number,
    indicatorSize: number,
): number => {
    if (indicatorStyle === IndicatorShape.Bar) {
        if (lineHeight <= 2) {
            if (isEditing) {
                if (!row.left || !row.right) {
                    return 1.6;
                }
                return 1.8;
            }
            return 1.2;
        } else if (lineHeight === 3) {
            return 1.2;
        } else if (lineHeight >= 4 && lineHeight < 8) {
            return 1;
        }
    } else {
        if (lineHeight > 20) {
            if (indicatorSize / lineHeight < 2) {
                return -(indicatorSize / 10);
            }
        }
    }
    return 0;
};
