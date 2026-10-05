import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Phone, Mail, Globe, LogOut, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import PageLayout, { SectionTitle } from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'
import type { Profile } from '@/types'

export default function ProfilePage() {
  const { profile, setProfile, logout } = useAuthStore()
  const { addToast } = useUiStore()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState(profile?.fullName ?? '')
  const [language, setLanguage] = useState(profile?.preferredLanguage ?? 'en')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await api.patch<Profile>('/me', { fullName, preferredLanguage: language })
      setProfile(updated)
      addToast({ type: 'success', message: 'Profile updated.' })
    } catch {
      addToast({ type: 'error', message: 'Could not update profile.' })
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    navigate('/login')
  }

  return (
    <PageLayout maxWidth="lg">
      <SectionTitle description="Manage your account details">
        Profile
      </SectionTitle>

      <div className="flex flex-col gap-5">
        {/* Avatar section */}
        <div className="surface-card-primary p-6 flex items-center gap-4">
          <Avatar name={profile?.fullName ?? profile?.email ?? 'U'} size="xl" />
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg text-ink">{profile?.fullName ?? 'Your Name'}</h2>
            <p className="text-sm text-ink-secondary">{profile?.role}</p>
            <p className="text-xs text-ink-tertiary mt-0.5">
              {profile?.email ?? profile?.phoneNumber ?? ''}
            </p>
          </div>
        </div>

        {/* Edit fields */}
        <div className="surface-card-primary p-6 flex flex-col gap-4">
          <h3 className="font-semibold text-base text-ink">Personal Information</h3>

          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            icon={<User size={15} />}
            placeholder="Your full name"
          />

          {profile?.email && (
            <Input
              label="Email"
              value={profile.email}
              disabled
              icon={<Mail size={15} />}
            />
          )}

          {profile?.phoneNumber && (
            <Input
              label="Phone"
              value={profile.phoneNumber}
              disabled
              icon={<Phone size={15} />}
            />
          )}

          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-1.5">
              Language
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-tertiary">
                <Globe size={15} />
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="input-field pl-10 appearance-none"
              >
                <option value="en">English</option>
                <option value="ceb">Bisaya / Cebuano</option>
              </select>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            loading={saving}
            onClick={handleSave}
            icon={<Save size={15} />}
          >
            Save Changes
          </Button>
        </div>

        {/* Sign out */}
        <Button
          variant="ghost"
          size="md"
          onClick={handleLogout}
          icon={<LogOut size={15} />}
          className="text-red-600 hover:bg-red-50 self-start"
        >
          Sign Out
        </Button>
      </div>
    </PageLayout>
  )
}
