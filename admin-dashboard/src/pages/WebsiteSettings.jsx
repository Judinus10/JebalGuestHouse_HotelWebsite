import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  Facebook,
  Globe2,
  KeyRound,
  Mail,
  MessageCircle,
  Phone,
  RotateCcw,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react'
import { PageHeader, SectionCard } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'

const MOCK_OTP = '123456'

const initialSettings = {
  phone: '+94 77 123 4567',
  reception_contact_number: '+94 21 222 4567',
  whatsapp_reservation_number: '+94 77 123 4567',
  email: 'reservations@guesthouse.com',
  facebook_link: 'https://facebook.com/guesthousevilla',
  instagram_link: 'https://instagram.com/guesthousevilla',
}

const initialAdmin = {
  admin_name: 'Hotel Administrator',
  admin_email: 'admin@guesthouse.com',
  current_password: '',
  new_password: '',
  confirm_password: '',
}

function Toast({ message, type = 'success', onClose }) {
  if (!message) return null

  const tone = type === 'error' ? 'border-red-200 text-red-700' : 'border-emerald-200 text-emerald-700'
  const iconTone = type === 'error' ? 'text-red-600' : 'text-emerald-600'

  return (
    <div className={`fixed right-4 top-4 z-50 flex max-w-sm items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm font-medium shadow-lg shadow-slate-200/70 ${tone}`}>
      <CheckCircle2 className={`h-5 w-5 ${iconTone}`} />
      <span>{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="ml-2 rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        Close
      </button>
    </div>
  )
}

function FormSection({ icon: Icon, title, description, children }) {
  return (
    <SectionCard>
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary-600">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </SectionCard>
  )
}

function FieldWithIcon({ icon: Icon, children }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      {children}
    </div>
  )
}

function OtpModal({ email, otp, error, onOtpChange, onVerify, onResend, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white shadow-2xl shadow-slate-900/20">
        <div className="flex items-start justify-between gap-4 border-b border-border p-6">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Verify Admin Email</h2>
            <p className="mt-1 text-sm text-text-secondary">Enter the OTP sent to your new email address.</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close OTP modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-text-secondary">
            Mock verification is enabled for frontend testing. Use OTP <span className="font-semibold text-primary-700">123456</span> for{' '}
            <span className="font-semibold text-text-primary">{email}</span>.
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin_otp">OTP Code</Label>
            <Input
              id="admin_otp"
              value={otp}
              onChange={(event) => onOtpChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              inputMode="numeric"
              maxLength={6}
              className="text-center text-lg font-semibold tracking-[0.35em]"
            />
            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border p-6 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="secondary" onClick={onResend}>
            Resend OTP
          </Button>
          <Button type="button" onClick={onVerify}>
            <ShieldCheck className="h-4 w-4" />
            Verify OTP
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function WebsiteSettings() {
  const [settings, setSettings] = useState(initialSettings)
  const [savedSettings, setSavedSettings] = useState(initialSettings)
  const [admin, setAdmin] = useState(initialAdmin)
  const [savedAdmin, setSavedAdmin] = useState(initialAdmin)
  const [pendingEmail, setPendingEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const hasWebsiteChanges = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(savedSettings),
    [settings, savedSettings]
  )

  const hasAdminChanges = useMemo(
    () => admin.admin_name !== savedAdmin.admin_name || admin.admin_email !== savedAdmin.admin_email,
    [admin.admin_name, admin.admin_email, savedAdmin.admin_name, savedAdmin.admin_email]
  )

  const updateSetting = (field, value) => {
    setSettings((current) => ({ ...current, [field]: value }))
  }

  const updateAdmin = (field, value) => {
    setAdmin((current) => ({ ...current, [field]: value }))
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    window.setTimeout(() => setToast({ message: '', type: 'success' }), 2500)
  }

  const handleWebsiteSubmit = (event) => {
    event.preventDefault()
    setSavedSettings(settings)
    showToast('Contact and social settings saved successfully.')
  }

  const handleWebsiteReset = () => {
    setSettings(savedSettings)
    showToast('Website contact changes have been reset.')
  }

  const handleAdminDetailsSave = (event) => {
    event.preventDefault()

    if (!admin.admin_name.trim()) {
      showToast('Admin name is required.', 'error')
      return
    }

    if (!admin.admin_email.trim()) {
      showToast('Admin email is required.', 'error')
      return
    }

    if (admin.admin_email !== savedAdmin.admin_email) {
      setPendingEmail(admin.admin_email)
      setOtp('')
      setOtpError('')
      return
    }

    setSavedAdmin((current) => ({ ...current, admin_name: admin.admin_name }))
    showToast('Admin details saved successfully.')
  }

  const verifyOtp = () => {
    if (otp !== MOCK_OTP) {
      setOtpError('Invalid OTP. Use mock OTP 123456.')
      return
    }

    setSavedAdmin((current) => ({ ...current, admin_name: admin.admin_name, admin_email: pendingEmail }))
    setAdmin((current) => ({ ...current, admin_email: pendingEmail }))
    setPendingEmail('')
    setOtp('')
    setOtpError('')
    showToast('Admin email verified and updated successfully.')
  }

  const resendOtp = () => {
    setOtpError('')
    showToast('Mock OTP resent. Use 123456.')
  }

  const cancelOtp = () => {
    setAdmin((current) => ({ ...current, admin_email: savedAdmin.admin_email }))
    setPendingEmail('')
    setOtp('')
    setOtpError('')
  }

  const handlePasswordChange = (event) => {
    event.preventDefault()
    setPasswordError('')

    if (!admin.current_password.trim()) {
      setPasswordError('Current password is required.')
      return
    }

    if (!admin.new_password.trim()) {
      setPasswordError('New password is required.')
      return
    }

    if (!admin.confirm_password.trim()) {
      setPasswordError('Confirm password is required.')
      return
    }

    if (admin.new_password.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }

    if (admin.new_password !== admin.confirm_password) {
      setPasswordError('New password and confirm password must match.')
      return
    }

    setAdmin((current) => ({ ...current, current_password: '', new_password: '', confirm_password: '' }))
    showToast('Password updated successfully in mock state.')
  }

  return (
    <div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      {pendingEmail && (
        <OtpModal
          email={pendingEmail}
          otp={otp}
          error={otpError}
          onOtpChange={setOtp}
          onVerify={verifyOtp}
          onResend={resendOtp}
          onCancel={cancelOtp}
        />
      )}

      <PageHeader
        title="Website Settings"
        description="Manage contact channels, social links, and admin account access for the guest house dashboard."
      />

      <div className="space-y-6">
        <form id="website-settings-form" onSubmit={handleWebsiteSubmit} className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <FormSection
              icon={Phone}
              title="Contact Details"
              description="Public contact numbers and reservation email shown on the website."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Main Phone</Label>
                  <FieldWithIcon icon={Phone}>
                    <Input
                      id="phone"
                      name="phone"
                      value={settings.phone}
                      onChange={(event) => updateSetting('phone', event.target.value)}
                      className="pl-9"
                      placeholder="+94 77 123 4567"
                      required
                    />
                  </FieldWithIcon>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reception_contact_number">Reception Contact Number</Label>
                  <FieldWithIcon icon={Phone}>
                    <Input
                      id="reception_contact_number"
                      name="reception_contact_number"
                      value={settings.reception_contact_number}
                      onChange={(event) => updateSetting('reception_contact_number', event.target.value)}
                      className="pl-9"
                      placeholder="+94 21 222 4567"
                      required
                    />
                  </FieldWithIcon>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_reservation_number">WhatsApp Reservation Number</Label>
                  <FieldWithIcon icon={MessageCircle}>
                    <Input
                      id="whatsapp_reservation_number"
                      name="whatsapp_reservation_number"
                      value={settings.whatsapp_reservation_number}
                      onChange={(event) => updateSetting('whatsapp_reservation_number', event.target.value)}
                      className="pl-9"
                      placeholder="+94 77 123 4567"
                      required
                    />
                  </FieldWithIcon>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <FieldWithIcon icon={Mail}>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={settings.email}
                      onChange={(event) => updateSetting('email', event.target.value)}
                      className="pl-9"
                      placeholder="reservations@guesthouse.com"
                      required
                    />
                  </FieldWithIcon>
                </div>
              </div>
            </FormSection>

            <FormSection
              icon={Globe2}
              title="Social Links"
              description="Public social links displayed on the guest house website."
            >
              <div className="space-y-2">
                <Label htmlFor="facebook_link">Facebook Link</Label>
                <FieldWithIcon icon={Facebook}>
                  <Input
                    id="facebook_link"
                    name="facebook_link"
                    type="url"
                    value={settings.facebook_link}
                    onChange={(event) => updateSetting('facebook_link', event.target.value)}
                    className="pl-9"
                    placeholder="https://facebook.com/guesthouse"
                  />
                </FieldWithIcon>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram_link">Instagram Link</Label>
                <FieldWithIcon icon={Globe2}>
                  <Input
                    id="instagram_link"
                    name="instagram_link"
                    type="url"
                    value={settings.instagram_link}
                    onChange={(event) => updateSetting('instagram_link', event.target.value)}
                    className="pl-9"
                    placeholder="https://instagram.com/guesthouse"
                  />
                </FieldWithIcon>
              </div>
            </FormSection>
          </div>

          <div className="flex flex-col-reverse gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm shadow-slate-200/60 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-secondary">
              {hasWebsiteChanges ? 'You have unsaved contact/social changes.' : 'Contact and social settings are saved locally.'}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={handleWebsiteReset} disabled={!hasWebsiteChanges}>
                <RotateCcw className="h-4 w-4" />
                Reset Changes
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4" />
                Save Settings
              </Button>
            </div>
          </div>
        </form>

        <SectionCard>
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary-600">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Admin Account Settings</h2>
              <p className="mt-1 text-sm text-text-secondary">Update dashboard administrator details and password using frontend mock validation.</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <form onSubmit={handleAdminDetailsSave} className="space-y-5 rounded-2xl border border-border bg-slate-50/60 p-5">
              <div>
                <h3 className="text-base font-semibold text-text-primary">Admin Details</h3>
                <p className="mt-1 text-sm text-text-secondary">Changing the admin email will open the mock OTP verification window.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_name">Admin Name</Label>
                <FieldWithIcon icon={UserRound}>
                  <Input
                    id="admin_name"
                    name="admin_name"
                    value={admin.admin_name}
                    onChange={(event) => updateAdmin('admin_name', event.target.value)}
                    className="pl-9"
                    placeholder="Hotel Administrator"
                    required
                  />
                </FieldWithIcon>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_email">Admin Email / Gmail</Label>
                <FieldWithIcon icon={Mail}>
                  <Input
                    id="admin_email"
                    name="admin_email"
                    type="email"
                    value={admin.admin_email}
                    onChange={(event) => updateAdmin('admin_email', event.target.value)}
                    className="pl-9"
                    placeholder="admin@gmail.com"
                    required
                  />
                </FieldWithIcon>
              </div>

              <Button type="submit" className="w-full sm:w-auto" disabled={!hasAdminChanges}>
                <Save className="h-4 w-4" />
                Save Admin Details
              </Button>
            </form>

            <form onSubmit={handlePasswordChange} className="space-y-5 rounded-2xl border border-border bg-slate-50/60 p-5">
              <div>
                <h3 className="text-base font-semibold text-text-primary">Change Password</h3>
                <p className="mt-1 text-sm text-text-secondary">Password update is frontend-only and does not call a backend.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_password">Current Password</Label>
                <FieldWithIcon icon={KeyRound}>
                  <Input
                    id="current_password"
                    name="current_password"
                    type="password"
                    value={admin.current_password}
                    onChange={(event) => updateAdmin('current_password', event.target.value)}
                    className="pl-9"
                    placeholder="Enter current password"
                  />
                </FieldWithIcon>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <FieldWithIcon icon={KeyRound}>
                    <Input
                      id="new_password"
                      name="new_password"
                      type="password"
                      value={admin.new_password}
                      onChange={(event) => updateAdmin('new_password', event.target.value)}
                      className="pl-9"
                      placeholder="Minimum 8 characters"
                    />
                  </FieldWithIcon>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <FieldWithIcon icon={KeyRound}>
                    <Input
                      id="confirm_password"
                      name="confirm_password"
                      type="password"
                      value={admin.confirm_password}
                      onChange={(event) => updateAdmin('confirm_password', event.target.value)}
                      className="pl-9"
                      placeholder="Re-enter new password"
                    />
                  </FieldWithIcon>
                </div>
              </div>

              {passwordError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{passwordError}</p>}

              <Button type="submit" className="w-full sm:w-auto">
                <KeyRound className="h-4 w-4" />
                Change Password
              </Button>
            </form>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
