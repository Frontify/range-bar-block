import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { RangeSliderBlock } from '../Block';
import { type SliderRow } from '../indicatorHelpers';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Stub CSS modules — return an empty proxy so className lookups don't throw
vi.mock('../style.module.css', () => ({
    default: new Proxy(
        {},
        {
            get: (_t: Record<string | symbol, string>, key: string | symbol): string => String(key),
        },
    ),
}));

const mockSetBlockSettings = vi.fn().mockResolvedValue(undefined);
const mockUseBlockSettings = vi.fn();
const mockUseEditorState = vi.fn();

vi.mock('@frontify/app-bridge', () => ({
    useBlockSettings: (...args: unknown[]) => mockUseBlockSettings(...args),
    useEditorState: (...args: unknown[]) => mockUseEditorState(...args),
}));

// @frontify/guideline-blocks-settings pulls in a massive editor dep tree (slate, plate,
// emoji-mart) that isn't installed. Mock the entire package — Block.tsx only imports
// the 'BlockProps' type (erased at runtime), and settings.ts uses 'defineSettings'
// which we stub as an identity function.
vi.mock('@frontify/guideline-blocks-settings', () => ({
    defineSettings: (s: unknown) => s,
    defineBlock: (b: unknown) => b,
}));

// Stub Fondue components with minimal HTML equivalents
vi.mock('@frontify/fondue/components', () => ({
    Button: ({
        children,
        onPress,
        'aria-label': ariaLabel,
    }: {
        children: React.ReactNode;
        onPress: () => void;
        'aria-label'?: string;
    }) => (
        <button type="button" onClick={onPress} aria-label={ariaLabel}>
            {children}
        </button>
    ),
    TextInput: ({
        value,
        onChange,
        onBlur,
        placeholder,
        'aria-label': ariaLabel,
        'aria-describedby': ariaDescribedby,
        status,
    }: {
        value: string;
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
        onBlur?: () => void;
        placeholder?: string;
        'aria-label'?: string;
        'aria-describedby'?: string;
        status?: string;
    }) => (
        <input
            type="text"
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedby}
            aria-invalid={status === 'error' ? 'true' : undefined}
        />
    ),
    Textarea: ({
        value,
        onChange,
        placeholder,
    }: {
        value: string;
        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
        placeholder?: string;
    }) => <textarea value={value} onChange={onChange} placeholder={placeholder} />,
}));

vi.mock('@frontify/fondue/icons', () => ({
    IconPlus: () => <span>+</span>,
    IconTrashBin: () => <span>🗑</span>,
}));

// Stub RangeSlider — we test it separately
vi.mock('../RangeSlider', () => ({
    default: ({ sliderAriaLabel }: { sliderAriaLabel: string }) => <input type="range" aria-label={sliderAriaLabel} />,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeRow = (overrides: Partial<SliderRow> = {}): SliderRow => ({
    id: 'row-1',
    value: 50,
    left: 'Low',
    right: 'High',
    label: 'Mid',
    ...overrides,
});

type AppBridgeMock = Parameters<typeof RangeSliderBlock>[0]['appBridge'];

const makeAppBridge = (): AppBridgeMock =>
    ({
        context: (key: string) => ({ get: () => (key === 'blockId' ? 'test-block-1' : null) }),
    }) as unknown as AppBridgeMock;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RangeSliderBlock', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSetBlockSettings.mockResolvedValue(undefined);
        mockUseEditorState.mockReturnValue(true);
        mockUseBlockSettings.mockReturnValue([{ textValues: [makeRow()] }, mockSetBlockSettings]);
    });

    it('renders sliders for each row in block settings', () => {
        mockUseBlockSettings.mockReturnValue([
            { textValues: [makeRow({ id: 'r1' }), makeRow({ id: 'r2' })] },
            mockSetBlockSettings,
        ]);
        render(<RangeSliderBlock appBridge={makeAppBridge()} />);
        expect(screen.getAllByRole('slider')).toHaveLength(2);
    });

    it('adds a new row when "Add a new row" button is pressed', async () => {
        const user = userEvent.setup();
        render(<RangeSliderBlock appBridge={makeAppBridge()} />);

        const addButton = screen.getByRole('button', { name: /add a new row/i });
        await user.click(addButton);

        expect(mockSetBlockSettings).toHaveBeenCalled();
        const callArg = mockSetBlockSettings.mock.calls[0][0] as { textValues: SliderRow[] };
        expect(callArg.textValues).toHaveLength(2);
    });

    it('deletes a row when trash button is pressed', async () => {
        const user = userEvent.setup();
        render(<RangeSliderBlock appBridge={makeAppBridge()} />);

        const deleteButton = screen.getByRole('button', { name: /delete row/i });
        await user.click(deleteButton);

        expect(mockSetBlockSettings).toHaveBeenCalled();
        const callArg = mockSetBlockSettings.mock.calls[0][0] as { textValues: SliderRow[] };
        expect(callArg.textValues).toHaveLength(0);
    });

    it('shows role=alert when percentage is out of range (> 100)', async () => {
        const user = userEvent.setup();
        render(<RangeSliderBlock appBridge={makeAppBridge()} />);

        const pctInput = screen.getByRole('textbox', { name: /percentage value/i });
        await user.clear(pctInput);
        await user.type(pctInput, '150');

        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(pctInput).toHaveAttribute('aria-invalid', 'true');
    });

    it('does not show alert text for a valid percentage', async () => {
        const user = userEvent.setup();
        render(<RangeSliderBlock appBridge={makeAppBridge()} />);

        const pctInput = screen.getByRole('textbox', { name: /percentage value/i });
        await user.clear(pctInput);
        await user.type(pctInput, '42');

        const alert = screen.queryByRole('alert');
        if (alert) {
            expect(alert).toHaveTextContent('');
        }
        expect(pctInput).not.toHaveAttribute('aria-invalid', 'true');
    });

    it('clears validation error on blur', async () => {
        const user = userEvent.setup();
        render(<RangeSliderBlock appBridge={makeAppBridge()} />);

        const pctInput = screen.getByRole('textbox', { name: /percentage value/i });
        await user.clear(pctInput);
        await user.type(pctInput, '999');

        expect(screen.getByRole('alert')).toBeInTheDocument();

        await user.tab();

        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent('');
        expect(pctInput).not.toHaveAttribute('aria-invalid', 'true');
    });

    it('does not render "Add a new row" button when not editing', () => {
        mockUseEditorState.mockReturnValue(false);
        render(<RangeSliderBlock appBridge={makeAppBridge()} />);
        expect(screen.queryByRole('button', { name: /add a new row/i })).not.toBeInTheDocument();
    });

    it('calls setBlockSettings with updated percentage value when valid', async () => {
        const user = userEvent.setup();
        vi.useFakeTimers({ shouldAdvanceTime: true });
        render(<RangeSliderBlock appBridge={makeAppBridge()} />);

        const pctInput = screen.getByRole('textbox', { name: /percentage value/i });
        await user.clear(pctInput);
        await user.type(pctInput, '75');

        vi.advanceTimersByTime(600);

        expect(mockSetBlockSettings).toHaveBeenCalled();
        const lastCall = mockSetBlockSettings.mock.calls.at(-1)?.[0] as { textValues: SliderRow[] };
        expect(lastCall.textValues[0].value).toBe(75);
        vi.useRealTimers();
    });
});
