import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Stepper } from '@/components/ui/stepper'
import type { Member } from '@/lib/api'
import { Check, ChevronDown, ChevronUp, User, UserCheck, Users } from 'lucide-react'

interface PlayerCountSectionProps {
  maleCount: number
  onMaleCountChange: (val: number) => void
  femaleCount: number
  onFemaleCountChange: (val: number) => void
  availableMembers?: Member[]
  selectedMemberIds?: string[]
  onToggleMember?: (member: Member) => void
}

export const PlayerCountSection: React.FC<PlayerCountSectionProps> = ({
  maleCount,
  onMaleCountChange,
  femaleCount,
  onFemaleCountChange,
  availableMembers = [],
  selectedMemberIds = [],
  onToggleMember,
}) => {
  const totalCount = maleCount + femaleCount
  const [showMemberChips, setShowMemberChips] = useState<boolean>(true)

  const activeMembers = availableMembers.filter((m) => m.is_active)
  const selectedCount = selectedMemberIds.length

  return (
    <Card className="border-line bg-surface shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent border border-accent/30">
              <Users className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-bold text-fg">Số người tham gia</CardTitle>
          </div>
          <Badge variant="paid" size="default">
            Tổng: {totalCount} người
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Quick Pick Member Chips Section (AC-2) */}
        {activeMembers.length > 0 && onToggleMember && (
          <div className="p-3 rounded-xl bg-raised/90 border border-line space-y-2.5">
            <button
              type="button"
              onClick={() => setShowMemberChips(!showMemberChips)}
              className="w-full flex items-center justify-between text-xs font-semibold text-fg hover:text-fg transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-accent font-bold">⚡ Chọn nhanh thành viên</span>
                {selectedCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-semibold">
                    Đã chọn {selectedCount}
                  </span>
                )}
              </div>
              {showMemberChips ? (
                <ChevronUp className="w-4 h-4 text-fg-subtle" />
              ) : (
                <ChevronDown className="w-4 h-4 text-fg-subtle" />
              )}
            </button>

            {showMemberChips && (
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1 pr-1">
                {activeMembers.map((member) => {
                  const isSelected = selectedMemberIds.includes(member.id)
                  const isFemale = member.gender === 'female'

                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => onToggleMember(member)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium min-h-[36px] transition-all select-none cursor-pointer border ${
                        isSelected
                          ? isFemale
                            ? 'bg-female/10 border-female/30 text-female font-semibold shadow-xs'
                            : 'bg-info/10 border-info/30 text-info font-semibold shadow-xs'
                          : 'bg-surface border-line text-fg-muted hover:text-fg hover:border-line-strong'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          isFemale ? 'bg-female/10 text-female' : 'bg-info/10 text-info'
                        }`}
                      >
                        {isSelected ? <Check className="w-2.5 h-2.5 stroke-[2.5]" /> : member.name.charAt(0)}
                      </div>
                      <span>{member.name}</span>
                      {member.total_debt > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-danger" title="Còn nợ" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Male Counter */}
        <div className="flex items-center justify-between rounded-xl bg-raised/80 p-3 border border-line">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-info/10 text-info border border-info/30">
              <User className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-fg">Nam</div>
              <div className="text-[11px] text-fg-muted">{maleCount} người</div>
            </div>
          </div>
          <Stepper
            value={maleCount}
            onChangeValue={onMaleCountChange}
            min={0}
            max={30}
            step={1}
            size="default"
          />
        </div>

        {/* Female Counter */}
        <div className="flex items-center justify-between rounded-xl bg-raised/80 p-3 border border-line">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-female/10 text-female border border-female/30">
              <UserCheck className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-fg">Nữ</div>
              <div className="text-[11px] text-fg-muted">{femaleCount} người</div>
            </div>
          </div>
          <Stepper
            value={femaleCount}
            onChangeValue={onFemaleCountChange}
            min={0}
            max={30}
            step={1}
            size="default"
          />
        </div>
      </CardContent>
    </Card>
  )
}
