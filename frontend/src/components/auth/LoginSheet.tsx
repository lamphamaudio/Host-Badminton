import React, { useEffect, useState } from 'react'
import { CheckCircle2, KeyRound, Loader2, Phone, ShieldCheck, Sparkles } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet'

interface LoginSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const LoginSheet: React.FC<LoginSheetProps> = ({ open, onOpenChange }) => {
  const { loginWithGoogle, sendPhoneOTP, verifyPhoneOTP, isLoading } = useAuth()

  const [activeTab, setActiveTab] = useState<'google' | 'phone'>('google')
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 60-second cooldown timer countdown
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  // Reset state on open/close
  useEffect(() => {
    if (!open) {
      setErrorMessage(null)
      setOtpCode('')
      setOtpSent(false)
    }
  }, [open])

  const handleGoogleLogin = async () => {
    setErrorMessage(null)
    setIsSubmitting(true)
    try {
      // In web development mode, we use mock google credentials
      // In production, this receives the credential from Google One Tap or Google Sign-In SDK
      const mockGoogleToken = `mock-google-token-host-${Date.now().toString().slice(-4)}`
      await loginWithGoogle(mockGoogleToken)
      onOpenChange(false)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Đăng nhập Google thất bại')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMessage(null)

    const cleanedPhone = phone.trim().replace(/[\s\-\.]/g, '')
    if (!cleanedPhone || cleanedPhone.length < 9) {
      setErrorMessage('Vui lòng nhập số điện thoại hợp lệ (10 số)')
      return
    }

    setIsSubmitting(true)
    try {
      await sendPhoneOTP(cleanedPhone)
      setOtpSent(true)
      setCountdown(60)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Không thể gửi mã OTP')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const cleanedPhone = phone.trim().replace(/[\s\-\.]/g, '')
    const cleanedCode = otpCode.trim()

    if (!cleanedCode || cleanedCode.length < 4) {
      setErrorMessage('Vui lòng nhập đầy đủ mã OTP')
      return
    }

    setIsSubmitting(true)
    try {
      await verifyPhoneOTP(cleanedPhone, cleanedCode)
      onOpenChange(false)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Mã OTP không chính xác hoặc đã hết hạn')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto px-4 pb-8 pt-6 sm:max-w-md sm:mx-auto rounded-t-3xl border-t border-line bg-surface text-fg shadow-2xl">
        <SheetHeader className="text-center pb-4 border-b border-line">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 border border-accent/30 text-accent">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <SheetTitle className="text-xl font-bold text-fg">
            Đăng nhập Host Badminton
          </SheetTitle>
          <SheetDescription className="text-sm text-fg-muted">
            Lưu trữ danh sách sân, lịch sử chia tiền và đồng bộ thông tin nhận tiền VietQR
          </SheetDescription>
        </SheetHeader>

        {/* Tab Switcher */}
        <div className="mt-4 flex rounded-xl bg-raised p-1 border border-line">
          <button
            type="button"
            onClick={() => {
              setActiveTab('google')
              setErrorMessage(null)
            }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'google'
                ? 'bg-surface text-fg shadow-xs'
                : 'text-fg-muted hover:text-fg'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('phone')
              setErrorMessage(null)
            }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'phone'
                ? 'bg-surface text-fg shadow-xs'
                : 'text-fg-muted hover:text-fg'
            }`}
          >
            <Phone className="w-4 h-4 text-accent" />
            Số điện thoại
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 rounded-lg bg-danger/10 border border-danger/30 p-3 text-xs text-danger font-medium">
            {errorMessage}
          </div>
        )}

        {/* Tab 1: Google OAuth */}
        {activeTab === 'google' && (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl bg-raised p-4 border border-line text-center">
              <p className="text-sm text-fg">
                Đăng nhập nhanh chỉ với 1 chạm thông qua tài khoản Google.
              </p>
              <div className="mt-2 flex items-center justify-center gap-2 text-xs text-accent font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tự động chuyển dữ liệu khách cũ vào tài khoản</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting || isLoading}
              className="w-full h-12 bg-surface text-fg hover:bg-raised border border-line-strong font-semibold rounded-xl text-base flex items-center justify-center gap-3 shadow-xs"
            >
              {isSubmitting || isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-fg" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Tiếp tục với Google
                </>
              )}
            </Button>
          </div>
        )}

        {/* Tab 2: Phone OTP */}
        {activeTab === 'phone' && (
          <div className="mt-5 space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">
                    Số điện thoại di động (Việt Nam)
                  </label>
                  <div className="relative">
                    <Input
                      type="tel"
                      placeholder="0912 345 678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-12 pl-10 text-base bg-surface border-line text-fg rounded-xl"
                      autoFocus
                    />
                    <Phone className="absolute left-3.5 top-3.5 h-5 w-5 text-fg-subtle" />
                  </div>
                  <p className="text-[11px] text-fg-muted">
                    Hỗ trợ các đầu số 03, 05, 07, 08, 09 (10 số).
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || isLoading || !phone.trim()}
                  className="w-full h-12 bg-volt hover:bg-volt-hover text-ink font-semibold rounded-xl text-base shadow-sm"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Gửi mã xác thực OTP'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-raised p-3 border border-line">
                  <div className="text-xs text-fg-muted">
                    Đã gửi mã đến: <span className="font-semibold text-fg">{phone}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false)
                      setOtpCode('')
                    }}
                    className="text-xs font-medium text-accent hover:underline cursor-pointer"
                  >
                    Đổi số
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">
                    Mã xác thực OTP (6 chữ số)
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="h-12 pl-10 text-lg tracking-widest font-mono font-bold bg-surface border-line text-fg rounded-xl"
                      autoFocus
                    />
                    <KeyRound className="absolute left-3.5 top-3.5 h-5 w-5 text-fg-subtle" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-fg-muted">Chưa nhận được mã?</span>
                  <button
                    type="button"
                    disabled={countdown > 0 || isSubmitting}
                    onClick={() => handleSendOTP()}
                    className={`font-semibold cursor-pointer ${
                      countdown > 0
                        ? 'text-fg-subtle cursor-not-allowed'
                        : 'text-accent hover:underline'
                    }`}
                  >
                    {countdown > 0 ? `Gửi lại sau (${countdown}s)` : 'Gửi lại mã'}
                  </button>
                </div>

                {/* Dev hint */}
                <div className="rounded-lg bg-raised p-2.5 border border-line text-[11px] text-fg-muted flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                  <span>Mẹo: Trong môi trường thử nghiệm, bạn có thể nhập mã <strong>123456</strong>.</span>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || isLoading || otpCode.length < 4}
                  className="w-full h-12 bg-volt hover:bg-volt-hover text-ink font-semibold rounded-xl text-base shadow-sm"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Xác nhận & Đăng nhập'
                  )}
                </Button>
              </form>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
