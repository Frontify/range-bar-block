import {
    type ChangeEvent,
    type CSSProperties,
    type Dispatch,
    type FC,
    type SetStateAction,
    useEffect,
    useRef,
} from 'react';

import style from './style.module.css';

type RangeSliderProps = {
    min: number;
    max: number;
    value: number;
    step: number;
    offset: number;
    onChange: Dispatch<SetStateAction<number>>;
    indicatorStyles: CSSProperties;
    lineStyles: CSSProperties;
    activeLineStyles: CSSProperties;
    isEditing: boolean;
    sliderAriaLabel: string;
    ariaValueText?: string;
    label?: string;
    textColorStyle?: CSSProperties;
    showValueLabel?: boolean;
    onLabelHeight?: (height: number) => void;
    labelPaddingTop?: number;
};

const RangeSlider: FC<RangeSliderProps> = ({
    min,
    max,
    value,
    step,
    offset,
    indicatorStyles,
    lineStyles,
    activeLineStyles,
    onChange,
    isEditing,
    sliderAriaLabel,
    ariaValueText,
    label,
    textColorStyle,
    showValueLabel = true,
    onLabelHeight,
    labelPaddingTop,
}) => {
    const labelRef = useRef<HTMLDivElement>(null);
    const onLabelHeightRef = useRef(onLabelHeight);

    useEffect(() => {
        onLabelHeightRef.current = onLabelHeight;
    });

    useEffect(() => {
        const labelEl = labelRef.current;
        if (!labelEl) {
            onLabelHeightRef.current?.(0);
            return;
        }
        const apply = () => {
            onLabelHeightRef.current?.(labelEl.offsetHeight + 2);
        };
        const ro = new ResizeObserver(apply);
        ro.observe(labelEl);
        apply();
        return () => {
            ro.disconnect();
        };
    }, [label, isEditing, showValueLabel]);

    const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        onChange(+e.target.value);
    };

    const halfIndicatorWidth = parseFloat(String(indicatorStyles.width ?? '16px')) / 2;
    const valuePercent = (value / max) * 100;
    const labelLeft = `clamp(${halfIndicatorWidth}px, ${valuePercent + offset}%, calc(100% - ${halfIndicatorWidth}px))`;

    return (
        <div className={style.sliderRoot} style={{ '--thumb-size': indicatorStyles.width ?? '16px' } as CSSProperties}>
            <div className={style.wrapper}>
                <div className={style.inputWrapper}>
                    <input
                        className={style.sliderInput}
                        type="range"
                        value={value}
                        min={min}
                        max={max}
                        step={step}
                        onChange={handleSliderChange}
                        disabled={!isEditing}
                        aria-label={sliderAriaLabel}
                        aria-valuetext={ariaValueText}
                    />
                </div>

                <div className={style.controlWrapper}>
                    <div className={style.rail} style={lineStyles}>
                        <div
                            className={style.innerRail}
                            style={{ ...activeLineStyles, right: `calc(100% - ${labelLeft})` }}
                        />
                    </div>
                    <div className={style.control} style={{ ...indicatorStyles, left: labelLeft }} />
                </div>
            </div>

            {!isEditing && showValueLabel && label && (
                <div
                    ref={labelRef}
                    className={style.valueLabel}
                    style={{ left: labelLeft, paddingTop: labelPaddingTop ?? 6 }}
                >
                    <span style={textColorStyle}>{label}</span>
                </div>
            )}
        </div>
    );
};

export default RangeSlider;
