import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Building2, CheckCircle2, Edit3, ExternalLink, Link2, Loader2, Mail, Plus, Save, Send, Server, Settings2, ShieldCheck, Trash2, X } from 'lucide-react'
import { PageHeader, SectionCard } from '@/components/ui/page-header'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Input, Label } from '@/components/ui/input'
import { deleteMailAccount, fetchMailSettings, saveMailAccount, saveMailRoutes, testMailAccount, toggleMailAccount } from '@/services/mailSettingsApi'
import { deleteBusinessLink, fetchBusinessLinks, saveBusinessLink, toggleBusinessLink } from '@/services/businessLinksApi'

const emptyAccount = {
  id: 0,
  account_name: '',
  provider: 'office365',
  email_address: '',
  smtp_username: '',
  password: '',
  from_name: 'Jebal Guest House',
  smtp_host: 'smtp.office365.com',
  smtp_port: 587,
  smtp_encryption: 'tls',
  functions: [],
}

const emptyBusinessLink = { id: 0, title: '', description: '', portal_url: 'https://', category: 'other', is_enabled: true, is_system: false }

function Toast({ toast, close }) {
  if (!toast.message) return null
  const error = toast.type === 'error'
  const Icon = error ? AlertCircle : CheckCircle2
  return (
    <div className={`fixed right-4 top-4 z-[80] flex w-[calc(100%-2rem)] max-w-md items-start gap-3 rounded-xl border bg-white p-4 shadow-2xl ${error ? 'border-red-200 text-red-700' : 'border-emerald-200 text-emerald-700'}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <span className="flex-1 text-sm font-medium">{toast.message}</span>
      <button type="button" onClick={close}><X className="h-4 w-4" /></button>
    </div>
  )
}

function StatusBadge({ account }) {
  const connected = account.connection_status === 'connected' && account.is_enabled
  const failed = account.connection_status === 'failed'
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${connected ? 'bg-emerald-50 text-emerald-700' : failed ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{connected ? 'Connected' : failed ? 'Test failed' : 'Test required'}</span>
}

function AccountModal({ account, functions, busy, onClose, onSave }) {
  const [form, setForm] = useState({ ...emptyAccount, ...account, password: '' })
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const toggleFunction = (key) => update('functions', form.functions.includes(key) ? form.functions.filter((item) => item !== key) : [...form.functions, key])

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 px-3 py-5 backdrop-blur-sm" onMouseDown={onClose}>
      <form className="max-h-full w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onSubmit={(event) => { event.preventDefault(); onSave(form) }} onMouseDown={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-start justify-between border-b bg-white px-5 py-4">
          <div><h2 className="text-xl font-semibold text-slate-900">{form.id ? 'Edit Mail Account' : 'Add Office 365 Account'}</h2><p className="mt-1 text-sm text-slate-500">Credentials are encrypted by the PHP backend and are never returned to this page.</p></div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <div className="space-y-2"><Label>Account name</Label><Input value={form.account_name} onChange={(e) => update('account_name', e.target.value)} placeholder="Jebal Booking Mail" /></div>
          <div className="space-y-2"><Label>Provider</Label><select value={form.provider} onChange={(e) => update('provider', e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="office365">Office 365</option><option value="custom">Custom SMTP</option></select></div>
          <div className="space-y-2"><Label>Sender email</Label><Input type="email" value={form.email_address} onChange={(e) => { update('email_address', e.target.value); if (!form.smtp_username) update('smtp_username', e.target.value) }} placeholder="bookings@jebalguesthouse.com" /></div>
          <div className="space-y-2"><Label>Sender name</Label><Input value={form.from_name} onChange={(e) => update('from_name', e.target.value)} /></div>
          <div className="space-y-2"><Label>SMTP username</Label><Input value={form.smtp_username} onChange={(e) => update('smtp_username', e.target.value)} placeholder="Usually the full email address" /></div>
          <div className="space-y-2"><Label>{form.id ? 'New password (leave blank to keep current)' : 'Mailbox password'}</Label><Input type="password" autoComplete="new-password" value={form.password} onChange={(e) => update('password', e.target.value)} /></div>
          <div className="space-y-2"><Label>SMTP host</Label><Input value={form.smtp_host} disabled={form.provider === 'office365'} onChange={(e) => update('smtp_host', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Port</Label><Input type="number" value={form.smtp_port} disabled={form.provider === 'office365'} onChange={(e) => update('smtp_port', Number(e.target.value))} /></div><div className="space-y-2"><Label>Encryption</Label><select value={form.smtp_encryption} disabled={form.provider === 'office365'} onChange={(e) => update('smtp_encryption', e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"><option value="tls">TLS</option><option value="ssl">SSL</option><option value="none">None</option></select></div></div>

          <div className="space-y-3 sm:col-span-2">
            <div><Label>Assigned mail functions</Label><p className="mt-1 text-xs text-slate-500">Selecting a function makes this account its sender. One function can have only one active sender.</p></div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {functions.map((item) => <label key={item.key} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-sm ${form.functions.includes(item.key) ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-200'}`}><input type="checkbox" checked={form.functions.includes(item.key)} onChange={() => toggleFunction(item.key)} />{item.label}</label>)}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-white px-5 py-4"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save Account</Button></div>
      </form>
    </div>
  )
}

function BusinessLinksModal({ links, busy, onClose, onSave, onToggle, onDelete }) {
  const [editing, setEditing] = useState(null)
  const update = (key, value) => setEditing((current) => ({ ...current, [key]: value }))
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 px-3 py-5 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="max-h-full w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-start justify-between border-b bg-white px-5 py-4"><div><h2 className="text-xl font-semibold text-slate-900">Manage Business Pages</h2><p className="mt-1 text-sm text-slate-500">Save HTTPS shortcuts only. External usernames and passwords must stay with the external service.</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
        <div className="space-y-5 p-5">
          <div className="flex justify-end"><Button onClick={() => setEditing(emptyBusinessLink)}><Plus className="h-4 w-4" />Add Business Page</Button></div>
          {editing && <form className="grid gap-4 rounded-xl border border-blue-200 bg-blue-50/40 p-4 md:grid-cols-2" onSubmit={async (event) => { event.preventDefault(); const saved = await onSave(editing); if (saved) setEditing(null) }}>
            <div className="space-y-2"><Label>Page name</Label><Input value={editing.title} onChange={(e) => update('title', e.target.value)} placeholder="Google Business Profile" /></div>
            <div className="space-y-2"><Label>Category</Label><select value={editing.category} onChange={(e) => update('category', e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="business">Business</option><option value="booking">Booking</option><option value="email">Email</option><option value="analytics">Analytics</option><option value="hosting">Hosting</option><option value="other">Other</option></select></div>
            <div className="space-y-2 md:col-span-2"><Label>HTTPS address</Label><Input type="url" value={editing.portal_url} onChange={(e) => update('portal_url', e.target.value)} placeholder="https://example.com/" /></div>
            <div className="space-y-2 md:col-span-2"><Label>Description</Label><Input value={editing.description} onChange={(e) => update('description', e.target.value)} placeholder="Explain what the client can manage here." /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.is_enabled} onChange={(e) => update('is_enabled', e.target.checked)} />Show in Business Pages list</label>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" disabled={busy}><Save className="h-4 w-4" />Save Page</Button></div>
          </form>}
          <div className="space-y-3">{links.map((link) => <div key={link.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><Link2 className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-900">{link.title}</h3><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${link.is_enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{link.is_enabled ? 'Visible' : 'Hidden'}</span>{link.is_system && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">Built in</span>}</div><p className="truncate text-sm text-slate-500">{link.portal_url}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setEditing({ ...link })}><Edit3 className="h-4 w-4" />Edit</Button><Button variant="outline" disabled={busy} onClick={() => onToggle(link)}>{link.is_enabled ? 'Hide' : 'Show'}</Button>{!link.is_system && <Button variant="outline" disabled={busy} className="text-red-600" onClick={() => onDelete(link)}><Trash2 className="h-4 w-4" />Delete</Button>}</div></div>)}</div>
        </div>
      </div>
    </div>
  )
}

export default function MailSettings() {
  const [data, setData] = useState({ accounts: [], functions: [], routes: [] })
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(null)
  const [businessLinks, setBusinessLinks] = useState([])
  const [selectedBusinessLink, setSelectedBusinessLink] = useState('')
  const [managingLinks, setManagingLinks] = useState(false)
  const [toast, setToast] = useState({ message: '', type: 'success' })
  const connectedAccounts = useMemo(() => data.accounts.filter((account) => account.is_enabled && account.connection_status === 'connected'), [data.accounts])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    window.setTimeout(() => setToast({ message: '', type: 'success' }), 4500)
  }

  const load = async () => {
    setLoading(true)
    try {
      const [result, links] = await Promise.all([fetchMailSettings(), fetchBusinessLinks()])
      setData(result)
      setRoutes(result.routes || [])
      setBusinessLinks(links)
      setSelectedBusinessLink((current) => links.some((item) => String(item.id) === String(current) && item.is_enabled) ? current : String(links.find((item) => item.is_enabled)?.id || ''))
    } catch (error) { showToast(error.message || 'Mail settings could not be loaded.', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const saveAccount = async (form) => {
    setBusy(true)
    try {
      const payload = await saveMailAccount(form)
      setEditing(null)
      showToast(payload.message || 'Mail account saved. Test it before use.')
      await load()
    } catch (error) { showToast(error.message || 'Mail account could not be saved.', 'error') }
    finally { setBusy(false) }
  }

  const testAccount = async (account) => {
    const recipient = window.prompt('Send the connection test to:', account.email_address)
    if (recipient === null) return
    setBusy(true)
    try { const payload = await testMailAccount(account.id, recipient); showToast(payload.message); await load() }
    catch (error) { showToast(error.message || 'Connection test failed.', 'error'); await load() }
    finally { setBusy(false) }
  }

  const removeAccount = async (account) => {
    if (!window.confirm(`Delete ${account.email_address}? Its assigned functions will have no database sender until another account is selected.`)) return
    setBusy(true)
    try { const payload = await deleteMailAccount(account.id); showToast(payload.message); await load() }
    catch (error) { showToast(error.message || 'Account could not be deleted.', 'error') }
    finally { setBusy(false) }
  }

  const toggleAccount = async (account) => {
    setBusy(true)
    try { const payload = await toggleMailAccount(account.id, !account.is_enabled); showToast(payload.message); await load() }
    catch (error) { showToast(error.message || 'Account status could not be changed.', 'error') }
    finally { setBusy(false) }
  }

  const updateRoute = (key, field, value) => setRoutes((current) => current.map((route) => route.function_key === key ? { ...route, [field]: value } : route))

  const saveRoutes = async () => {
    setBusy(true)
    try { const payload = await saveMailRoutes(routes); showToast(payload.message); await load() }
    catch (error) { showToast(error.message || 'Routing rules could not be saved.', 'error') }
    finally { setBusy(false) }
  }

  const saveLink = async (link) => {
    setBusy(true)
    try { const payload = await saveBusinessLink(link); showToast(payload.message); await load(); return true }
    catch (error) { showToast(error.message || 'Business page could not be saved.', 'error'); return false }
    finally { setBusy(false) }
  }

  const toggleLink = async (link) => {
    setBusy(true)
    try { const payload = await toggleBusinessLink(link.id, !link.is_enabled); showToast(payload.message); await load() }
    catch (error) { showToast(error.message || 'Business page status could not be changed.', 'error') }
    finally { setBusy(false) }
  }

  const removeLink = async (link) => {
    if (!window.confirm(`Delete ${link.title}?`)) return
    setBusy(true)
    try { const payload = await deleteBusinessLink(link.id); showToast(payload.message); await load() }
    catch (error) { showToast(error.message || 'Business page could not be deleted.', 'error') }
    finally { setBusy(false) }
  }

  const activeBusinessLinks = businessLinks.filter((link) => link.is_enabled)
  const selectedLink = activeBusinessLinks.find((link) => String(link.id) === String(selectedBusinessLink))

  return (
    <div>
      <Toast toast={toast} close={() => setToast({ message: '', type: 'success' })} />
      <PageHeader title="Mail & Business Integrations" description="Manage Office 365 senders, email routing and secure shortcuts to external business dashboards." />

      {loading ? <SectionCard><div className="flex items-center gap-3 text-sm text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />Loading mail settings…</div></SectionCard> : <div className="space-y-6">
        <SectionCard>
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-violet-600" /><h2 className="text-lg font-semibold">Business Pages</h2></div><p className="mt-1 text-sm text-slate-500">Choose a service, then open its official dashboard. You will sign in on that service's own page.</p></div><Button variant="outline" onClick={() => setManagingLinks(true)}><Settings2 className="h-4 w-4" />Manage Business Pages</Button></div>
          {activeBusinessLinks.length === 0 ? <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">No visible business pages. Use Manage Business Pages to add or show one.</div> : <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"><div className="space-y-2"><Label>Select a business page</Label><select value={selectedBusinessLink} onChange={(e) => setSelectedBusinessLink(e.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">{activeBusinessLinks.map((link) => <option key={link.id} value={link.id}>{link.title}</option>)}</select></div>{selectedLink && <div className="flex flex-col justify-between gap-4 rounded-xl border border-violet-100 bg-violet-50/50 p-4 sm:flex-row sm:items-center"><div className="min-w-0"><div className="flex items-center gap-2"><Link2 className="h-5 w-5 text-violet-600" /><h3 className="font-semibold text-slate-900">{selectedLink.title}</h3></div><p className="mt-1 text-sm text-slate-600">{selectedLink.description || 'Open this external business service.'}</p><p className="mt-2 truncate text-xs text-slate-500">{selectedLink.portal_url}</p></div><a href={selectedLink.portal_url} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants())}>Open Page<ExternalLink className="h-4 w-4" /></a></div>}</div>}
        </SectionCard>

        <SectionCard>
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div><div className="flex items-center gap-2"><Server className="h-5 w-5 text-blue-600" /><h2 className="text-lg font-semibold">Mail Accounts</h2></div><p className="mt-1 text-sm text-slate-500">Save an account first, then test it. Failed or untested accounts cannot be used for routing.</p></div>
            <Button onClick={() => setEditing(emptyAccount)}><Plus className="h-4 w-4" />Add Mail Account</Button>
          </div>
          <div className="space-y-3">
            {data.accounts.length === 0 && <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">No database mail accounts yet. Existing server SMTP remains the temporary fallback.</div>}
            {data.accounts.map((account) => <div key={account.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 lg:flex-row lg:items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Mail className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-900">{account.account_name}</h3><StatusBadge account={account} /></div><p className="truncate text-sm text-slate-600">{account.email_address}</p><p className="mt-1 text-xs text-slate-500">{account.functions.map((key) => data.functions.find((item) => item.key === key)?.label || key).join(' · ') || 'No functions assigned'}</p>{account.last_test_message && <p className="mt-1 text-xs text-slate-500">Last test: {account.last_test_message}</p>}</div>
              <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => testAccount(account)} disabled={busy}><Send className="h-4 w-4" />Test</Button>{account.connection_status === 'connected' && <Button variant="outline" onClick={() => toggleAccount(account)} disabled={busy}>{account.is_enabled ? 'Disable' : 'Enable'}</Button>}<Button variant="outline" onClick={() => setEditing(account)}><Edit3 className="h-4 w-4" />Edit</Button><Button variant="outline" onClick={() => removeAccount(account)} disabled={busy} className="text-red-600"><Trash2 className="h-4 w-4" />Delete</Button></div>
            </div>)}
          </div>
        </SectionCard>

        <SectionCard>
          <div className="mb-5 flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><ShieldCheck className="h-5 w-5" /></div><div><h2 className="text-lg font-semibold">Email Routing</h2><p className="mt-1 text-sm text-slate-500">Choose the sender and hotel recipient independently for every function.</p></div></div>
          <div className="space-y-4">
            {routes.map((route) => { const label = data.functions.find((item) => item.key === route.function_key)?.label || route.function_key; return <div key={route.function_key} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-semibold text-slate-900">{label}</h3><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={route.is_enabled} onChange={(e) => updateRoute(route.function_key, 'is_enabled', e.target.checked)} />Enabled</label></div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2"><Label>Send from</Label><select value={route.sender_account_id || ''} onChange={(e) => updateRoute(route.function_key, 'sender_account_id', e.target.value ? Number(e.target.value) : null)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">Server fallback</option>{connectedAccounts.map((account) => <option key={account.id} value={account.id}>{account.account_name} — {account.email_address}</option>)}</select></div>
                <div className="space-y-2"><Label>Hotel recipient</Label><Input type="email" value={route.hotel_recipient_email || ''} onChange={(e) => updateRoute(route.function_key, 'hotel_recipient_email', e.target.value)} placeholder="Optional" /></div>
                <div className="space-y-2"><Label>Notification recipients</Label><div className="flex h-10 items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-medium text-emerald-800"><ShieldCheck className="mr-2 h-4 w-4 shrink-0" />{route.delivery_label || (route.send_customer_copy && route.send_hotel_copy ? 'Customer and hotel' : route.send_customer_copy ? 'Customer only' : 'Hotel only')}</div><p className="text-xs text-slate-500">This delivery rule is protected and cannot be changed from the admin panel.</p></div>
              </div>
            </div> })}
          </div>
          <div className="mt-5 flex justify-end"><Button onClick={saveRoutes} disabled={busy}><Save className="h-4 w-4" />Save Routing</Button></div>
        </SectionCard>
      </div>}

      {editing && <AccountModal account={editing} functions={data.functions} busy={busy} onClose={() => setEditing(null)} onSave={saveAccount} />}
      {managingLinks && <BusinessLinksModal links={businessLinks} busy={busy} onClose={() => setManagingLinks(false)} onSave={saveLink} onToggle={toggleLink} onDelete={removeLink} />}
    </div>
  )
}
