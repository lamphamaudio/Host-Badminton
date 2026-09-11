import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BankSettingsModal } from './BankSettingsModal';
import { ToastProvider } from '@/lib/toast';

describe('BankSettingsModal component', () => {
  // covers: AC-3, AC-4
  const defaultProfile = {
    bankBin: '970422',
    accountNumber: '0987654321',
    accountName: 'PHAM TRAN LAM',
    memo: 'TIEN SAN CAU LONG',
  };

  it('renders modal inputs with prefilled bank data', () => {
    render(
      <ToastProvider>
        <BankSettingsModal
          open={true}
          onOpenChange={vi.fn()}
          bankProfile={defaultProfile}
          onSaveBankProfile={vi.fn()}
        />
      </ToastProvider>
    );

    expect(screen.getByText('Cài đặt tài khoản VietQR')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0987654321')).toBeInTheDocument();
    expect(screen.getByDisplayValue('PHAM TRAN LAM')).toBeInTheDocument();
    expect(screen.getByDisplayValue('TIEN SAN CAU LONG')).toBeInTheDocument();
  });

  it('allows switching bank using bank selector dropdown', () => {
    render(
      <ToastProvider>
        <BankSettingsModal
          open={true}
          onOpenChange={vi.fn()}
          bankProfile={defaultProfile}
          onSaveBankProfile={vi.fn()}
        />
      </ToastProvider>
    );

    const togglePickerBtn = screen.getByRole('button', { name: /Đổi ngân hàng/i });
    fireEvent.click(togglePickerBtn);

    const vcbOption = screen.getByText('Vietcombank');
    expect(vcbOption).toBeInTheDocument();
    fireEvent.click(vcbOption);

    expect(screen.getAllByText('Vietcombank').length).toBeGreaterThan(0);
  });

  it('saves updated bank profile and triggers callback', () => {
    const onSave = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <ToastProvider>
        <BankSettingsModal
          open={true}
          onOpenChange={onOpenChange}
          bankProfile={defaultProfile}
          onSaveBankProfile={onSave}
        />
      </ToastProvider>
    );

    const stkInput = screen.getByPlaceholderText('VD: 0987654321');
    fireEvent.change(stkInput, { target: { value: '1903 6288 999' } });

    const saveBtn = screen.getByRole('button', { name: 'Lưu tài khoản' });
    fireEvent.click(saveBtn);

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        accountNumber: '19036288999',
      })
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
