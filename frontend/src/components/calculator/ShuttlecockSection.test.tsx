import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShuttlecockSection } from './ShuttlecockSection';

describe('ShuttlecockSection component', () => {
  // covers: AC-2
  it('renders shuttlecock count, unit price, and calculates total fee', () => {
    const onShuttlecockCountChange = vi.fn();
    const onUnitPriceChange = vi.fn();

    render(
      <ShuttlecockSection
        shuttlecockCount={8}
        onShuttlecockCountChange={onShuttlecockCountChange}
        unitPrice={20000}
        onUnitPriceChange={onUnitPriceChange}
      />
    );

    expect(screen.getByText('Tiền cầu lông')).toBeInTheDocument();
    expect(screen.getByText(/160\.000/)).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();

    const incrementBtn = screen.getByRole('button', { name: 'Tăng' });
    fireEvent.click(incrementBtn);
    expect(onShuttlecockCountChange).toHaveBeenCalledWith(9);
  });

  it('updates unit price from quick presets', () => {
    // covers: AC-2
    const onUnitPriceChange = vi.fn();

    render(
      <ShuttlecockSection
        shuttlecockCount={8}
        onShuttlecockCountChange={vi.fn()}
        unitPrice={20000}
        onUnitPriceChange={onUnitPriceChange}
      />
    );

    const preset25k = screen.getByRole('button', { name: '+25k' });
    fireEvent.click(preset25k);
    expect(onUnitPriceChange).toHaveBeenCalledWith(45000);
  });
});
