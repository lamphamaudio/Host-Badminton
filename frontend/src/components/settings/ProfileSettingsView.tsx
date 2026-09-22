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
  Smartphone,
  Sun,
  SunMoon,
  Moon,
  User,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import {
  loadCalculatorState,
  saveCalculatorState,
} from '../../lib/storage'
import { useTheme } from '../../lib/theme'
import { VIETNAM_BANKS } from '../../lib/vietqr'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'

export const ProfileSettingsView: React.FC = () => {
  const { host, isAuthenticated, updateProfile, logout, openLoginModal } = useAuth()
  const { preference: themePreference, setPreference: setThemePreference } = useTheme()

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
        <div className="rounded-2xl bg-warn/10 border border-warn/30 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warn/10 text-warn">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="text-sm font-bold text-warn">
                Bạn đang sử dụng ở chế độ Khách (Chưa đăng nhập)
              </h3>
              <p className="text-xs text-warn leading-relaxed">
                Đăng nhập để lưu trữ vĩnh viễn các sân cầu lông, lịch sử trận đấu và đồng bộ giữa các thiết bị.
              </p>
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={openLoginModal}
                  className="h-9 px-4 bg-volt hover:bg-volt-hover text-ink text-xs font-semibold rounded-lg shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-ink" />
                  Đăng nhập ngay
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Card className="border-line bg-surface shadow-xs">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 shrink-0 border border-line">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={fullName} />
                ) : null}
                <AvatarFallback className="bg-volt text-ink text-lg font-bold">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
                  <CheckCircle2 className="w-3 h-3" />
                  Chủ sân
                </span>
                <h2 className="mt-0.5 text-lg font-extrabold leading-tight tracking-tight text-fg break-words">
                  {fullName}
                </h2>
                <p className="mt-0.5 text-xs text-fg-muted truncate">
                  {email || phone || 'Tài khoản chủ sân'}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={logout}
                aria-label="Đăng xuất"
                title="Đăng xuất"
                className="h-11 w-11 min-h-[44px] shrink-0 p-0 border-line text-fg-muted hover:text-danger hover:bg-danger/10 rounded-xl"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appearance */}
      <Card className="border-line bg-surface shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent border border-accent/30">
              <SunMoon className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-bold text-fg">Giao diện</CardTitle>
          </div>
          <CardDescription className="text-xs text-fg-muted">
            Nền tối dễ nhìn trong nhà thi đấu, nền sáng rõ hơn dưới nắng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            role="radiogroup"
            aria-label="Chế độ giao diện"
            className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-raised p-1"
          >
            {(
              [
                ['dark', 'Tối', Moon],
                ['light', 'Sáng', Sun],
                ['system', 'Theo máy', Smartphone],
              ] as const
            ).map(([value, label, Icon]) => {
              const selected = themePreference === value
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setThemePreference(value)}
                  className={`flex min-h-[44px] items-center justify-center gap-1 whitespace-nowrap rounded-lg px-1 text-[13px] font-semibold transition-colors cursor-pointer ${
                    selected ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {label}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <Card className="border-line bg-surface shadow-xs">
          <CardHeader className="pb-3 border-b border-line">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent border border-accent/30">
                <User className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-bold text-fg">Thông tin của bạn</CardTitle>
            </div>
            <CardDescription className="text-xs text-fg-muted">
              Tên hiển thị và liên hệ của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                Họ và tên hiển thị *
              </label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn A"
                className="h-11 bg-surface border-line text-fg rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-fg">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912 345 678"
                    className="h-11 pl-9 bg-surface border-line text-fg rounded-xl"
                  />
                  <Phone className="absolute left-3 top-3.5 h-4 w-4 text-fg-subtle" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-fg">
                  Email
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="host@gmail.com"
                    className="h-11 pl-9 bg-surface border-line text-fg rounded-xl"
                  />
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-fg-subtle" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* VietQR Bank Account Card */}
        <Card className="border-line bg-surface shadow-xs">
          <CardHeader className="pb-3 border-b border-line">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent border border-accent/30">
                <QrCode className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-bold text-fg">Tài khoản nhận tiền</CardTitle>
            </div>
            <CardDescription className="text-xs text-fg-muted">
              Ngân hàng và số tài khoản lưu trên hồ sơ của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Bank Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                Ngân hàng thụ hưởng
              </label>
              <div className="relative">
                <select
                  value={bankBin}
                  onChange={(e) => setBankBin(e.target.value)}
                  className="w-full h-11 pl-9 pr-4 appearance-none rounded-xl bg-raised border border-line text-fg text-sm focus:outline-none focus:border-accent focus:bg-raised"
                >
                  {VIETNAM_BANKS.map((b) => (
                    <option key={b.bin} value={b.bin} className="bg-surface text-fg">
                      {b.shortName} - {b.name}
                    </option>
                  ))}
                </select>
                <Building2 className="absolute left-3 top-3.5 h-4 w-4 text-fg-subtle pointer-events-none" />
              </div>
            </div>

            {/* Account Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                Số tài khoản nhận tiền
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="Ví dụ: 0912345678"
                  className="h-11 pl-9 font-mono bg-surface border-line text-fg rounded-xl"
                />
                <CreditCard className="absolute left-3 top-3.5 h-4 w-4 text-fg-subtle" />
              </div>
            </div>

            {/* Account Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                Tên chủ tài khoản (In hoa không dấu)
              </label>
              <Input
                type="text"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                placeholder="Ví dụ: NGUYEN VAN A"
                className="h-11 uppercase font-semibold bg-surface border-line text-fg rounded-xl"
              />
            </div>

            {/* Preview Card */}
            {bankAccountNumber && bankAccountName && (
              <div className="rounded-xl bg-raised p-3.5 border border-line flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase text-accent tracking-wider">
                    {selectedBank.shortName}
                  </span>
                  <p className="font-mono text-sm font-bold text-fg">
                    {bankAccountNumber}
                  </p>
                  <p className="text-xs text-fg-muted uppercase font-semibold">
                    {bankAccountName}
                  </p>
                </div>
                <QrCode className="h-8 w-8 text-fg opacity-80" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="w-full h-12 bg-volt hover:bg-volt-hover text-ink font-semibold rounded-xl text-base shadow-sm flex items-center justify-center gap-2"
          >
            {isSaving ? (
              'Đang lưu...'
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-ink" />
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
