import React, { useEffect, useState } from 'react'
import {
  Building2,
  CheckCircle2,
  CreditCard,
  LogOut,
  Mail,
  Phone,
  QrCode,
  Save,
  ShieldAlert,
  Sparkles,
  User,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import {
  loadCalculatorState,
  saveCalculatorState,
} from '../../lib/storage'
import { VIETNAM_BANKS } from '../../lib/vietqr'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'

export const ProfileSettingsView: React.FC = () => {
  const { host, isAuthenticated, updateProfile, logout, openLoginModal } = useAuth()

  // Profile fields
  const [fullName, setFullName] = useState(host?.full_name || '')
  const [phone, setPhone] = useState(host?.phone || '')
  const [email, setEmail] = useState(host?.email || '')
  const [avatarUrl, setAvatarUrl] = useState(host?.avatar_url || '')

  // Banking fields
  const [bankBin, setBankBin] = useState(host?.bank_bin || '970422')
  const [bankAccountNumber, setBankAccountNumber] = useState(host?.bank_account_number || '')
  const [bankAccountName, setBankAccountName] = useState(host?.bank_account_name || '')

  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Sync state when host changes
  useEffect(() => {
    if (host) {
      setFullName(host.full_name || '')
      setPhone(host.phone || '')
      setEmail(host.email || '')
      setAvatarUrl(host.avatar_url || '')
      setBankBin(host.bank_bin || '970422')
      setBankAccountNumber(host.bank_account_number || '')
      setBankAccountName(host.bank_account_name || '')
    } else {
      // Fallback from localStorage calculator settings
      const saved = loadCalculatorState()
      if (saved.bankProfile) {
        setBankBin(saved.bankProfile.bankBin || '970422')
        setBankAccountNumber(saved.bankProfile.accountNumber || '')
        setBankAccountName(saved.bankProfile.accountName || '')
      }
    }
  }, [host])

  const selectedBank = VIETNAM_BANKS.find((b) => b.bin === bankBin) || VIETNAM_BANKS[0]

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveSuccess(false)

    try {
      const bankName = selectedBank ? selectedBank.shortName : ''

      if (isAuthenticated) {
        await updateProfile({
          full_name: fullName.trim() || 'Badminton Host',
          phone: phone.trim() || null,
          email: email.trim() || null,
          avatar_url: avatarUrl.trim() || null,
          bank_bin: bankBin,
          bank_name: bankName,
          bank_account_number: bankAccountNumber.trim(),
          bank_account_name: bankAccountName.trim().toUpperCase(),
        })
      }

      // Sync with local calculator storage as well
      const saved = loadCalculatorState()
      saveCalculatorState({
        ...saved,
        bankProfile: {
          ...saved.bankProfile,
          bankBin,
          accountNumber: bankAccountNumber.trim(),
          accountName: bankAccountName.trim().toUpperCase(),
        },
      })

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const getInitials = (name: string) => {
    if (!name) return 'HB'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Account Status Banner */}
      {!isAuthenticated ? (
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="text-sm font-bold text-amber-200">
                Bạn đang sử dụng ở chế độ Khách (Chưa đăng nhập)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Đăng nhập để lưu trữ vĩnh viễn các sân cầu lông, lịch sử trận đấu và đồng bộ giữa các thiết bị.
              </p>
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={openLoginModal}
                  className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Đăng nhập ngay
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Card className="border-slate-800 bg-slate-900/60 shadow-lg backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-emerald-500/40 shadow-inner">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={fullName} />
                ) : null}
                <AvatarFallback className="bg-emerald-950 text-emerald-400 text-lg font-bold">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-100 truncate">{fullName}</h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    Host
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {email || phone || 'Tài khoản Organizer'}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={logout}
                className="h-9 px-3 text-xs border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 rounded-xl"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" />
                Đăng xuất
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <Card className="border-slate-800 bg-slate-900/60 shadow-lg">
          <CardHeader className="pb-3 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-400" />
              <CardTitle className="text-base font-bold text-slate-100">
                Thông tin người tổ chức (Host)
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-400">
              Tên hiển thị và liên hệ của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Họ và tên hiển thị *
              </label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn A"
                className="h-11 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912 345 678"
                    className="h-11 pl-9 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 rounded-xl"
                  />
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Email
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="host@gmail.com"
                    className="h-11 pl-9 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 rounded-xl"
                  />
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* VietQR Bank Account Card */}
        <Card className="border-slate-800 bg-slate-900/60 shadow-lg">
          <CardHeader className="pb-3 border-b border-slate-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-emerald-400" />
                <CardTitle className="text-base font-bold text-slate-100">
                  Tài khoản nhận tiền VietQR mặc định
                </CardTitle>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                Tự động đồng bộ
              </span>
            </div>
            <CardDescription className="text-xs text-slate-400">
              Tài khoản này sẽ được tự động điền vào mã thanh toán VietQR cho mọi trận đấu
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Bank Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Ngân hàng thụ hưởng
              </label>
              <div className="relative">
                <select
                  value={bankBin}
                  onChange={(e) => setBankBin(e.target.value)}
                  className="w-full h-11 pl-9 pr-4 appearance-none rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                >
                  {VIETNAM_BANKS.map((b) => (
                    <option key={b.bin} value={b.bin} className="bg-slate-900 text-slate-100">
                      {b.shortName} - {b.name}
                    </option>
                  ))}
                </select>
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Account Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Số tài khoản nhận tiền
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="Ví dụ: 0912345678"
                  className="h-11 pl-9 font-mono bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 rounded-xl"
                />
                <CreditCard className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              </div>
            </div>

            {/* Account Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Tên chủ tài khoản (In hoa không dấu)
              </label>
              <Input
                type="text"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                placeholder="Ví dụ: NGUYEN VAN A"
                className="h-11 uppercase font-semibold bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 rounded-xl"
              />
            </div>

            {/* Preview Card */}
            {bankAccountNumber && bankAccountName && (
              <div className="rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 p-3.5 border border-emerald-500/20 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase text-emerald-400 tracking-wider">
                    {selectedBank.shortName}
                  </span>
                  <p className="font-mono text-sm font-bold text-slate-100">
                    {bankAccountNumber}
                  </p>
                  <p className="text-xs text-slate-300 uppercase font-semibold">
                    {bankAccountName}
                  </p>
                </div>
                <QrCode className="h-8 w-8 text-emerald-400 opacity-80" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-base shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              'Đang lưu...'
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Đã lưu thành công!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Lưu thay đổi
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
