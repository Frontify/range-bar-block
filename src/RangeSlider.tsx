import { TextInput } from '@frontify/fondue/components';
import { type ChangeEvent, type CSSProperties, type Dispatch, type FC, type SetStateAction } from 'react';

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
    onLabelChange?: (value: string) => void;
    textColorStyle?: CSSProperties;
    showValueLabel?: boolean;
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
    onLabelChange,
    textColorStyle,
    showValueLabel = true,
}) => {
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
                            style={{ ...activeLineStyles, right: `${100 - valuePercent}%` }}
                        />
                    </div>
                    <div className={style.control} style={{ ...indicatorStyles, left: labelLeft }} />
                </div>
            </div>

            {showValueLabel && (
                <div className={style.valueLabel} style={{ left: labelLeft }}>
                    {isEditing ? (
                        <div className={style.valueLabelInput}>
                            <TextInput
                                placeholder="Label"
                                value={label ?? ''}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => onLabelChange?.(e.target.value)}
                                aria-label="Slider label"
                            />
                        </div>
                    ) : label ? (
                        <span style={textColorStyle}>{label}</span>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default RangeSlider;
