import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CourtFeeSection } from './CourtFeeSection';
import * as api from '@/lib/api';

describe('CourtFeeSection component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, 'fetchVenues').mockResolvedValue([]);
  });

  // covers: AC-2
  it('renders court fee inputs and handles value changes', () => {
    const onCourtFeeChange = vi.fn();
    const onVenueNameChange = vi.fn();
    const onCourtNumberChange = vi.fn();

    render(
      <CourtFeeSection
        courtFee={200000}
        onCourtFeeChange={onCourtFeeChange}
        venueName="Sân Kỳ Hòa"
        onVenueNameChange={onVenueNameChange}
        courtNumber="Sân 3"
        onCourtNumberChange={onCourtNumberChange}
      />
    );

    expect(screen.getByText('Tiền thuê sân')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sân Kỳ Hòa')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sân 3')).toBeInTheDocument();

    const venueInput = screen.getByPlaceholderText('VD: Sân Kỳ Hòa');
    fireEvent.change(venueInput, { target: { value: 'Sân Lan Anh' } });
    expect(onVenueNameChange).toHaveBeenCalledWith('Sân Lan Anh');

    const courtInput = screen.getByPlaceholderText('VD: Sân 3');
    fireEvent.change(courtInput, { target: { value: 'Sân 5' } });
    expect(onCourtNumberChange).toHaveBeenCalledWith('Sân 5');
  });

  it('triggers preset increment clicks on money input', () => {
    // covers: AC-2
    const onCourtFeeChange = vi.fn();

    render(
      <CourtFeeSection
        courtFee={200000}
        onCourtFeeChange={onCourtFeeChange}
        venueName="Sân Kỳ Hòa"
        onVenueNameChange={vi.fn()}
      />
    );

    const presetBtn = screen.getByRole('button', { name: '+100k' });
    fireEvent.click(presetBtn);
    expect(onCourtFeeChange).toHaveBeenCalledWith(300000);
  });
});
