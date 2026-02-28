import { useBlockSettings, useEditorState } from '@frontify/app-bridge';
import { Button, TextInput } from '@frontify/fondue/components';
import { IconPlus, IconTrashBin } from '@frontify/fondue/icons';
import { type BlockProps } from '@frontify/guideline-blocks-settings';
import { type CSSProperties, type FC, type ChangeEvent, useRef, useState } from 'react';

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
    DEFAULT_TEXT_COLOR,
    IndicatorShape,
    LineShape,
} from './settings';
import style from './style.module.css';

type SliderRow = {
    id: string;
    value: number;
    left: string;
    right: string;
    label: string;
};

type Settings = {
    showValueLabel: boolean;
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
        showValueLabel = true,
        textValues: savedTextValues = [],
        indicatorStyle = DEFAULT_INDICATOR_STYLE,
        indicatorSize = DEFAULT_INDICATOR_SIZE,
        indicatorColor = DEFAULT_INDICATOR_COLOR,
        lineStyle = DEFAULT_LINE_STYLE,
        lineHeight = DEFAULT_LINE_HEIGHT,
        lineBackgroundColor = DEFAULT_LINE_COLOR,
        lineActiveColor = DEFAULT_LINEFILL_COLOR,
        textColor = DEFAULT_TEXT_COLOR,
    } = blockSettings;

    const [textValues, setTextValues] = useState<SliderRow[]>(savedTextValues);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const saveDebounced = (rows: SliderRow[]) => {
        setTextValues(rows);
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
            setBlockSettings({ ...blockSettings, textValues: rows }).catch(console.error);
        }, 500);
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
        setTextValues(updated);
        setBlockSettings({ ...blockSettings, textValues: updated }).catch(console.error);
    };

    const onDelete = (index: number): void => {
        const updated = textValues.filter((_, i) => i !== index);
        setTextValues(updated);
        setBlockSettings({ ...blockSettings, textValues: updated }).catch(console.error);
    };

    const customStyles: CSSProperties = {
        width: '100%',
        padding: '8px',
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

    return (
        <div data-block-id={blockId}>
            {textValues.map((item, index) => (
                <div
                    className={style.container}
                    style={{ ...customStyles, paddingBottom: showValueLabel ? '48px' : '0px' }}
                    key={item.id}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isEditing ? (
                            <div style={{ width: '100px', flexShrink: 0 }}>
                                <TextInput
                                    value={item.left}
                                    onChange={(e) => onLeftChange(e, index)}
                                    placeholder="Min"
                                    aria-label="Left value"
                                />
                            </div>
                        ) : (
                            <span
                                title={item.left}
                                style={{
                                    color: customTextColor.color,
                                    maxWidth: '120px',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis',
                                    display: 'block',
                                    flexShrink: 0,
                                }}
                            >
                                {item.left}
                            </span>
                        )}

                        <div style={{ flex: 1 }}>
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
                                showValueLabel={showValueLabel}
                            />
                        </div>

                        {isEditing ? (
                            <div style={{ width: '100px', flexShrink: 0 }}>
                                <TextInput
                                    value={item.right}
                                    onChange={(e) => onRightChange(e, index)}
                                    placeholder="Max"
                                    aria-label="Right value"
                                />
                            </div>
                        ) : (
                            <span
                                title={item.right}
                                style={{
                                    color: customTextColor.color,
                                    maxWidth: '100px',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis',
                                    display: 'block',
                                    flexShrink: 0,
                                }}
                            >
                                {item.right}
                            </span>
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
