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
import type { Member, MemberCreate, MemberUpdate } from '@/lib/api'
import { Check, Phone, User, UserCheck, Users } from 'lucide-react'

interface MemberFormDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memberToEdit?: Member | null
  onSave: (data: MemberCreate | MemberUpdate) => Promise<void>
}

export const MemberFormDrawer: React.FC<MemberFormDrawerProps> = ({
  open,
  onOpenChange,
  memberToEdit,
  onSave,
}) => {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [defaultNote, setDefaultNote] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (memberToEdit) {
      setName(memberToEdit.name || '')
      setPhone(memberToEdit.phone || '')
      setGender(memberToEdit.gender || 'male')
      setDefaultNote(memberToEdit.default_note || '')
      setIsActive(memberToEdit.is_active ?? true)
    } else {
      setName('')
      setPhone('')
      setGender('male')
      setDefaultNote('')
      setIsActive(true)
    }
    setErrorMessage(null)
  }, [memberToEdit, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMessage('Vui lòng nhập tên thành viên')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await onSave({
        name: name.trim(),
        phone: phone.trim() || null,
        gender,
        default_note: defaultNote.trim() || null,
        is_active: isActive,
      })
      onOpenChange(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu thông tin thành viên'
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
            <Users className="w-5 h-5 text-emerald-400" />
            {memberToEdit ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'}
          </DrawerTitle>
          <DrawerDescription className="text-xs text-slate-400">
            Lưu danh sách người chơi thường xuyên để chọn nhanh khi tính tiền sân.
          </DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="p-3 text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg">
              {errorMessage}
            </div>
          )}

          {/* Member Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">
              Tên người chơi <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <Input
                placeholder="VD: Nguyễn Văn Nam"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-9 bg-slate-950 border-slate-800"
                required
              />
            </div>
          </div>

          {/* Gender Selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Giới tính</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                  gender === 'male'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-4 h-4 text-sky-400" />
                <span>Nam</span>
                {gender === 'male' && <Check className="w-4 h-4 ml-auto text-sky-400" />}
              </button>

              <button
                type="button"
                onClick={() => setGender('female')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                  gender === 'female'
                    ? 'bg-pink-500/20 border-pink-500 text-pink-300 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserCheck className="w-4 h-4 text-pink-400" />
                <span>Nữ</span>
                {gender === 'female' && <Check className="w-4 h-4 ml-auto text-pink-400" />}
              </button>
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Số điện thoại (tùy chọn)</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <Input
                placeholder="VD: 0901234567"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-9 bg-slate-950 border-slate-800"
              />
            </div>
          </div>

          {/* Default Note */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Ghi chú mặc định</label>
            <Input
              placeholder="VD: Chuyên đánh đôi, hay về sớm 30p..."
              value={defaultNote}
              onChange={(e) => setDefaultNote(e.target.value)}
              className="bg-slate-950 border-slate-800"
            />
          </div>

          {/* Active status toggle (when editing) */}
          {memberToEdit && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <div className="text-sm font-medium text-slate-200">Đang hoạt động</div>
                <div className="text-xs text-slate-500">
                  Thành viên sẽ hiển thị trong danh sách chọn nhanh khi bật
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  isActive ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

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
              disabled={isSubmitting || !name.trim()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            >
              {isSubmitting ? 'Đang lưu...' : memberToEdit ? 'Cập nhật' : 'Thêm người chơi'}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
