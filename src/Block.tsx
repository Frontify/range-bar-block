import { useBlockSettings, useEditorState } from '@frontify/app-bridge';
import { Button, TextInput } from '@frontify/fondue/components';
import { IconPlus, IconTrashBin } from '@frontify/fondue/icons';
import { type BlockProps } from '@frontify/guideline-blocks-settings';
import { type CSSProperties, type FC, type ChangeEvent, useRef, useState } from 'react';

import RangeSlider from './RangeSlider';
import { dividePixelValue, pxStringToNumber, toPixels, toRgbaString, type RgbaColor } from './helpers';
import { getIndicatorOffset, toIndicatorSize, type SliderRow } from './indicatorHelpers';
import {
    DEFAULT_INDICATOR_COLOR,
    DEFAULT_INDICATOR_SIZE,
    DEFAULT_INDICATOR_STYLE,
    DEFAULT_LINEFILL_COLOR,
    DEFAULT_LINE_COLOR,
    DEFAULT_LINE_HEIGHT,
    DEFAULT_LINE_STYLE,
    DEFAULT_TEXT_COLOR,
    type IndicatorShape,
    LineShape,
} from './settings';
import style from './style.module.css';

type RangeSliderSettings = {
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

export const RangeSliderBlock: FC<BlockProps> = ({ appBridge }) => {
    const isEditing = useEditorState(appBridge);
    const [blockSettings, setBlockSettings] = useBlockSettings<RangeSliderSettings>(appBridge);
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
    const [percentageInputs, setPercentageInputs] = useState<Record<string, string>>(
        Object.fromEntries(savedTextValues.map((r) => [r.id, String(r.value)])),
    );
    const [percentageErrors, setPercentageErrors] = useState<Record<string, boolean>>({});
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

    const onLeftChange = (e: ChangeEvent<HTMLTextAreaElement>, index: number) => {
        const updated = textValues.map((row, i) => (i === index ? { ...row, left: e.target.value } : row));
        saveDebounced(updated);
    };

    const onRightChange = (e: ChangeEvent<HTMLTextAreaElement>, index: number) => {
        const updated = textValues.map((row, i) => (i === index ? { ...row, right: e.target.value } : row));
        saveDebounced(updated);
    };

    const onValueChange = (value: number, index: number) => {
        const rowId = textValues[index].id;
        const updated = textValues.map((row, i) => (i === index ? { ...row, value } : row));
        setPercentageInputs((prev) => ({ ...prev, [rowId]: String(value) }));
        setPercentageErrors((prev) => ({ ...prev, [rowId]: false }));
        saveDebounced(updated);
    };

    const onPercentageChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
        const rowId = textValues[index].id;
        const raw = e.target.value;
        setPercentageInputs((prev) => ({ ...prev, [rowId]: raw }));
        if (raw === '') {
            setPercentageErrors((prev) => ({ ...prev, [rowId]: false }));
            return;
        }
        const num = parseInt(raw, 10);
        const isValid = !isNaN(num) && num >= 0 && num <= 100 && /^\d+$/.test(raw);
        setPercentageErrors((prev) => ({ ...prev, [rowId]: !isValid }));
        if (isValid) {
            const updated = textValues.map((row, i) => (i === index ? { ...row, value: num } : row));
            saveDebounced(updated);
        }
    };

    const onPercentageBlur = (index: number) => {
        const row = textValues[index];
        setPercentageInputs((prev) => ({ ...prev, [row.id]: String(row.value) }));
        setPercentageErrors((prev) => ({ ...prev, [row.id]: false }));
    };

    const onLabelChange = (value: string, index: number) => {
        const updated = textValues.map((row, i) => (i === index ? { ...row, label: value } : row));
        saveDebounced(updated);
    };

    const onAddRow = (): void => {
        const newRow = { id: crypto.randomUUID(), value: 50, left: '', right: '', label: '' };
        const updated = [...textValues, newRow];
        setTextValues(updated);
        setPercentageInputs((prev) => ({ ...prev, [newRow.id]: '50' }));
        setBlockSettings({ ...blockSettings, textValues: updated }).catch(console.error);
    };

    const onDeleteRow = (index: number): void => {
        const rowId = textValues[index].id;
        const updated = textValues.filter((_, i) => i !== index);
        setTextValues(updated);
        setPercentageInputs((prev) => {
            const n = { ...prev };
            delete n[rowId];
            return n;
        });
        setPercentageErrors((prev) => {
            const n = { ...prev };
            delete n[rowId];
            return n;
        });
        setBlockSettings({ ...blockSettings, textValues: updated }).catch(console.error);
    };

    const lineHeightNum = pxStringToNumber(lineHeight);
    const indicatorSizeNum = pxStringToNumber(indicatorSize);
    const indicatorDimensions = toIndicatorSize(indicatorStyle, indicatorSize, lineHeightNum);

    const indicatorStyles: CSSProperties = {
        background: toRgbaString(indicatorColor),
        borderRadius: indicatorDimensions.radius,
        width: indicatorDimensions.width,
        height: indicatorDimensions.height,
    };

    const lineStyles: CSSProperties = {
        borderRadius: lineStyle === LineShape.Square ? '1px' : toPixels(dividePixelValue(lineHeight, 2).toString()),
        height: toPixels(lineHeight),
        background: toRgbaString(lineBackgroundColor),
    };

    const activeLineStyles: CSSProperties = {
        borderRadius:
            lineStyle === LineShape.Square
                ? '1px'
                : `${toPixels(dividePixelValue(lineHeight, 2).toString())} 0px 0px ${toPixels(dividePixelValue(lineHeight, 2).toString())}`,
        height: toPixels(lineHeight),
        background: toRgbaString(lineActiveColor),
    };

    const textColorStyle: CSSProperties = {
        color: toRgbaString(textColor),
    };

    return (
        <div className="range-slider-v2" range-slider-v2={blockId ?? undefined}>
            {textValues.map((item, index) => {
                const sliderAriaLabel = item.label
                    ? `${item.label}: ${item.left || 'Min'} to ${item.right || 'Max'}`
                    : `Row ${index + 1}: ${item.left || 'Min'} to ${item.right || 'Max'}`;
                const ariaValueText = `${item.value}% between "${item.left || 'Min'}" and "${item.right || 'Max'}"`;
                const halfIndicatorWidth = pxStringToNumber(indicatorDimensions.width) / 2;
                const editOffset = getIndicatorOffset(indicatorStyle, true, item, lineHeightNum, indicatorSizeNum);
                const editLabelLeft = `clamp(${halfIndicatorWidth}px, ${item.value + editOffset}%, calc(100% - ${halfIndicatorWidth}px))`;
                // Piecewise-linear translate: ramps 0→-50% over value 0-20, holds -50% from 20-80, ramps -50%→-100% over 80-100
                const editLabelTranslate =
                    item.value <= 20 ? item.value * 2.5 : item.value >= 80 ? 50 + (item.value - 80) * 2.5 : 50;
                return (
                    <div className={`${style.container}`} key={item.id}>
                        {isEditing ? (
                            <>
                                {/* Row 1 (narrow): Min / Max textareas */}
                                <div className={style.editInputRow}>
                                    <textarea
                                        className={style.inputSideTextarea}
                                        value={item.left}
                                        onChange={(e) => onLeftChange(e, index)}
                                        placeholder="Min"
                                        rows={1}
                                        aria-label="Left value"
                                    />
                                    <textarea
                                        className={style.inputSideTextarea}
                                        value={item.right}
                                        onChange={(e) => onRightChange(e, index)}
                                        placeholder="Max"
                                        rows={1}
                                        aria-label="Right value"
                                    />
                                </div>

                                {/* Row 2: Slider + Delete (wide: Min | Slider | Max | Delete) */}
                                <div className={style.editSliderRow}>
                                    <textarea
                                        className={`${style.inputSideTextarea} ${style.inputSideWideOnly}`}
                                        value={item.left}
                                        onChange={(e) => onLeftChange(e, index)}
                                        placeholder="Min"
                                        rows={1}
                                        aria-label="Left value"
                                        tabIndex={-1}
                                        aria-hidden="true"
                                    />
                                    <div className={style.inputCenter}>
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
                                            indicatorStyles={indicatorStyles}
                                            lineStyles={lineStyles}
                                            activeLineStyles={activeLineStyles}
                                            isEditing={isEditing}
                                            sliderAriaLabel={sliderAriaLabel}
                                            ariaValueText={ariaValueText}
                                            showValueLabel={false}
                                        />
                                        {showValueLabel && (
                                            <textarea
                                                className={`${style.inputSideTextarea} ${style.editLabelFloating}`}
                                                style={{
                                                    left: editLabelLeft,
                                                    transform: `translateX(-${editLabelTranslate}%)`,
                                                }}
                                                value={item.label ?? ''}
                                                onChange={(e) => onLabelChange(e.target.value, index)}
                                                placeholder="Label"
                                                rows={1}
                                                aria-label="Slider label"
                                            />
                                        )}
                                    </div>
                                    <textarea
                                        className={`${style.inputSideTextarea} ${style.inputSideWideOnly}`}
                                        value={item.right}
                                        onChange={(e) => onRightChange(e, index)}
                                        placeholder="Max"
                                        rows={1}
                                        aria-label="Right value"
                                        tabIndex={-1}
                                        aria-hidden="true"
                                    />
                                    <div className={style.deleteButton}>
                                        <Button
                                            hugWidth
                                            emphasis="weak"
                                            rounding="medium"
                                            size="small"
                                            type="button"
                                            onPress={() => onDeleteRow(index)}
                                            aria-label="Delete row"
                                        >
                                            <IconTrashBin />
                                        </Button>
                                    </div>
                                </div>

                                {/* Row 3: Label textarea (narrow) + % input */}
                                <div className={style.editLabelRow}>
                                    {showValueLabel && (
                                        <textarea
                                            className={`${style.inputSideTextarea} ${style.editLabelInline}`}
                                            value={item.label ?? ''}
                                            onChange={(e) => onLabelChange(e.target.value, index)}
                                            placeholder="Label"
                                            rows={1}
                                            aria-label="Slider label"
                                        />
                                    )}
                                    <div className={style.percentageControl}>
                                        <div className={style.editControlsRow}>
                                            <div className={style.percentageInput}>
                                                <TextInput
                                                    value={percentageInputs[item.id] ?? String(item.value)}
                                                    onChange={(e) => onPercentageChange(e, index)}
                                                    onBlur={() => onPercentageBlur(index)}
                                                    placeholder="0–100"
                                                    aria-label="Percentage value"
                                                    status={percentageErrors[item.id] ? 'error' : 'neutral'}
                                                    aria-describedby={`pct-error-${item.id}`}
                                                />
                                            </div>
                                            <span
                                                className={style.percentageUnit}
                                                style={{ color: textColorStyle.color }}
                                            >
                                                %
                                            </span>
                                        </div>
                                        <span
                                            id={`pct-error-${item.id}`}
                                            role="alert"
                                            aria-live="assertive"
                                            className={style.percentageError}
                                        >
                                            {percentageErrors[item.id] && 'Enter a value between 0 and 100'}
                                        </span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className={style.viewSliderRow}>
                                <span title={item.left} className={style.labelTextLeft} style={textColorStyle}>
                                    {item.left}
                                </span>
                                <div className={style.inputCenter}>
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
                                        indicatorStyles={indicatorStyles}
                                        lineStyles={lineStyles}
                                        activeLineStyles={activeLineStyles}
                                        isEditing={isEditing}
                                        sliderAriaLabel={sliderAriaLabel}
                                        ariaValueText={ariaValueText}
                                        label={item.label}
                                        textColorStyle={textColorStyle}
                                        showValueLabel={showValueLabel}
                                    />
                                </div>
                                <span title={item.right} className={style.labelTextRight} style={textColorStyle}>
                                    {item.right}
                                </span>
                            </div>
                        )}
                    </div>
                );
            })}

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
