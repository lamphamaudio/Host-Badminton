import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerCountSection } from './PlayerCountSection';

describe('PlayerCountSection component', () => {
  // covers: AC-2
  it('renders male and female player counters and total badge', () => {
    const onMaleCountChange = vi.fn();
    const onFemaleCountChange = vi.fn();

    render(
      <PlayerCountSection
        maleCount={6}
        onMaleCountChange={onMaleCountChange}
        femaleCount={4}
        onFemaleCountChange={onFemaleCountChange}
      />
    );

    expect(screen.getByText('Số người tham gia')).toBeInTheDocument();
    expect(screen.getByText('Tổng: 10 người')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();

    const buttons = screen.getAllByRole('button', { name: 'Tăng' });
    // First is male, second is female
    fireEvent.click(buttons[0]);
    expect(onMaleCountChange).toHaveBeenCalledWith(7);

    fireEvent.click(buttons[1]);
    expect(onFemaleCountChange).toHaveBeenCalledWith(5);
  });

  // covers: AC-2
  it('renders quick pick chips and toggles member selection', () => {
    const onToggleMember = vi.fn();
    const mockMembers = [
      {
        id: 'm1',
        host_id: 'h1',
        name: 'Nguyễn Văn Nam',
        gender: 'male' as const,
        total_debt: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    render(
      <PlayerCountSection
        maleCount={1}
        onMaleCountChange={vi.fn()}
        femaleCount={0}
        onFemaleCountChange={vi.fn()}
        availableMembers={mockMembers}
        selectedMemberIds={[]}
        onToggleMember={onToggleMember}
      />
    );

    expect(screen.getByText(/Chọn nhanh thành viên/i)).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn Nam')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Nguyễn Văn Nam'));
    expect(onToggleMember).toHaveBeenCalledWith(mockMembers[0]);
  });
});
