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
import type { Venue, VenueCreate, VenueUpdate } from '@/lib/api'
import { Building2, MapPin, Tag } from 'lucide-react'

interface VenueDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  venueToEdit?: Venue | null
  onSave: (data: VenueCreate | VenueUpdate) => Promise<void>
}

export const VenueDrawer: React.FC<VenueDrawerProps> = ({
  open,
  onOpenChange,
  venueToEdit,
  onSave,
}) => {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [courtNumber, setCourtNumber] = useState('')
  const [defaultRate, setDefaultRate] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (venueToEdit) {
      setName(venueToEdit.name || '')
      setAddress(venueToEdit.address || '')
      setCourtNumber(venueToEdit.court_number || '')
      setDefaultRate(venueToEdit.default_court_rate || 0)
    } else {
      setName('')
      setAddress('')
      setCourtNumber('')
      setDefaultRate(0)
    }
    setErrorMessage(null)
  }, [venueToEdit, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMessage('Vui lòng nhập tên sân')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await onSave({
        name: name.trim(),
        address: address.trim() || null,
        court_number: courtNumber.trim() || null,
        default_court_rate: defaultRate > 0 ? defaultRate : null,
      })
      onOpenChange(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu thông tin sân'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2 text-lg font-bold">
            <Building2 className="w-5 h-5 text-emerald-400" />
            {venueToEdit ? 'Chỉnh sửa thông tin sân' : 'Thêm sân cầu lông mới'}
          </DrawerTitle>
          <DrawerDescription>
            Lưu thông tin sân quen thuộc để tự động điền tiền sân khi tính tiền.
          </DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="p-3 text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg">
              {errorMessage}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">
              Tên sân <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="VD: Sân Cầu Lông Kỳ Hòa"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">
              Vị trí / Số sân
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="VD: Sân 3, 4 hoặc Lầu 2"
                value={courtNumber}
                onChange={(e) => setCourtNumber(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">
              Địa chỉ
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="VD: 238 Ba Tháng Hai, P.12, Q.10"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">
              Giá thuê sân mặc định mỗi giờ (VND)
            </label>
            <MoneyInput
              value={defaultRate}
              onChangeValue={setDefaultRate}
              placeholder="0"
            />
            <p className="text-xs text-zinc-500">
              Giá này sẽ tự động điền vào máy tính khi bạn chọn sân.
            </p>
          </div>

          <DrawerFooter className="px-0 pt-4 flex flex-row gap-3">
            <DrawerClose asChild>
              <Button type="button" variant="outline" className="flex-1">
                Hủy
              </Button>
            </DrawerClose>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {isSubmitting ? 'Đang lưu...' : venueToEdit ? 'Cập nhật' : 'Lưu sân'}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
