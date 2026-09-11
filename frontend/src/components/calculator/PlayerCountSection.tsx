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
    <Card className="border-slate-800 bg-slate-900/90 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400">
              <Users className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-bold text-white">Số người tham gia</CardTitle>
          </div>
          <Badge variant="paid" size="default">
            Tổng: {totalCount} người
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Quick Pick Member Chips Section (AC-2) */}
        {activeMembers.length > 0 && onToggleMember && (
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
            <button
              type="button"
              onClick={() => setShowMemberChips(!showMemberChips)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">⚡ Chọn nhanh thành viên</span>
                {selectedCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-500/30">
                    Đã chọn {selectedCount}
                  </span>
                )}
              </div>
              {showMemberChips ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
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
                            ? 'bg-pink-500/20 border-pink-500 text-pink-200 shadow-sm'
                            : 'bg-sky-500/20 border-sky-500 text-sky-200 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          isFemale ? 'bg-pink-500/30 text-pink-300' : 'bg-sky-500/30 text-sky-300'
                        }`}
                      >
                        {isSelected ? <Check className="w-2.5 h-2.5" /> : member.name.charAt(0)}
                      </div>
                      <span>{member.name}</span>
                      {member.total_debt > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Còn nợ" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Male Counter */}
        <div className="flex items-center justify-between rounded-xl bg-slate-950/60 p-3 border border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
              <User className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Nam</div>
              <div className="text-[11px] text-slate-500">{maleCount} người</div>
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
        <div className="flex items-center justify-between rounded-xl bg-slate-950/60 p-3 border border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/10 text-pink-400">
              <UserCheck className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Nữ</div>
              <div className="text-[11px] text-slate-500">{femaleCount} người</div>
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
