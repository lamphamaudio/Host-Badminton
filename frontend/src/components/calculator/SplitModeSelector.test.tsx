import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SplitModeSelector } from './SplitModeSelector';

describe('SplitModeSelector component', () => {
  // covers: AC-1, AC-2
  it('renders split mode tabs and handles mode selection', () => {
    const onSplitModeChange = vi.fn();

    render(
      <SplitModeSelector
        splitMode="even"
        onSplitModeChange={onSplitModeChange}
        femaleDiscount={10000}
        onFemaleDiscountChange={vi.fn()}
        fixedFemaleFee={30000}
        onFixedFemaleFeeChange={vi.fn()}
        earlyLeaverConfig={{ count: 0, stage1Ratio: 0.5 }}
        onEarlyLeaverConfigChange={vi.fn()}
        totalParticipants={10}
        totalShuttleCount={8}
      />
    );

    expect(screen.getByText('Chia đều')).toBeInTheDocument();
    expect(screen.getByText('Giảm giá Nữ')).toBeInTheDocument();
    expect(screen.getByText('Nữ cố định')).toBeInTheDocument();
    expect(screen.getByText('Về sớm (2 hiệp)')).toBeInTheDocument();

    const femaleDiscountBtn = screen.getByText('Giảm giá Nữ');
    fireEvent.click(femaleDiscountBtn);
    expect(onSplitModeChange).toHaveBeenCalledWith('fixed_female_discount');
  });

  it('renders dynamic female discount controls when splitMode is fixed_female_discount', () => {
    // covers: AC-1, AC-2
    const onFemaleDiscountChange = vi.fn();

    render(
      <SplitModeSelector
        splitMode="fixed_female_discount"
        onSplitModeChange={vi.fn()}
        femaleDiscount={10000}
        onFemaleDiscountChange={onFemaleDiscountChange}
        fixedFemaleFee={30000}
        onFixedFemaleFeeChange={vi.fn()}
        earlyLeaverConfig={{ count: 0, stage1Ratio: 0.5 }}
        onEarlyLeaverConfigChange={vi.fn()}
        totalParticipants={10}
        totalShuttleCount={8}
      />
    );

    expect(screen.getByText('Mức giảm giá cho Nữ (VND)')).toBeInTheDocument();
    const preset15k = screen.getByRole('button', { name: '+15k' });
    fireEvent.click(preset15k);
    expect(onFemaleDiscountChange).toHaveBeenCalledWith(25000);
  });

  it('renders dynamic multi stage controls when splitMode is multi_stage', () => {
    // covers: AC-1, AC-2
    const onEarlyLeaverConfigChange = vi.fn();

    render(
      <SplitModeSelector
        splitMode="multi_stage"
        onSplitModeChange={vi.fn()}
        femaleDiscount={10000}
        onFemaleDiscountChange={vi.fn()}
        fixedFemaleFee={30000}
        onFixedFemaleFeeChange={vi.fn()}
        earlyLeaverConfig={{ count: 1, stage1Ratio: 0.5, stage1Shuttlecocks: 4 }}
        onEarlyLeaverConfigChange={onEarlyLeaverConfigChange}
        totalParticipants={10}
        totalShuttleCount={8}
      />
    );

    expect(screen.getByText('Cấu hình 2 hiệp & Người về sớm')).toBeInTheDocument();
    expect(screen.getByText('50% thời gian sân')).toBeInTheDocument();

    const ratio23Btn = screen.getByRole('button', { name: '2/3 giờ' });
    fireEvent.click(ratio23Btn);
    expect(onEarlyLeaverConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({ stage1Ratio: 0.67 })
    );
  });
});
