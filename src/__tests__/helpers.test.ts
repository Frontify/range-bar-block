import { describe, it, expect } from 'vitest';

import { IndicatorShape } from '../enums';
import { pxStringToNumber, dividePixelValue, toPixels, toRgbaString } from '../helpers';
import { toIndicatorSize, getIndicatorOffset, type SliderRow } from '../indicatorHelpers';

describe('pxStringToNumber', () => {
    it('converts an integer px string', () => {
        expect(pxStringToNumber('10px')).toBe(10);
    });

    it('converts a decimal px string', () => {
        expect(pxStringToNumber('2.5px')).toBe(2.5);
    });

    it('converts "0px"', () => {
        expect(pxStringToNumber('0px')).toBe(0);
    });

    it('converts a numeric string without px', () => {
        expect(pxStringToNumber('5')).toBe(5);
    });

    it('returns 0 for a non-numeric string', () => {
        expect(pxStringToNumber('abc')).toBe(0);
    });

    it('returns 0 for an empty string', () => {
        expect(pxStringToNumber('')).toBe(0);
    });
});

describe('dividePixelValue', () => {
    it('divides a px string by the divisor', () => {
        expect(dividePixelValue('10px', 2)).toBe(5);
    });

    it('returns a decimal when the result is not whole', () => {
        expect(dividePixelValue('5px', 2)).toBe(2.5);
    });

    it('returns 0 for "0px"', () => {
        expect(dividePixelValue('0px', 2)).toBe(0);
    });

    it('works with a value string that has no px suffix', () => {
        expect(dividePixelValue('8', 4)).toBe(2);
    });
});

describe('toPixels', () => {
    it('returns the string unchanged when it already ends with px', () => {
        expect(toPixels('10px')).toBe('10px');
    });

    it('appends px when the suffix is missing', () => {
        expect(toPixels('10')).toBe('10px');
    });

    it('is idempotent', () => {
        expect(toPixels(toPixels('5px'))).toBe('5px');
    });
});

describe('toRgbaString', () => {
    it('converts an RGBA object to a CSS rgba() string', () => {
        expect(toRgbaString({ red: 255, green: 0, blue: 128, alpha: 0.5 })).toBe('rgba(255, 0, 128, 0.5)');
    });
});

describe('toIndicatorSize', () => {
    it('returns circle dimensions with 50% radius', () => {
        expect(toIndicatorSize(IndicatorShape.Circle, '18px', 5)).toEqual({
            height: '18px',
            width: '18px',
            radius: '50%',
        });
    });

    it('returns square dimensions with 10% radius', () => {
        expect(toIndicatorSize(IndicatorShape.Square, '18px', 5)).toEqual({
            height: '18px',
            width: '18px',
            radius: '10%',
        });
    });

    it('returns bar dimensions using lineHeight as width when lineHeight <= 10', () => {
        expect(toIndicatorSize(IndicatorShape.Bar, '18px', 5)).toEqual({
            height: '18px',
            width: '5px',
            radius: '0%',
        });
    });

    it('caps bar width to 10px when lineHeight > 10', () => {
        expect(toIndicatorSize(IndicatorShape.Bar, '18px', 15)).toEqual({
            height: '18px',
            width: '10px',
            radius: '0%',
        });
    });
});

describe('getIndicatorOffset', () => {
    const fullRow: SliderRow = { id: '1', value: 50, left: 'min', right: 'max', label: '' };
    const emptyRow: SliderRow = { id: '1', value: 50, left: '', right: '', label: '' };

    describe('Bar indicator', () => {
        it('lineHeight <= 2, not editing → 1.2', () => {
            expect(getIndicatorOffset(IndicatorShape.Bar, false, fullRow, 2, 18)).toBe(1.2);
        });

        it('lineHeight <= 2, editing with both labels → 1.8', () => {
            expect(getIndicatorOffset(IndicatorShape.Bar, true, fullRow, 2, 18)).toBe(1.8);
        });

        it('lineHeight <= 2, editing with missing label → 1.6', () => {
            expect(getIndicatorOffset(IndicatorShape.Bar, true, emptyRow, 2, 18)).toBe(1.6);
        });

        it('lineHeight === 3 → 1.2', () => {
            expect(getIndicatorOffset(IndicatorShape.Bar, false, fullRow, 3, 18)).toBe(1.2);
        });

        it('lineHeight === 4 → 1', () => {
            expect(getIndicatorOffset(IndicatorShape.Bar, false, fullRow, 4, 18)).toBe(1);
        });

        it('lineHeight === 7 → 1', () => {
            expect(getIndicatorOffset(IndicatorShape.Bar, false, fullRow, 7, 18)).toBe(1);
        });

        it('lineHeight === 8 (above range) → 0', () => {
            expect(getIndicatorOffset(IndicatorShape.Bar, false, fullRow, 8, 18)).toBe(0);
        });
    });

    describe('Circle / Square indicator', () => {
        it('lineHeight <= 20 → 0', () => {
            expect(getIndicatorOffset(IndicatorShape.Circle, false, fullRow, 20, 18)).toBe(0);
        });

        it('lineHeight > 20, indicatorSize / lineHeight >= 2 → 0', () => {
            expect(getIndicatorOffset(IndicatorShape.Circle, false, fullRow, 21, 50)).toBe(0);
        });

        it('lineHeight > 20, indicatorSize / lineHeight < 2 → negative offset', () => {
            expect(getIndicatorOffset(IndicatorShape.Circle, false, fullRow, 21, 18)).toBe(-(18 / 10));
        });
    });
});
