import { useBlockSettings, useEditorState } from '@frontify/app-bridge';
import { Button, TextInput } from '@frontify/fondue/components';
import { IconPlus, IconTrashBin } from '@frontify/fondue/icons';
import { type BlockProps } from '@frontify/guideline-blocks-settings';
import { type ChangeEvent, type CSSProperties, type FC, useState } from 'react';

import RangeSlider from './RangeSlider';
import { divideStringByNumber, pxStringToNumber, toPixels, toRgbaString, type RgbaColor } from './helpers';
import {
    DEFAULT_INDICATOR_COLOR,
    DEFAULT_INDICATOR_SIZE,
    DEFAULT_INDICATOR_STYLE,
    DEFAULT_LINEFILL_COLOR,
    DEFAULT_LINE_COLOR,
    DEFAULT_LINE_HEIGHT,
    DEFAULT_LINE_STYLE,
    DEFAULT_PADDING,
    DEFAULT_TEXT_COLOR,
    IndicatorShape,
    LineShape,
} from './settings';
import style from './style.module.css';
import { type Padding } from './types';

type SliderRow = {
    id: string;
    value: number;
    left: string;
    right: string;
    label: string;
};

type Settings = {
    hasCustomPadding: boolean;
    padding: Padding;
    paddingTop: string;
    paddingRight: string;
    paddingBottom: string;
    paddingLeft: string;
    indicatorStyle: IndicatorShape;
    indicatorSize: string;
    indicatorColor: RgbaColor;
    lineStyle: LineShape;
    lineHeight: string;
    lineBackgroundColor: RgbaColor;
    lineActiveColor: RgbaColor;
    textValues: SliderRow[];
    textColor: RgbaColor;
};

type IndicatorSize = {
    width: string;
    height: string;
    radius: string;
};

const toIndicatorSize = (indicatorStyle: IndicatorShape, size: string, lineHeight: number): IndicatorSize => {
    if (indicatorStyle === IndicatorShape.Circle) {
        return { height: size, width: size, radius: '50%' };
    } else if (indicatorStyle === IndicatorShape.Square) {
        return { height: size, width: size, radius: '10%' };
    } else {
        return { height: size, width: lineHeight <= 10 ? toPixels(lineHeight.toString()) : '10px', radius: '0%' };
    }
};

const getIndicatorOffset = (
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

export const RangeSliderBlock: FC<BlockProps> = ({ appBridge }) => {
    const isEditing = useEditorState(appBridge);
    const [blockSettings, setBlockSettings] = useBlockSettings<Settings>(appBridge);
    const blockId = appBridge.context('blockId').get();

    const {
        hasCustomPadding = false,
        padding = DEFAULT_PADDING,
        paddingTop = '0px',
        paddingRight = '0px',
        paddingBottom = '0px',
        paddingLeft = '0px',
        textValues = [],
        indicatorStyle = DEFAULT_INDICATOR_STYLE,
        indicatorSize = DEFAULT_INDICATOR_SIZE,
        indicatorColor = DEFAULT_INDICATOR_COLOR,
        lineStyle = DEFAULT_LINE_STYLE,
        lineHeight = DEFAULT_LINE_HEIGHT,
        lineBackgroundColor = DEFAULT_LINE_COLOR,
        lineActiveColor = DEFAULT_LINEFILL_COLOR,
        textColor = DEFAULT_TEXT_COLOR,
    } = blockSettings;

    const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

    const saveDebounced = (rows: SliderRow[]) => {
        if (timer) {
            clearTimeout(timer);
        }
        const newTimer = setTimeout(() => {
            setBlockSettings({ ...blockSettings, textValues: rows }).catch(console.error);
        }, 300);
        setTimer(newTimer);
    };

    const onLeftChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
        const updated = textValues.map((row, i) => (i === index ? { ...row, left: e.target.value } : row));
        saveDebounced(updated);
    };

    const onRightChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
        const updated = textValues.map((row, i) => (i === index ? { ...row, right: e.target.value } : row));
        saveDebounced(updated);
    };

    const onValueChange = (value: number, index: number) => {
        const updated = textValues.map((row, i) => (i === index ? { ...row, value } : row));
        saveDebounced(updated);
    };

    const onLabelChange = (value: string, index: number) => {
        const updated = textValues.map((row, i) => (i === index ? { ...row, label: value } : row));
        saveDebounced(updated);
    };

    const onAddRow = (): void => {
        const updated = [...textValues, { id: crypto.randomUUID(), value: 50, left: '', right: '', label: '' }];
        setBlockSettings({ ...blockSettings, textValues: updated }).catch(console.error);
    };

    const onDelete = (index: number): void => {
        const updated = textValues.filter((_, i) => i !== index);
        setBlockSettings({ ...blockSettings, textValues: updated }).catch(console.error);
    };

    const customPaddingValue = hasCustomPadding
        ? `${paddingTop} ${paddingRight} ${paddingBottom} ${paddingLeft}`
        : padding;

    const customStyles: CSSProperties = {
        width: '100%',
        padding: customPaddingValue,
    };

    const lineHeightNum = pxStringToNumber(lineHeight);
    const indicatorSizeNum = pxStringToNumber(indicatorSize);
    const indicatorDimensions = toIndicatorSize(indicatorStyle, indicatorSize, lineHeightNum);

    const customIndicatorStyles: CSSProperties = {
        background: toRgbaString(indicatorColor),
        borderRadius: indicatorDimensions.radius,
        width: indicatorDimensions.width,
        height: indicatorDimensions.height,
    };

    const customLineStyles: CSSProperties = {
        borderRadius: lineStyle === LineShape.Square ? '1px' : toPixels(divideStringByNumber(lineHeight, 2).toString()),
        height: toPixels(lineHeight),
        background: toRgbaString(lineBackgroundColor),
    };

    const customActiveLineStyles: CSSProperties = {
        borderRadius:
            lineStyle === LineShape.Square
                ? '1px'
                : `${toPixels(divideStringByNumber(lineHeight, 2).toString())} 0px 0px ${toPixels(divideStringByNumber(lineHeight, 2).toString())}`,
        height: toPixels(lineHeight),
        background: toRgbaString(lineActiveColor),
    };

    const customTextColor: CSSProperties = {
        color: toRgbaString(textColor),
    };

    const labelSpanStyle: CSSProperties = {
        color: customTextColor.color,
        display: 'block',
        overflow: 'visible',
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        marginTop: '1.25%',
        minWidth: '14%',
        maxWidth: '14%',
    };

    return (
        <div data-block-id={blockId}>
            {textValues.map((item, index) => (
                <div className={style.container} style={customStyles} key={item.id}>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px',
                        }}
                    >
                        {isEditing ? (
                            <TextInput
                                value={item.left}
                                onChange={(e) => onLeftChange(e, index)}
                                placeholder="Left value"
                                aria-label="Left value"
                            />
                        ) : (
                            <span style={{ ...labelSpanStyle, textAlign: 'right' }}>{item.left}</span>
                        )}

                        <div style={{ flex: 1, paddingBottom: isEditing ? '40px' : item.label ? '24px' : '0px' }}>
                            <RangeSlider
                                min={0}
                                max={100}
                                step={1}
                                value={item.value}
                                offset={getIndicatorOffset(
                                    indicatorStyle,
                                    isEditing,
                                    textValues[index],
                                    lineHeightNum,
                                    indicatorSizeNum,
                                )}
                                onChange={(v) => onValueChange(v as number, index)}
                                indicatorStyles={customIndicatorStyles}
                                lineStyles={customLineStyles}
                                activeLineStyles={customActiveLineStyles}
                                isEditing={isEditing}
                                sliderAriaLabel={`Slider ${index + 1}`}
                                label={item.label}
                                onLabelChange={(v) => onLabelChange(v, index)}
                                textColorStyle={customTextColor}
                            />
                        </div>

                        {isEditing ? (
                            <TextInput
                                value={item.right}
                                onChange={(e) => onRightChange(e, index)}
                                placeholder="Right value"
                                aria-label="Right value"
                            />
                        ) : (
                            <span style={{ ...labelSpanStyle, textAlign: 'left' }}>{item.right}</span>
                        )}

                        {isEditing ? (
                            <Button
                                hugWidth
                                emphasis="weak"
                                rounding="medium"
                                size="small"
                                type="button"
                                onPress={() => onDelete(index)}
                                aria-label="Delete row"
                            >
                                <IconTrashBin />
                            </Button>
                        ) : null}
                    </div>
                </div>
            ))}

            {isEditing ? (
                <Button
                    hugWidth={false}
                    emphasis="weak"
                    rounding="medium"
                    size="medium"
                    type="button"
                    onPress={onAddRow}
                >
                    <IconPlus />
                    Add a new row
                </Button>
            ) : null}
        </div>
    );
};
