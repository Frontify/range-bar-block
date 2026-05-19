import { type Bundle, defineSettings } from '@frontify/guideline-blocks-settings';

import { IndicatorShape, LineShape } from './enums';
import { pxStringToNumber } from './helpers';

export { IndicatorShape, LineShape };

export const DEFAULT_LINE_STYLE = LineShape.Round;
export const DEFAULT_LINE_HEIGHT = '5px';
export const DEFAULT_LINE_COLOR = { red: 152, green: 10, blue: 121, alpha: 1, name: 'Cardinal Pink' };
export const DEFAULT_LINEFILL_COLOR = { red: 31, green: 119, blue: 161, alpha: 1, name: 'Matisse' };
export const DEFAULT_INDICATOR_STYLE = IndicatorShape.Circle;
export const DEFAULT_INDICATOR_SIZE = '18px';
export const DEFAULT_INDICATOR_COLOR = { red: 36, green: 29, blue: 163, alpha: 1, name: 'Denim Blue' };
export const DEFAULT_TEXT_COLOR = { red: 62, green: 64, blue: 74, alpha: 1, name: 'Dark Grey' };
export const maxPixels = 90;

export const settings = defineSettings({
    main: [
        {
            id: 'main-dropdown',
            type: 'dropdown',
            defaultValue: 'content_block',
            size: 'large',
            disabled: true,
            choices: [{ value: 'content_block', icon: 'BuildingBlock', label: 'Content Block' }],
        },
    ],
    style: [
        {
            id: 'line',
            type: 'multiInput',
            label: 'Line shape',
            lastItemFullWidth: true,
            blocks: [
                {
                    id: 'lineStyle',
                    type: 'dropdown',
                    defaultValue: DEFAULT_LINE_STYLE,
                    size: 'small',
                    choices: [
                        { value: LineShape.Round, label: 'Round' },
                        { value: LineShape.Square, label: 'Square' },
                    ],
                },
                {
                    id: 'lineHeight',
                    type: 'input',
                    defaultValue: DEFAULT_LINE_HEIGHT,
                    placeholder: 'e.g. 2px',
                    rules: [
                        {
                            errorMessage: "Please use a numerical value with or without 'px'",
                            validate: (value: string) => /^\d+(?:px)?$/.test(value),
                        },
                    ],
                    clearable: false,
                    onChange: (bundle: Bundle) => {
                        const blockValue = bundle.getBlock('lineHeight')?.value;
                        const blockStringValue = typeof blockValue === 'string' ? blockValue : '';
                        let numericValue = Number(blockStringValue);
                        if (Number.isNaN(numericValue)) {
                            numericValue = pxStringToNumber(blockStringValue);
                        }
                        if (numericValue > maxPixels) {
                            numericValue = maxPixels;
                        }
                        bundle.setBlockValue('lineHeight', `${numericValue}px`);
                        const indicatorSizeValue = bundle.getBlock('indicatorSize')?.value;
                        const indicatorSizeString = typeof indicatorSizeValue === 'string' ? indicatorSizeValue : '';
                        const numericIndicatorSize = pxStringToNumber(indicatorSizeString);
                        if (numericIndicatorSize < numericValue) {
                            bundle.setBlockValue('indicatorSize', `${numericValue}px`);
                        }
                    },
                },
                {
                    id: 'lineBackgroundColor',
                    type: 'colorInput',
                    label: 'Line color',
                    defaultValue: DEFAULT_LINE_COLOR,
                },
            ],
            layout: 'columns',
        },
        {
            id: 'lineActiveColor',
            type: 'colorInput',
            label: 'Line fill color',
            defaultValue: DEFAULT_LINEFILL_COLOR,
        },
        {
            id: 'indicator',
            type: 'multiInput',
            label: 'Indicator shape',
            lastItemFullWidth: true,
            blocks: [
                {
                    id: 'indicatorStyle',
                    type: 'dropdown',
                    defaultValue: DEFAULT_INDICATOR_STYLE,
                    size: 'small',
                    choices: [
                        { value: IndicatorShape.Circle, label: 'Circle' },
                        { value: IndicatorShape.Square, label: 'Square' },
                        { value: IndicatorShape.Bar, label: 'Bar' },
                    ],
                },
                {
                    id: 'indicatorSize',
                    type: 'input',
                    defaultValue: DEFAULT_INDICATOR_SIZE,
                    placeholder: 'e.g. 18px',
                    rules: [
                        {
                            errorMessage: "Please use a numerical value with or without 'px'",
                            validate: (value: string) => /^\d+(?:px)?$/.test(value),
                        },
                    ],
                    clearable: false,
                    onChange: (bundle: Bundle) => {
                        const indicatorSizeValue = bundle.getBlock('indicatorSize')?.value;
                        const indicatorSizeString = typeof indicatorSizeValue === 'string' ? indicatorSizeValue : '';
                        let numericSizeValue = Number(indicatorSizeString);
                        if (Number.isNaN(numericSizeValue)) {
                            numericSizeValue = pxStringToNumber(indicatorSizeString);
                        }
                        if (numericSizeValue > maxPixels) {
                            numericSizeValue = maxPixels;
                        }
                        const lineHeightValue = bundle.getBlock('lineHeight')?.value;
                        const lineHeightString = typeof lineHeightValue === 'string' ? lineHeightValue : '';
                        const lineHeight = pxStringToNumber(lineHeightString);
                        if (numericSizeValue < lineHeight) {
                            numericSizeValue = lineHeight;
                        }
                        bundle.setBlockValue('indicatorSize', `${numericSizeValue}px`);
                    },
                },
                {
                    id: 'indicatorColor',
                    type: 'colorInput',
                    label: 'Indicator color',
                    defaultValue: DEFAULT_INDICATOR_COLOR,
                },
            ],
            layout: 'columns',
        },
        {
            id: 'textColor',
            type: 'colorInput',
            label: 'Text color',
            defaultValue: DEFAULT_TEXT_COLOR,
        },
        {
            id: 'showValueLabel',
            label: 'Show value label',
            type: 'switch',
            defaultValue: true,
        },
    ],
});
