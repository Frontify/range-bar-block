import { useBlockSettings, useEditorState } from '@frontify/app-bridge';
import { Button, TextInput, Textarea } from '@frontify/fondue/components';
import { IconPlus, IconTrashBin } from '@frontify/fondue/icons';
import { type BlockProps } from '@frontify/guideline-blocks-settings';
import { type CSSProperties, type FC, type ChangeEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';

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
    const [labelHeights, setLabelHeights] = useState<Record<string, number>>({});
    const [spanHeights, setSpanHeights] = useState<Record<string, { left: number; right: number }>>({});
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRowRef = useRef<Map<string, HTMLDivElement>>(new Map());
    const leftSpanRef = useRef<Map<string, HTMLElement>>(new Map());
    const rightSpanRef = useRef<Map<string, HTMLElement>>(new Map());

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

    useLayoutEffect(() => {
        if (!isEditing) {
            return;
        }
        for (const row of textValues) {
            const rowEl = inputRowRef.current.get(row.id);
            if (!rowEl) {
                continue;
            }
            const textareas = Array.from(rowEl.querySelectorAll<HTMLTextAreaElement>('textarea'));
            if (textareas.length < 2) {
                continue;
            }
            for (const ta of textareas) {
                ta.style.height = '';
            }
            const maxH = Math.max(...textareas.map((ta) => ta.scrollHeight));
            for (const ta of textareas) {
                ta.style.height = `${maxH}px`;
            }
        }
    }, [textValues, isEditing]);

    // Track heights of left/right side spans so we can push the value label further
    // down when the slider is near an edge (0-20% or 80-100%) and tall side text
    // would otherwise overlap the label.
    useEffect(() => {
        if (isEditing) {
            return;
        }
        const observers: ResizeObserver[] = [];
        const measure = () => {
            setSpanHeights((prev) => {
                const next = { ...prev };
                for (const row of textValues) {
                    const leftEl = leftSpanRef.current.get(row.id);
                    const rightEl = rightSpanRef.current.get(row.id);
                    next[row.id] = {
                        left: leftEl?.offsetHeight ?? 0,
                        right: rightEl?.offsetHeight ?? 0,
                    };
                }
                return next;
            });
        };
        for (const row of textValues) {
            for (const el of [leftSpanRef.current.get(row.id), rightSpanRef.current.get(row.id)]) {
                if (el) {
                    const ro = new ResizeObserver(measure);
                    ro.observe(el);
                    observers.push(ro);
                }
            }
        }
        measure();
        return () => {
            for (const ro of observers) {
                ro.disconnect();
            }
        };
    }, [textValues, isEditing]);

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
                    <div
                        className={`${style.container}`}
                        key={item.id}
                        style={{ '--thumb-size': indicatorDimensions.width } as CSSProperties}
                    >
                        {isEditing ? (
                            <>
                                {/* Row 1 (narrow): Min / Max textareas */}
                                <div
                                    className={style.editInputRow}
                                    ref={(el) => {
                                        if (el) {
                                            inputRowRef.current.set(item.id, el);
                                        } else {
                                            inputRowRef.current.delete(item.id);
                                        }
                                    }}
                                >
                                    <div className={style.editInputRowItem}>
                                        <Textarea
                                            value={item.left}
                                            onChange={(e) => onLeftChange(e, index)}
                                            placeholder="Min"
                                            minRows={1}
                                        />
                                    </div>
                                    <div className={style.editInputRowItem}>
                                        <Textarea
                                            value={item.right}
                                            onChange={(e) => onRightChange(e, index)}
                                            placeholder="Max"
                                            minRows={1}
                                        />
                                    </div>
                                </div>

                                {/* Row 2: Slider + Delete (wide: Min | Slider | Max | Delete) */}
                                <div className={style.editSliderRow}>
                                    <div className={style.inputSideWideOnly} aria-hidden="true">
                                        <Textarea
                                            value={item.left}
                                            onChange={(e) => onLeftChange(e, index)}
                                            placeholder="Min"
                                            minRows={1}
                                        />
                                    </div>
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
                                            <div
                                                className={style.editLabelFloating}
                                                style={{
                                                    left: editLabelLeft,
                                                    transform: `translateX(-${editLabelTranslate}%)`,
                                                }}
                                            >
                                                <Textarea
                                                    value={item.label ?? ''}
                                                    onChange={(e) => onLabelChange(e.target.value, index)}
                                                    placeholder="Label"
                                                    minRows={1}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className={style.inputSideWideOnly} aria-hidden="true">
                                        <Textarea
                                            value={item.right}
                                            onChange={(e) => onRightChange(e, index)}
                                            placeholder="Max"
                                            minRows={1}
                                        />
                                    </div>
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
                                        <div className={style.editLabelInline}>
                                            <Textarea
                                                value={item.label ?? ''}
                                                onChange={(e) => onLabelChange(e.target.value, index)}
                                                placeholder="Label"
                                                minRows={1}
                                            />
                                        </div>
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
                            <>
                                <div className={style.viewSliderRow}>
                                    <span
                                        ref={(el) => {
                                            if (el) {
                                                leftSpanRef.current.set(item.id, el);
                                            } else {
                                                leftSpanRef.current.delete(item.id);
                                            }
                                        }}
                                        title={item.left}
                                        className={style.labelTextLeft}
                                        style={textColorStyle}
                                    >
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
                                            onLabelHeight={(h) =>
                                                setLabelHeights((prev) => ({ ...prev, [item.id]: h }))
                                            }
                                            labelPaddingTop={(() => {
                                                const DESIRED_GAP = 10;
                                                const leftH = spanHeights[item.id]?.left ?? 0;
                                                const rightH = spanHeights[item.id]?.right ?? 0;
                                                const relevantH =
                                                    item.value <= 20 ? leftH : item.value >= 80 ? rightH : 0;
                                                // Add desired gap ON TOP of the overlap compensation.
                                                // Math.max prevents a negative term when span is shorter than thumb.
                                                const overlap = Math.max(0, (relevantH - indicatorSizeNum) / 2);
                                                return DESIRED_GAP + overlap;
                                            })()}
                                        />
                                    </div>
                                    <span
                                        ref={(el) => {
                                            if (el) {
                                                rightSpanRef.current.set(item.id, el);
                                            } else {
                                                rightSpanRef.current.delete(item.id);
                                            }
                                        }}
                                        title={item.right}
                                        className={style.labelTextRight}
                                        style={textColorStyle}
                                    >
                                        {item.right}
                                    </span>
                                </div>
                                <div style={{ height: labelHeights[item.id] ?? 0 }} />
                            </>
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
