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
        onChange(Math.max(+e.target.value, step));
    };

    const maxPos = (value / max) * 100;
    const labelLeft = `${maxPos + offset}%`;

    return (
        <div style={{ position: 'relative', width: '100%' }}>
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
                        <div
                            className="inner-rail"
                            style={{ ...activeLineStyles, left: '0', right: `${100 - maxPos}%` }}
                        />
                    </div>
                    <div className="control" style={{ ...indicatorStyles, left: labelLeft }} />
                </div>
            </div>

            {/* Floating value label under indicator */}
            {showValueLabel && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: labelLeft,
                        transform: 'translateX(-50%)',
                        paddingTop: '4px',
                        whiteSpace: 'nowrap',
                        zIndex: 1,
                    }}
                >
                    {isEditing ? (
                        <div style={{ width: '100px' }}>
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
