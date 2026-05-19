import { useBlockSettings, useEditorState } from '@frontify/app-bridge';
import { Button, Textarea } from '@frontify/fondue/components';
import { IconPlus, IconTrashBin } from '@frontify/fondue/icons';
import { type BlockProps } from '@frontify/guideline-blocks-settings';
import {
    type CSSProperties,
    type FC,
    type ChangeEvent,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    startTransition,
} from 'react';

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

const getLabelPaddingTop = (
    id: string,
    value: number,
    spanHeights: Record<string, { left: number; right: number }>,
    containerWidths: Record<string, number>,
    indicatorSizeNum: number,
): number => {
    const DESIRED_GAP = 10;
    const leftH = spanHeights[id]?.left ?? 0;
    const rightH = spanHeights[id]?.right ?? 0;
    const isNarrow = (containerWidths[id] ?? 9999) <= 480;
    const relevantH = isNarrow ? Math.max(leftH, rightH) : value <= 20 ? leftH : value >= 80 ? rightH : 0;
    const overlap = Math.max(0, (relevantH - indicatorSizeNum) / 2);
    return DESIRED_GAP + overlap;
};

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

    const [rows, setRows] = useState<SliderRow[]>(savedTextValues);
    const [percentageInputs, setPercentageInputs] = useState<Record<string, string>>(
        Object.fromEntries(savedTextValues.map((r) => [r.id, String(r.value)])),
    );
    const [percentageErrors, setPercentageErrors] = useState<Record<string, boolean>>({});
    const [labelHeights, setLabelHeights] = useState<Record<string, number>>({});
    const [spanHeights, setSpanHeights] = useState<Record<string, { left: number; right: number }>>({});
    const [containerWidths, setContainerWidths] = useState<Record<string, number>>({});
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRowRef = useRef<Map<string, HTMLDivElement>>(new Map());
    const leftSpanRef = useRef<Map<string, HTMLElement>>(new Map());
    const rightSpanRef = useRef<Map<string, HTMLElement>>(new Map());
    const containerRef = useRef<Map<string, HTMLDivElement>>(new Map());

    const saveDebounced = useCallback(
        (updatedRows: SliderRow[]) => {
            setRows(updatedRows);
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            timerRef.current = setTimeout(() => {
                timerRef.current = null;
                setBlockSettings({ textValues: updatedRows }).catch(console.error);
            }, 500);
        },
        [setBlockSettings],
    );

    // Re-sync local rows if blockSettings change externally (e.g. collaborative editing)
    // and there is no pending local save in flight.
    useEffect(() => {
        if (!timerRef.current) {
            startTransition(() => {
                setRows(savedTextValues);
                setPercentageInputs(Object.fromEntries(savedTextValues.map((r) => [r.id, String(r.value)])));
            });
        }
    }, [savedTextValues]);

    const onLeftChange = (e: ChangeEvent<HTMLTextAreaElement>, index: number) => {
        const updated = rows.map((row, i) => (i === index ? { ...row, left: e.target.value } : row));
        saveDebounced(updated);
    };

    const onRightChange = (e: ChangeEvent<HTMLTextAreaElement>, index: number) => {
        const updated = rows.map((row, i) => (i === index ? { ...row, right: e.target.value } : row));
        saveDebounced(updated);
    };

    const onValueChange = (value: number, index: number) => {
        const rowId = rows[index].id;
        const updated = rows.map((row, i) => (i === index ? { ...row, value } : row));
        setPercentageInputs((prev) => ({ ...prev, [rowId]: String(value) }));
        setPercentageErrors((prev) => ({ ...prev, [rowId]: false }));
        saveDebounced(updated);
    };

    const onPercentageChange = (e: ChangeEvent<HTMLTextAreaElement>, index: number) => {
        const rowId = rows[index].id;
        const raw = e.target.value.replaceAll('\n', '');
        setPercentageInputs((prev) => ({ ...prev, [rowId]: raw }));
        if (raw === '') {
            setPercentageErrors((prev) => ({ ...prev, [rowId]: false }));
            return;
        }
        const num = parseInt(raw, 10);
        const isValid = !isNaN(num) && num >= 0 && num <= 100 && /^(0|[1-9]\d*)$/.test(raw);
        setPercentageErrors((prev) => ({ ...prev, [rowId]: !isValid }));
        if (isValid) {
            const updated = rows.map((row, i) => (i === index ? { ...row, value: num } : row));
            saveDebounced(updated);
        }
    };

    const onPercentageBlur = (index: number) => {
        const row = rows[index];
        setPercentageInputs((prev) => ({ ...prev, [row.id]: String(row.value) }));
        setPercentageErrors((prev) => ({ ...prev, [row.id]: false }));
    };

    const onLabelChange = (value: string, index: number) => {
        const updated = rows.map((row, i) => (i === index ? { ...row, label: value } : row));
        saveDebounced(updated);
    };

    const onAddRow = (): void => {
        const newRow = { id: crypto.randomUUID(), value: 50, left: '', right: '', label: '' };
        const updated = [...rows, newRow];
        setRows(updated);
        setPercentageInputs((prev) => ({ ...prev, [newRow.id]: '50' }));
        setBlockSettings({ textValues: updated }).catch(console.error);
    };

    const onDeleteRow = (index: number): void => {
        const rowId = rows[index].id;
        const updated = rows.filter((_, i) => i !== index);
        setRows(updated);
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
        setBlockSettings({ textValues: updated }).catch(console.error);
    };

    useLayoutEffect(() => {
        if (!isEditing) {
            return;
        }
        for (const row of rows) {
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
    }, [rows, isEditing]);

    // Track heights of left/right side spans so we can push the value label further
    // down when the slider is near an edge (0-20% or 80-100%) and tall side text
    // would otherwise overlap the label.
    useEffect(() => {
        if (isEditing) {
            return;
        }
        const ro = new ResizeObserver(() => {
            setSpanHeights((prev) => {
                const next = { ...prev };
                for (const row of rows) {
                    const leftEl = leftSpanRef.current.get(row.id);
                    const rightEl = rightSpanRef.current.get(row.id);
                    next[row.id] = {
                        left: leftEl?.offsetHeight ?? 0,
                        right: rightEl?.offsetHeight ?? 0,
                    };
                }
                return next;
            });
        });
        for (const row of rows) {
            const leftEl = leftSpanRef.current.get(row.id);
            const rightEl = rightSpanRef.current.get(row.id);
            if (leftEl) {
                ro.observe(leftEl);
            }
            if (rightEl) {
                ro.observe(rightEl);
            }
        }
        return () => ro.disconnect();
    }, [rows, isEditing]);

    useEffect(() => {
        if (isEditing) {
            return;
        }
        const ro = new ResizeObserver((entries) => {
            setContainerWidths((prev) => {
                const next = { ...prev };
                for (const entry of entries) {
                    for (const [id, el] of containerRef.current) {
                        if (el === entry.target) {
                            next[id] = (entry.target as HTMLElement).offsetWidth;
                            break;
                        }
                    }
                }
                return next;
            });
        });
        for (const row of rows) {
            const el = containerRef.current.get(row.id);
            if (el) {
                ro.observe(el);
            }
        }
        return () => ro.disconnect();
    }, [rows, isEditing]);

    const lineHeightNum = useMemo(() => pxStringToNumber(lineHeight), [lineHeight]);
    const indicatorSizeNum = useMemo(() => pxStringToNumber(indicatorSize), [indicatorSize]);
    const indicatorDimensions = useMemo(
        () => toIndicatorSize(indicatorStyle, indicatorSize, lineHeightNum),
        [indicatorStyle, indicatorSize, lineHeightNum],
    );

    const indicatorStyles: CSSProperties = useMemo(
        () => ({
            background: toRgbaString(indicatorColor),
            borderRadius: indicatorDimensions.radius,
            width: indicatorDimensions.width,
            height: indicatorDimensions.height,
        }),
        [indicatorColor, indicatorDimensions],
    );

    const lineStyles: CSSProperties = useMemo(
        () => ({
            borderRadius: lineStyle === LineShape.Square ? '1px' : toPixels(dividePixelValue(lineHeight, 2).toString()),
            height: toPixels(lineHeight),
            background: toRgbaString(lineBackgroundColor),
        }),
        [lineStyle, lineHeight, lineBackgroundColor],
    );

    const activeLineStyles: CSSProperties = useMemo(
        () => ({
            borderRadius:
                lineStyle === LineShape.Square
                    ? '1px'
                    : `${toPixels(dividePixelValue(lineHeight, 2).toString())} 0px 0px ${toPixels(dividePixelValue(lineHeight, 2).toString())}`,
            height: toPixels(lineHeight),
            background: toRgbaString(lineActiveColor),
        }),
        [lineStyle, lineHeight, lineActiveColor],
    );

    const textColorValue = useMemo(() => toRgbaString(textColor), [textColor]);

    const halfIndicatorWidth = pxStringToNumber(indicatorDimensions.width) / 2;

    return (
        <div data-range-slider-block={blockId ?? undefined} data-block-id={blockId ?? undefined}>
            {rows.map((item, index) => {
                const sliderAriaLabel = item.label
                    ? `${item.label}: ${item.left || 'Min'} to ${item.right || 'Max'}`
                    : `Row ${index + 1}: ${item.left || 'Min'} to ${item.right || 'Max'}`;
                const ariaValueText = `${item.value}% between "${item.left || 'Min'}" and "${item.right || 'Max'}"`;
                const editOffset = getIndicatorOffset(indicatorStyle, true, item, lineHeightNum, indicatorSizeNum);
                const editLabelLeft = `clamp(${halfIndicatorWidth}px, ${item.value + editOffset}%, calc(100% - ${halfIndicatorWidth}px))`;
                // Piecewise-linear translate: ramps 0→-50% over value 0-20, holds -50% from 20-80, ramps -50%→-100% over 80-100
                const editLabelTranslate =
                    item.value <= 20 ? item.value * 2.5 : item.value >= 80 ? 50 + (item.value - 80) * 2.5 : 50;
                const containerStyle = {
                    '--text-color': textColorValue,
                    '--edit-label-left': editLabelLeft,
                    '--edit-label-translate': `${editLabelTranslate}%`,
                } as CSSProperties;
                return (
                    <div
                        className={`${style.container}`}
                        key={item.id}
                        style={containerStyle}
                        ref={(el) => {
                            if (el) {
                                containerRef.current.set(item.id, el);
                            } else {
                                containerRef.current.delete(item.id);
                            }
                        }}
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
                                                rows[index],
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
                                            <div className={style.editLabelFloating}>
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
                                                <Textarea
                                                    value={percentageInputs[item.id] ?? String(item.value)}
                                                    onChange={(e) => onPercentageChange(e, index)}
                                                    onBlur={() => onPercentageBlur(index)}
                                                    placeholder="%"
                                                    aria-label="Percentage value"
                                                    aria-invalid={percentageErrors[item.id] ? 'true' : undefined}
                                                    aria-describedby={`pct-error-${item.id}`}
                                                    minRows={1}
                                                    maxRows={1}
                                                />
                                            </div>
                                            <span className={style.percentageUnit}>%</span>
                                        </div>
                                    </div>
                                </div>
                                <span id={`pct-error-${item.id}`} role="alert" className={style.percentageError}>
                                    {percentageErrors[item.id] && 'Enter a value between 0 and 100'}
                                </span>
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
                                                rows[index],
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
                                            showValueLabel={showValueLabel}
                                            onLabelHeight={(h) =>
                                                setLabelHeights((prev) => ({ ...prev, [item.id]: h }))
                                            }
                                            labelPaddingTop={getLabelPaddingTop(
                                                item.id,
                                                item.value,
                                                spanHeights,
                                                containerWidths,
                                                indicatorSizeNum,
                                            )}
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
