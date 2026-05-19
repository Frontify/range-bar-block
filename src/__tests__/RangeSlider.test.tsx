import { render, screen, fireEvent } from '@testing-library/react';
import { type CSSProperties } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import RangeSlider from '../RangeSlider';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../style.module.css', () => ({
    default: new Proxy({} as Record<string | symbol, string>, {
        get: (_t: Record<string | symbol, string>, key: string | symbol): string => String(key),
    }),
}));

// ---------------------------------------------------------------------------
// Default props
// ---------------------------------------------------------------------------

const defaultProps = {
    min: 0,
    max: 100,
    value: 50,
    step: 1,
    offset: 0,
    onChange: vi.fn(),
    indicatorStyles: { width: '18px', height: '18px' } as CSSProperties,
    lineStyles: {} as CSSProperties,
    activeLineStyles: {} as CSSProperties,
    isEditing: false,
    sliderAriaLabel: 'Test slider',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RangeSlider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders a slider input with the provided aria-label', () => {
        render(<RangeSlider {...defaultProps} sliderAriaLabel="Revenue: Low to High" />);
        expect(screen.getByRole('slider', { name: 'Revenue: Low to High' })).toBeInTheDocument();
    });

    it('calls onChange when slider value changes', () => {
        const onChange = vi.fn();
        render(<RangeSlider {...defaultProps} onChange={onChange} isEditing />);
        const slider = screen.getByRole('slider');
        fireEvent.change(slider, { target: { value: '75' } });
        expect(onChange).toHaveBeenCalled();
    });

    it('renders the value label when showValueLabel=true and label is provided', () => {
        render(<RangeSlider {...defaultProps} showValueLabel label="Midpoint" isEditing={false} />);
        expect(screen.getByText('Midpoint')).toBeInTheDocument();
    });

    it('does not render the value label when showValueLabel=false', () => {
        render(<RangeSlider {...defaultProps} showValueLabel={false} label="Midpoint" isEditing={false} />);
        expect(screen.queryByText('Midpoint')).not.toBeInTheDocument();
    });

    it('does not render the value label when isEditing=true', () => {
        render(<RangeSlider {...defaultProps} showValueLabel label="Midpoint" isEditing />);
        expect(screen.queryByText('Midpoint')).not.toBeInTheDocument();
    });

    it('does not render the value label when label is not provided', () => {
        const { container } = render(
            <RangeSlider {...defaultProps} showValueLabel label={undefined} isEditing={false} />,
        );
        // The CSS proxy returns the key name as the class, so style.valueLabel === 'valueLabel'
        expect(container.querySelector('.valueLabel')).not.toBeInTheDocument();
    });

    it('sets --thumb-size CSS variable on the root element', () => {
        const { container } = render(
            <RangeSlider {...defaultProps} indicatorStyles={{ width: '48px', height: '48px' } as CSSProperties} />,
        );
        const root = container.firstElementChild as HTMLElement;
        expect(root).toHaveStyle({ '--thumb-size': '48px' });
    });

    it('slider input is disabled when not editing', () => {
        render(<RangeSlider {...defaultProps} isEditing={false} />);
        expect(screen.getByRole('slider')).toBeDisabled();
    });

    it('slider input is enabled when editing', () => {
        render(<RangeSlider {...defaultProps} isEditing />);
        expect(screen.getByRole('slider')).not.toBeDisabled();
    });

    it('sets aria-valuetext on the input', () => {
        render(<RangeSlider {...defaultProps} ariaValueText='50% between "Low" and "High"' />);
        expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '50% between "Low" and "High"');
    });
});
