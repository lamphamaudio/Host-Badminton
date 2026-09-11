import React, { useState } from 'react'
import { Building2, MapPin, Plus, Sparkles } from 'lucide-react'
import { VenueDrawer } from '@/components/courts/VenueDrawer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/money-input'
import { useVenues } from '@/hooks/useVenues'
import type { Venue, VenueCreate, VenueUpdate } from '@/lib/api'

interface CourtFeeSectionProps {
  courtFee: number
  onCourtFeeChange: (value: number) => void
  venueName: string
  onVenueNameChange: (value: string) => void
  courtNumber?: string
  onCourtNumberChange?: (value: string) => void
  selectedVenueId?: string | null
  onVenueSelect?: (venue: Venue | null) => void
}

const PRESET_FEES = [100000, 150000, 200000, 250000]

export const CourtFeeSection: React.FC<CourtFeeSectionProps> = ({
  courtFee,
  onCourtFeeChange,
  venueName,
  onVenueNameChange,
  courtNumber = '',
  onCourtNumberChange,
  selectedVenueId,
  onVenueSelect,
}) => {
  const { venues, addVenue } = useVenues()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleSelectVenue = (venueId: string) => {
    if (!venueId) {
      onVenueSelect?.(null)
      return
    }
    const venue = venues.find((v) => v.id === venueId)
    if (venue) {
      onVenueSelect?.(venue)
      onVenueNameChange(venue.name)
      if (venue.court_number) {
        onCourtNumberChange?.(venue.court_number)
      }
      if (venue.default_court_rate && venue.default_court_rate > 0) {
        onCourtFeeChange(venue.default_court_rate)
      }
    }
  }

  const handleQuickAddVenue = async (data: VenueCreate | VenueUpdate) => {
    const created = await addVenue(data as VenueCreate)
    onVenueSelect?.(created)
    onVenueNameChange(created.name)
    if (created.court_number) {
      onCourtNumberChange?.(created.court_number)
    }
    if (created.default_court_rate && created.default_court_rate > 0) {
      onCourtFeeChange(created.default_court_rate)
    }
  }

  return (
    <Card className="border-slate-800 bg-slate-900/90 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Building2 className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-bold text-white">Tiền thuê sân</CardTitle>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDrawerOpen(true)}
            className="h-7 px-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm sân mới</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Saved Venues Quick Select */}
        {venues.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Chọn từ sân đã lưu
            </label>
            <select
              value={selectedVenueId || ''}
              onChange={(e) => handleSelectVenue(e.target.value)}
              className="w-full h-9 rounded-xl bg-slate-950 border border-slate-800 px-3 text-xs text-slate-200 font-medium focus:border-emerald-500 focus:outline-none"
            >
              <option value="">-- Nhập tự do hoặc chọn sân --</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} {v.default_court_rate ? `(${v.default_court_rate.toLocaleString('vi-VN')} đ/h)` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Venue & Court Number */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-400">Tên sân / Địa điểm</label>
            <div className="relative">
              <Input
                value={venueName}
                onChange={(e) => onVenueNameChange(e.target.value)}
                placeholder="VD: Sân Kỳ Hòa"
                className="pl-8 text-xs font-medium"
              />
              <MapPin className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            </div>
          </div>
          <div className="col-span-1 space-y-1">
            <label className="text-xs font-semibold text-slate-400">Số sân</label>
            <div className="relative">
              <Input
                value={courtNumber}
                onChange={(e) => onCourtNumberChange?.(e.target.value)}
                placeholder="VD: Sân 3"
                className="text-center text-xs font-medium"
              />
            </div>
          </div>
        </div>

        {/* Court Fee Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">Tổng tiền sân (VND)</label>
          <MoneyInput
            value={courtFee}
            onChangeValue={onCourtFeeChange}
            quickIncrements={PRESET_FEES}
            placeholder="0"
          />
        </div>
      </CardContent>

      <VenueDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSave={handleQuickAddVenue}
      />
    </Card>
  )
}
