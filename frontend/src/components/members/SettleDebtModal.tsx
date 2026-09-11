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
      <DrawerContent className="max-h-[90vh] bg-slate-900 border-t border-slate-800 text-slate-100">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2 text-lg font-bold text-white">
            <Receipt className="w-5 h-5 text-emerald-400" />
            Ghi nhận thanh toán nợ
          </DrawerTitle>
          <DrawerDescription className="text-xs text-slate-400">
            Khấu trừ công nợ của <span className="font-semibold text-slate-200">{member.name}</span>{' '}
            theo thứ tự từ buổi chơi cũ nhất (FIFO).
          </DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="p-3 text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg">
              {errorMessage}
            </div>
          )}

          {/* Current Debt Summary Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Tổng nợ hiện tại</div>
              <div className="text-base font-bold text-rose-400">
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
              className="text-xs border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/30"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Trả hết
            </Button>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">
              Số tiền thanh toán (VND) <span className="text-red-400">*</span>
            </label>
            <MoneyInput
              value={amount}
              onChangeValue={(val) => setAmount(val)}
              placeholder="0"
              className="bg-slate-950 border-slate-800 text-lg font-semibold"
            />
            {/* Quick amount buttons */}
            <div className="flex gap-2 pt-1">
              {[50000, 100000, 150000, 200000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  +{preset / 1000}k
                </button>
              ))}
            </div>
          </div>

          {/* Settlement Note */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Hình thức / Ghi chú</label>
            <Input
              placeholder="VD: Chuyển khoản VietQR, Tiền mặt..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-slate-950 border-slate-800"
            />
          </div>

          {/* Forgive Remainder Option */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <div className="text-sm font-medium text-slate-200">Miễn số nợ còn lại</div>
              <div className="text-xs text-slate-500">
                Xóa toàn bộ nợ cũ còn lại sau khi thanh toán số tiền này
              </div>
            </div>
            <button
              type="button"
              onClick={() => setForgiveRemainder(!forgiveRemainder)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                forgiveRemainder ? 'bg-amber-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  forgiveRemainder ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Post-settlement Preview */}
          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 flex items-center justify-between text-xs">
            <span className="text-slate-300">Nợ còn lại sau thanh toán:</span>
            <span
              className={`font-bold ${
                remainingAfterPayment === 0 ? 'text-emerald-400' : 'text-amber-400'
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
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Hủy
              </Button>
            </DrawerClose>
            <Button
              type="submit"
              disabled={isSubmitting || (amount <= 0 && !forgiveRemainder)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
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
