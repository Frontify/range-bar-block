import { TextInput } from '@frontify/fondue/components';
import { type ChangeEvent, type CSSProperties, type Dispatch, type FC, type SetStateAction } from 'react';

import './style.css';

type Props = {
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
    label?: string;
    onLabelChange?: (value: string) => void;
    textColorStyle?: CSSProperties;
    showValueLabel?: boolean;
};

const RangeSlider: FC<Props> = ({
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
    label,
    onLabelChange,
    textColorStyle,
    showValueLabel = true,
}) => {
    const handleMaxChange = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        onChange(+e.target.value);
    };

    const halfIndicatorWidth = parseFloat(String(indicatorStyles.width ?? '16px')) / 2;
    const maxPos = (value / max) * 100;
    const labelLeft = `clamp(${halfIndicatorWidth}px, ${maxPos + offset}%, calc(100% - ${halfIndicatorWidth}px))`;

    return (
        <div className="slider-root">
            <div className="wrapper">
                <div className="input-wrapper">
                    <input
                        className="input"
                        type="range"
                        value={value}
                        min={min}
                        max={max}
                        step={step}
                        onChange={handleMaxChange}
                        disabled={!isEditing}
                        aria-label={sliderAriaLabel}
                    />
                </div>

                <div className="control-wrapper">
                    <div className="rail" style={lineStyles}>
                        <div className="inner-rail" style={{ ...activeLineStyles, right: `${100 - maxPos}%` }} />
                    </div>
                    <div className="control" style={{ ...indicatorStyles, left: labelLeft }} />
                </div>
            </div>

            {/* Floating value label under indicator */}
            {showValueLabel && (
                <div className="value-label" style={{ left: labelLeft }}>
                    {isEditing ? (
                        <div className="value-label-input">
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
