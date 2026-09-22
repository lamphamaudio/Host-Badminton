import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/money-input'
import type { Member, SettleDebtRequest, SettleDebtResponse } from '@/lib/api'
import { formatVND } from '@/lib/formatters'
import { CheckCircle2, Receipt, Sparkles } from 'lucide-react'

interface SettleDebtModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: Member | null
  onSettle: (memberId: string, data: SettleDebtRequest) => Promise<SettleDebtResponse>
}

export const SettleDebtModal: React.FC<SettleDebtModalProps> = ({
  open,
  onOpenChange,
  member,
  onSettle,
}) => {
  const [amount, setAmount] = useState<number>(0)
  const [note, setNote] = useState<string>('Chuyển khoản VietQR')
  const [forgiveRemainder, setForgiveRemainder] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (member && open) {
      setAmount(member.total_debt > 0 ? member.total_debt : 0)
      setNote('Chuyển khoản VietQR')
      setForgiveRemainder(false)
      setErrorMessage(null)
    }
  }, [member, open])

  if (!member) return null

  const remainingAfterPayment = forgiveRemainder ? 0 : Math.max(0, member.total_debt - amount)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (amount <= 0 && !forgiveRemainder) {
      setErrorMessage('Vui lòng nhập số tiền thanh toán lớn hơn 0')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await onSettle(member.id, {
        amount: amount > 0 ? amount : 1, // Ensure minimal amount if forgiving
        note: note.trim() || undefined,
        forgive_remainder: forgiveRemainder,
      })
      onOpenChange(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi ghi nhận thanh toán'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] bg-surface border-t border-line text-fg shadow-2xl">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2 text-lg font-bold text-fg">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent border border-accent/30">
              <Receipt className="w-4 h-4" />
            </div>
            <span>Ghi nhận thanh toán nợ</span>
          </DrawerTitle>
          <DrawerDescription className="text-xs text-fg-muted">
            Khấu trừ công nợ của <span className="font-semibold text-fg">{member.name}</span>{' '}
            theo thứ tự từ buổi chơi cũ nhất (FIFO).
          </DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="p-3 text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl">
              {errorMessage}
            </div>
          )}

          {/* Current Debt Summary Card */}
          <div className="p-3.5 rounded-2xl bg-raised border border-line flex items-center justify-between">
            <div>
              <div className="text-xs text-fg-muted">Tổng nợ hiện tại</div>
              <div className="text-base font-bold text-danger tabular-nums">
                {formatVND(member.total_debt)}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setAmount(member.total_debt)
                setForgiveRemainder(false)
              }}
              className="text-xs border-line text-fg hover:bg-raised"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-accent" />
              Trả hết
            </Button>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-fg">
              Số tiền thanh toán (VND) <span className="text-danger">*</span>
            </label>
            <MoneyInput
              value={amount}
              onChangeValue={(val) => setAmount(val)}
              placeholder="0"
              quickIncrements={[]}
              className="bg-surface border-line text-lg font-semibold"
            />
            {/* Preset amounts replace the value; they do not add to it */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[50000, 100000, 150000, 200000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  aria-pressed={amount === preset}
                  className={`min-h-[44px] rounded-lg border text-xs font-mono font-semibold transition-colors cursor-pointer ${
                    amount === preset
                      ? 'border-accent/40 bg-accent/10 text-accent'
                      : 'border-line bg-raised text-fg hover:bg-line-strong'
                  }`}
                >
                  {preset / 1000}k
                </button>
              ))}
            </div>
          </div>

          {/* Settlement Note */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-fg">Hình thức / Ghi chú</label>
            <Input
              placeholder="VD: Chuyển khoản VietQR, Tiền mặt..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-surface border-line"
            />
          </div>

          {/* Forgive Remainder Option */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-raised border border-line">
            <div>
              <div className="text-sm font-medium text-fg">Miễn số nợ còn lại</div>
              <div className="text-xs text-fg-muted">
                Xóa toàn bộ nợ cũ còn lại sau khi thanh toán số tiền này
              </div>
            </div>
            <button
              type="button"
              onClick={() => setForgiveRemainder(!forgiveRemainder)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                forgiveRemainder ? 'bg-warn' : 'bg-line-strong'
              }`}
            >
              <div
                className={`bg-surface w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  forgiveRemainder ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Post-settlement Preview */}
          <div className="p-3 rounded-xl bg-raised border border-line flex items-center justify-between text-xs">
            <span className="text-fg-muted font-medium">Nợ còn lại sau thanh toán:</span>
            <span
              className={`font-bold tabular-nums ${
                remainingAfterPayment === 0 ? 'text-accent' : 'text-warn'
              }`}
            >
              {formatVND(remainingAfterPayment)}
            </span>
          </div>

          <DrawerFooter className="px-0 pt-4 flex flex-row gap-3">
            <DrawerClose asChild>
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-line text-fg hover:bg-raised"
              >
                Hủy
              </Button>
            </DrawerClose>
            <Button
              type="submit"
              disabled={isSubmitting || (amount <= 0 && !forgiveRemainder)}
              className="flex-1 bg-volt hover:bg-volt-hover text-ink font-medium"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              {isSubmitting ? 'Đang lưu...' : 'Xác nhận thu nợ'}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
