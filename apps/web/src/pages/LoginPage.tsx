import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, Mail, ArrowRight, Wifi, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import Button from '@/components/ui/Button'
import type { Profile } from '@/types'

type AuthMode = 'phone' | 'email'

function PhoneOtpFlow({ onSuccess }: { onSuccess: () => void }) {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const { addToast } = useUiStore()

  const sendOtp = async () => {
    if (!phone.trim()) return
    setLoading(true)
    try {
      const formatted = phone.startsWith('+') ? phone : `+63${phone.replace(/^0/, '')}`
      const { error } = await supabase.auth.signInWithOtp({ phone: formatted })
      if (error) throw error
      setStep('otp')
      addToast({ type: 'success', message: 'OTP sent to your phone.' })
    } catch (err) {
      addToast({ type: 'error', message: 'Could not send OTP. Check the number.' })
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    if (!otp.trim()) return
    setLoading(true)
    try {
      const formatted = phone.startsWith('+') ? phone : `+63${phone.replace(/^0/, '')}`
      const { error } = await supabase.auth.verifyOtp({ phone: formatted, token: otp, type: 'sms' })
      if (error) throw error
      onSuccess()
    } catch {
      addToast({ type: 'error', message: 'Invalid OTP. Try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (step === 'otp') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink-secondary mb-1.5">
            Enter the 6-digit code sent to {phone}
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            className="input-field text-center text-xl tracking-widest font-semibold"
            autoFocus
          />
        </div>
        <Button variant="primary" size="lg" fullWidth loading={loading} onClick={verifyOtp}
          icon={<ArrowRight size={18} />}>
          Verify Code
        </Button>
        <button
          onClick={() => setStep('phone')}
          className="text-sm text-ink-tertiary hover:text-ink-secondary transition-colors w-full text-center"
        >
          Use a different number
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink-secondary mb-1.5">
          Phone Number
        </label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <Phone size={15} className="text-ink-tertiary" />
            <span className="text-sm text-ink-tertiary">+63</span>
          </div>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="9XXXXXXXXX"
            className="input-field pl-16"
            onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
          />
        </div>
      </div>
      <Button variant="primary" size="lg" fullWidth loading={loading} onClick={sendOtp}
        icon={<ArrowRight size={18} />}>
        Send OTP
      </Button>
    </div>
  )
}

function EmailFlow({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { addToast } = useUiStore()

  const sendLink = async () => {
    if (!email.trim()) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) throw error
      setSent(true)
    } catch {
      addToast({ type: 'error', message: 'Could not send magic link. Try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center py-6 space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto">
          <Mail size={24} className="text-primary-500" />
        </div>
        <p className="font-semibold text-ink">Check your email</p>
        <p className="text-sm text-ink-secondary">
          We sent a magic link to <strong>{email}</strong>. Click it to sign in.
        </p>
        <button
          onClick={() => setSent(false)}
          className="text-sm text-ink-tertiary hover:text-ink-secondary transition-colors"
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink-secondary mb-1.5">Email</label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-tertiary">
            <Mail size={15} />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input-field pl-10"
            onKeyDown={(e) => e.key === 'Enter' && sendLink()}
          />
        </div>
      </div>
      <Button variant="primary" size="lg" fullWidth loading={loading} onClick={sendLink}
        icon={<ArrowRight size={18} />}>
        Send Magic Link
      </Button>
    </div>
  )
}

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('phone')
  const navigate = useNavigate()
  const { setProfile, setToken } = useAuthStore()
  const { addToast } = useUiStore()

  const handleAuthSuccess = async () => {
    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) return

      setToken(data.session.access_token)

      // Sync profile with backend
      const profile = await api.post<Profile>('/auth/sync')
      setProfile(profile)

      // Route by role
      switch (profile.role) {
        case 'DRIVER':     navigate('/driver'); break
        case 'DISPATCHER': navigate('/dispatch'); break
        case 'ADMIN':      navigate('/admin'); break
        default:           navigate('/app'); break
      }
    } catch {
      addToast({ type: 'error', message: 'Could not load your profile. Try again.' })
    }
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4">
      {/* Card */}
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-3xl gradient-teal flex items-center justify-center shadow-frost-lg mb-4">
            <Wifi size={28} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="font-display font-bold text-2xl text-ink">Bao Bao</h1>
          <p className="text-sm text-ink-secondary mt-1">Community transport · Talibon, Bohol</p>
        </div>

        {/* Auth card */}
        <div className="surface-card-primary p-6">
          <h2 className="font-display font-semibold text-lg text-ink mb-1">Sign in</h2>
          <p className="text-sm text-ink-secondary mb-5">
            Use your phone number or email to continue
          </p>

          {/* Mode tabs */}
          <div className="flex gap-1 p-1 bg-surface-subtle rounded-xl mb-5">
            {([['phone', 'Phone OTP'], ['email', 'Email link']] as const).map(([m, label]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                  mode === m ? 'bg-white text-ink shadow-card' : 'text-ink-secondary'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === 'phone'
            ? <PhoneOtpFlow onSuccess={handleAuthSuccess} />
            : <EmailFlow onSuccess={handleAuthSuccess} />
          }
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-ink-tertiary mt-6 leading-relaxed">
          By signing in you agree to our terms of service.<br />
          Bao Bao is a community transport platform for Talibon.
        </p>
      </div>
    </div>
  )
}
