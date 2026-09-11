import React from 'react'
import { Landmark, Check, Search, CreditCard, User, FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { VIETNAM_BANKS, BankInfo, findBankByBin, removeVietnameseTones } from '@/lib/vietqr'
import { HostBankProfile } from '@/lib/storage'
import { useToast } from '@/lib/toast'

interface BankSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bankProfile: HostBankProfile
  onSaveBankProfile: (profile: HostBankProfile) => void
}

const BankSettingsForm: React.FC<{
  bankProfile: HostBankProfile
  onSave: (profile: HostBankProfile) => void
  onCancel: () => void
}> = ({ bankProfile, onSave, onCancel }) => {
  const [selectedBin, setSelectedBin] = React.useState(bankProfile.bankBin || '970422')
  const [accountNumber, setAccountNumber] = React.useState(bankProfile.accountNumber || '')
  const [accountName, setAccountName] = React.useState(bankProfile.accountName || '')
  const [memo, setMemo] = React.useState(bankProfile.memo || 'TIEN SAN CAU LONG')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [showBankPicker, setShowBankPicker] = React.useState(false)

  const selectedBank = findBankByBin(selectedBin) || VIETNAM_BANKS[0]

  const filteredBanks = VIETNAM_BANKS.filter((b) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      b.shortName.toLowerCase().includes(q) || b.name.toLowerCase().includes(q) || b.bin.includes(q)
    )
  })

  const handleSaveClick = () => {
    const cleanAccount = accountNumber.replace(/[\s.-]/g, '')
    const cleanName = removeVietnameseTones(accountName).toUpperCase().trim()
    const cleanMemo = memo.trim() || 'TIEN SAN CAU LONG'

    onSave({
      bankBin: selectedBin,
      accountNumber: cleanAccount,
      accountName: cleanName,
      memo: cleanMemo,
    })
  }

  return (
    <>
      <div className="space-y-4 py-2">
        {/* Selected Bank Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Ngân hàng thụ hưởng</label>
          <button
            type="button"
            onClick={() => setShowBankPicker(!showBankPicker)}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/80 hover:border-slate-700 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                {selectedBank.shortName.slice(0, 3)}
              </div>
              <div>
                <div className="text-xs font-bold text-white">{selectedBank.shortName}</div>
                <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
                  {selectedBank.name}
                </div>
              </div>
            </div>
            <span className="text-xs text-emerald-400 font-semibold">
              {showBankPicker ? 'Đóng' : 'Đổi ngân hàng'}
            </span>
          </button>
        </div>

        {/* Bank Picker Dropdown list */}
        {showBankPicker && (
          <div className="space-y-2 rounded-2xl bg-slate-950 p-3 border border-slate-800 animate-in fade-in-50">
            <div className="relative">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm ngân hàng (VD: MB, VCB, Techcombank)..."
                className="pl-8 text-xs bg-slate-900"
              />
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {filteredBanks.map((bank: BankInfo) => {
                const isSelected = bank.bin === selectedBin
                return (
                  <button
                    key={bank.bin}
                    type="button"
                    onClick={() => {
                      setSelectedBin(bank.bin)
                      setShowBankPicker(false)
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-emerald-950/60 border border-emerald-500/40 text-white font-bold'
                        : 'hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{bank.shortName}</span>
                      <span className="text-[10px] text-slate-500 truncate max-w-[170px]">
                        ({bank.name})
                      </span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Account Number Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Số tài khoản (STK)</label>
          <div className="relative">
            <Input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="VD: 0987654321"
              className="pl-8 font-mono text-sm font-semibold"
            />
            <CreditCard className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          </div>
        </div>

        {/* Account Holder Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Tên chủ tài khoản (Không dấu)
          </label>
          <div className="relative">
            <Input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value.toUpperCase())}
              placeholder="VD: NGUYEN VAN A"
              className="pl-8 text-xs uppercase font-semibold"
            />
            <User className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          </div>
        </div>

        {/* Transfer Memo Template */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Cú pháp nội dung chuyển khoản
          </label>
          <div className="relative">
            <Input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="VD: TIEN SAN CAU LONG"
              className="pl-8 text-xs font-medium"
            />
            <FileText className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          </div>
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          Hủy
        </Button>
        <Button variant="default" onClick={handleSaveClick}>
          Lưu tài khoản
        </Button>
      </DialogFooter>
    </>
  )
}

export const BankSettingsModal: React.FC<BankSettingsModalProps> = ({
  open,
  onOpenChange,
  bankProfile,
  onSaveBankProfile,
}) => {
  const { success } = useToast()

  const handleSave = (updated: HostBankProfile) => {
    onSaveBankProfile(updated)
    success('Đã lưu tài khoản ngân hàng', 'Mã VietQR sẽ tự động cập nhật')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100 p-5 rounded-3xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Landmark className="h-4 w-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-white">
              Cài đặt tài khoản VietQR
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-400">
            Thông tin ngân hàng của bạn để tạo mã VietQR nhận tiền tự động
          </DialogDescription>
        </DialogHeader>

        {open && (
          <BankSettingsForm
            bankProfile={bankProfile}
            onSave={handleSave}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
