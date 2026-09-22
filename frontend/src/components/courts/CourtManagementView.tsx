import React, { useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
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
      <PageHeader
        title="Sân bãi"
        description="Sân quen và giá thuê mặc định, chọn nhanh khi tính tiền."
        actions={
          <Button
            onClick={handleOpenCreate}
            className="h-11 min-h-[44px] bg-volt hover:bg-volt-hover text-ink font-semibold text-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm</span>
          </Button>
        }
      />

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-fg-subtle" />
        <Input
          placeholder="Tìm kiếm sân theo tên, địa chỉ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-surface border-line"
        />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl">
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-surface border-line animate-pulse shadow-sm">
              <CardContent className="p-4 h-24" />
            </Card>
          ))}
        </div>
      ) : filteredVenues.length === 0 ? (
        /* Empty State */
        <Card className="bg-raised border-line border-dashed text-center p-8">
          <CardContent className="flex flex-col items-center justify-center space-y-3 p-0">
            <div className="w-12 h-12 rounded-full bg-line-strong/70 flex items-center justify-center text-fg-muted">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-fg">
                {searchQuery ? 'Không tìm thấy sân phù hợp' : 'Chưa có sân nào được lưu'}
              </p>
              <p className="text-xs text-fg-muted max-w-xs">
                {searchQuery
                  ? 'Thử tìm với từ khóa khác'
                  : 'Lưu các sân bạn hay tổ chức để tự động điền giá tiền khi chia bill.'}
              </p>
            </div>
            {!searchQuery && (
              <Button
                onClick={handleOpenCreate}
                variant="outline"
                className="mt-2 text-fg border-line-strong hover:bg-raised"
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
              className="bg-surface border-line hover:border-line-strong transition-colors shadow-sm"
            >
              <CardContent className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-base text-fg flex items-center gap-2">
                      {venue.name}
                    </h3>
                    {venue.court_number && (
                      <div className="flex items-center gap-1.5 text-xs text-accent font-medium">
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
                      className="h-8 w-8 p-0 text-fg-muted hover:text-fg hover:bg-raised"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={deletingId === venue.id}
                      onClick={() => handleDeleteVenue(venue)}
                      className="h-8 w-8 p-0 text-fg-subtle hover:text-danger hover:bg-danger/10"
                      title="Xóa sân"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {venue.address && (
                  <div className="flex items-center gap-1.5 text-xs text-fg-muted">
                    <MapPin className="w-3.5 h-3.5 text-fg-subtle shrink-0" />
                    <span className="truncate">{venue.address}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-line flex items-center justify-between text-xs">
                  <span className="text-fg-muted">Giá thuê mặc định:</span>
                  <span className="font-semibold text-fg tabular-nums">
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
