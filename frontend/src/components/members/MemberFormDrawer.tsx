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
      <DrawerContent className="max-h-[90vh] bg-surface border-t border-line text-fg shadow-2xl">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2 text-lg font-bold text-fg">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent border border-accent/30">
              <Users className="w-4 h-4" />
            </div>
            <span>{memberToEdit ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'}</span>
          </DrawerTitle>
          <DrawerDescription className="text-xs text-fg-muted">
            Lưu danh sách người chơi thường xuyên để chọn nhanh khi tính tiền sân.
          </DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="p-3 text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl">
              {errorMessage}
            </div>
          )}

          {/* Member Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-fg">
              Tên người chơi <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-fg-subtle" />
              <Input
                placeholder="VD: Nguyễn Văn Nam"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-9 bg-surface border-line"
                required
              />
            </div>
          </div>

          {/* Gender Selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-fg">Giới tính</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                  gender === 'male'
                    ? 'bg-info/10 border-info/30 text-info font-semibold shadow-xs'
                    : 'bg-raised border-line text-fg-muted hover:text-fg hover:border-line-strong'
                }`}
              >
                <User className="w-4 h-4 text-info" />
                <span>Nam</span>
                {gender === 'male' && <Check className="w-4 h-4 ml-auto text-info stroke-[2.5]" />}
              </button>

              <button
                type="button"
                onClick={() => setGender('female')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                  gender === 'female'
                    ? 'bg-female/10 border-female/30 text-female font-semibold shadow-xs'
                    : 'bg-raised border-line text-fg-muted hover:text-fg hover:border-line-strong'
                }`}
              >
                <UserCheck className="w-4 h-4 text-female" />
                <span>Nữ</span>
                {gender === 'female' && <Check className="w-4 h-4 ml-auto text-female stroke-[2.5]" />}
              </button>
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-fg">Số điện thoại (tùy chọn)</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-fg-subtle" />
              <Input
                placeholder="VD: 0901234567"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-9 bg-surface border-line"
              />
            </div>
          </div>

          {/* Default Note */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-fg">Ghi chú mặc định</label>
            <Input
              placeholder="VD: Chuyên đánh đôi, hay về sớm 30p..."
              value={defaultNote}
              onChange={(e) => setDefaultNote(e.target.value)}
              className="bg-surface border-line"
            />
          </div>

          {/* Active status toggle (when editing) */}
          {memberToEdit && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-raised border border-line">
              <div>
                <div className="text-sm font-medium text-fg">Đang hoạt động</div>
                <div className="text-xs text-fg-muted">
                  Thành viên sẽ hiển thị trong danh sách chọn nhanh khi bật
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  isActive ? 'bg-volt' : 'bg-line-strong'
                }`}
              >
                <div
                  className={`bg-surface w-4 h-4 rounded-full shadow-md transform transition-transform ${
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
                className="flex-1 border-line text-fg hover:bg-raised"
              >
                Hủy
              </Button>
            </DrawerClose>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 bg-volt hover:bg-volt-hover text-ink font-medium"
            >
              {isSubmitting ? 'Đang lưu...' : memberToEdit ? 'Cập nhật' : 'Thêm người chơi'}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
