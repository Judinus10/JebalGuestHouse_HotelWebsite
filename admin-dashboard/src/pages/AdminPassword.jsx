import { useState } from 'react'
import { CheckCircle2, KeyRound, ShieldCheck } from 'lucide-react'
import { PageHeader, SectionCard } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'

function Toast({ message, type = 'success', onClose }) {
  if (!message) return null

  const tone = type === 'error' ? 'border-red-200 text-red-700' : 'border-emerald-200 text-emerald-700'

  return (
    <div className={`fixed right-4 top-4 z-50 flex max-w-sm items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm font-medium shadow-lg ${tone}`}>
      <CheckCircle2 className="h-5 w-5" />
      <span>{message}</span>
      <button type="button" onClick={onClose} className="ml-2 text-xs text-slate-400 hover:text-slate-700">
        Close
      </button>
    </div>
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

export default function AdminPassword() {
  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  const [error, setError] = useState('')
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    window.setTimeout(() => setToast({ message: '', type: 'success' }), 2500)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')

    if (!form.current_password.trim()) {
      setError('Current password is required.')
      return
    }

    if (!form.new_password.trim()) {
      setError('New password is required.')
      return
    }

    if (form.new_password.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }

    if (form.new_password !== form.confirm_password) {
      setError('New password and confirm password must match.')
      return
    }

    setForm({
      current_password: '',
      new_password: '',
      confirm_password: '',
    })

    showToast('Password updated successfully.')
  }

  return (
    <div>
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      <PageHeader
        title="Admin Password"
        description="Change the dashboard administrator password."
      />

      <SectionCard>
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-primary-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Change Password</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Use a strong password with at least 8 characters.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
          <div className="space-y-2">
            <Label htmlFor="current_password">Current Password</Label>
            <FieldWithIcon icon={KeyRound}>
              <Input
                id="current_password"
                type="password"
                value={form.current_password}
                onChange={(event) => updateForm('current_password', event.target.value)}
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
                  type="password"
                  value={form.new_password}
                  onChange={(event) => updateForm('new_password', event.target.value)}
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
                  type="password"
                  value={form.confirm_password}
                  onChange={(event) => updateForm('confirm_password', event.target.value)}
                  className="pl-9"
                  placeholder="Re-enter new password"
                />
              </FieldWithIcon>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <Button type="submit">
            <KeyRound className="h-4 w-4" />
            Change Password
          </Button>
        </form>
      </SectionCard>
    </div>
  )
}