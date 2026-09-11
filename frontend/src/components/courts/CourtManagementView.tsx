import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useVenues } from '@/hooks/useVenues'
import type { Venue, VenueCreate, VenueUpdate } from '@/lib/api'
import {
  Building2,
  Edit2,
  MapPin,
  Plus,
  Search,
  Tag,
  Trash2,
} from 'lucide-react'
import { VenueDrawer } from './VenueDrawer'

export const CourtManagementView: React.FC = () => {
  const { venues, isLoading, error, addVenue, editVenue, removeVenue } = useVenues(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [venueToEdit, setVenueToEdit] = useState<Venue | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredVenues = venues.filter((v) => {
    const q = searchQuery.toLowerCase()
    return (
      v.name.toLowerCase().includes(q) ||
      (v.address && v.address.toLowerCase().includes(q)) ||
      (v.court_number && v.court_number.toLowerCase().includes(q))
    )
  })

  const handleOpenCreate = () => {
    setVenueToEdit(null)
    setDrawerOpen(true)
  }

  const handleOpenEdit = (venue: Venue) => {
    setVenueToEdit(venue)
    setDrawerOpen(true)
  }

  const handleSaveVenue = async (data: VenueCreate | VenueUpdate) => {
    if (venueToEdit) {
      await editVenue(venueToEdit.id, data)
    } else {
      await addVenue(data as VenueCreate)
    }
  }

  const handleDeleteVenue = async (venue: Venue) => {
    if (window.confirm(`Bạn có chắc muốn xóa sân "${venue.name}" khỏi danh sách hoạt động?`)) {
      setDeletingId(venue.id)
      try {
        await removeVenue(venue.id)
      } finally {
        setDeletingId(null)
      }
    }
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header & Actions */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            Sân Cầu Lông
          </h1>
          <p className="text-xs text-zinc-400">
            Quản lý địa điểm và giá tiền sân mặc định
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-950/40"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm sân</span>
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
        <Input
          placeholder="Tìm kiếm sân theo tên, địa chỉ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-zinc-900/60 border-zinc-800"
        />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 text-sm text-red-400 bg-red-950/30 border border-red-900 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-zinc-900/50 border-zinc-800 animate-pulse">
              <CardContent className="p-4 h-24" />
            </Card>
          ))}
        </div>
      ) : filteredVenues.length === 0 ? (
        /* Empty State */
        <Card className="bg-zinc-900/40 border-zinc-800 border-dashed text-center p-8">
          <CardContent className="flex flex-col items-center justify-center space-y-3 p-0">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-200">
                {searchQuery ? 'Không tìm thấy sân phù hợp' : 'Chưa có sân nào được lưu'}
              </p>
              <p className="text-xs text-zinc-400 max-w-xs">
                {searchQuery
                  ? 'Thử tìm với từ khóa khác'
                  : 'Lưu các sân bạn hay tổ chức để tự động điền giá tiền khi chia bill.'}
              </p>
            </div>
            {!searchQuery && (
              <Button
                onClick={handleOpenCreate}
                variant="outline"
                className="mt-2 text-emerald-400 border-emerald-800/60 hover:bg-emerald-950/30"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Thêm sân đầu tiên
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Venue Cards List */
        <div className="space-y-3">
          {filteredVenues.map((venue) => (
            <Card
              key={venue.id}
              className="bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 transition-colors shadow-sm"
            >
              <CardContent className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-base text-zinc-100 flex items-center gap-2">
                      {venue.name}
                    </h3>
                    {venue.court_number && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                        <Tag className="w-3.5 h-3.5" />
                        <span>{venue.court_number}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEdit(venue)}
                      className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={deletingId === venue.id}
                      onClick={() => handleDeleteVenue(venue)}
                      className="h-8 w-8 p-0 text-zinc-400 hover:text-red-400 hover:bg-red-950/30"
                      title="Xóa sân"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {venue.address && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate">{venue.address}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Giá thuê mặc định:</span>
                  <span className="font-semibold text-zinc-200">
                    {venue.default_court_rate && venue.default_court_rate > 0
                      ? `${venue.default_court_rate.toLocaleString('vi-VN')} đ/giờ`
                      : 'Chưa đặt'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Drawer */}
      <VenueDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        venueToEdit={venueToEdit}
        onSave={handleSaveVenue}
      />
    </div>
  )
}
