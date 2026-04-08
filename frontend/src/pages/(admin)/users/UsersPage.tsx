import { useEffect, useState } from 'react'
import { PageHeader }  from '../../../components/admin/PageHeader'
import { SectionCard } from '../../../components/admin/SectionCard'
import { StatCard }    from '../../../components/admin/StatCard'
import { LoadingState } from '../../../components/admin/LoadingState'
import {
  getUsers,
  changeUserRole,
  deactivateUser,
  type UserProfile,
} from '../../../lib/adminApi'

const ROLES = ['Admin', 'Staff', 'Donor']

// ── Role badge colors ─────────────────────────────────────────────────────────
function roleBadgeClass(role: string) {
  if (role === 'Admin') return 'badge badge-error'
  if (role === 'Staff') return 'badge badge-warning'
  return 'badge'
}

export function UsersPage() {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [users, setUsers]     = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [saving, setSaving]   = useState<string | null>(null) // userId currently being saved

  // ── Fetch users on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false))
  }, [])

  // ── Role change handler ──────────────────────────────────────────────────────
  async function handleRoleChange(user: UserProfile, newRole: string) {
    if (newRole === user.role) return
    setSaving(user.id)
    try {
      const res = await changeUserRole(user.id, newRole)
      if (!res.ok) throw new Error()
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u))
    } catch {
      alert('Failed to update role. Please try again.')
    } finally {
      setSaving(null)
    }
  }

  // ── Deactivate handler ───────────────────────────────────────────────────────
  async function handleDeactivate(user: UserProfile) {
    if (!confirm(`Deactivate ${user.email}? This will prevent them from logging in.`)) return
    setSaving(user.id)
    try {
      const res = await deactivateUser(user.id)
      if (!res.ok) throw new Error()
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: false } : u))
    } catch {
      alert('Failed to deactivate user. Please try again.')
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <LoadingState />
  if (error) return <p className="text-sm text-[var(--alert)] p-4">{error}</p>

  // ── Summary counts ───────────────────────────────────────────────────────────
  const activeCount = users.filter(u => u.isActive).length
  const adminCount  = users.filter(u => u.role === 'Admin').length
  const staffCount  = users.filter(u => u.role === 'Staff').length

  return (
    <div className="flex flex-col gap-6 max-w-[1200px]">
      <PageHeader
        title="Manage Users"
        subtitle="View all registered accounts, reassign roles, and deactivate users."
      />

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Users"   value={users.length}        icon="👥" />
        <StatCard label="Active"        value={activeCount}         icon="✅" />
        <StatCard label="Admins"        value={adminCount}          icon="🔑" accent />
        <StatCard label="Staff"         value={staffCount}          icon="🏠" />
      </div>

      {/* ── Users table ─────────────────────────────────────────────────────── */}
      <SectionCard
        title="All Users"
        subtitle={`${users.length} registered account${users.length !== 1 ? 's' : ''}`}
      >
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Full Name</th>
                <th>Role</th>
                <th>Linked To</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className={!user.isActive ? 'opacity-50' : ''}>

                  {/* Email */}
                  <td className="font-medium text-[var(--text-h)] text-sm">{user.email}</td>

                  {/* Full name */}
                  <td className="text-[var(--text)] text-sm">{user.fullName || '—'}</td>

                  {/* Role — inline selector */}
                  <td>
                    {user.isActive ? (
                      <select
                        value={user.role}
                        disabled={saving === user.id}
                        onChange={e => handleRoleChange(user, e.target.value)}
                        className="text-xs border border-[var(--border)] rounded-lg px-2 py-1.5 bg-[var(--bg)] text-[var(--text-h)] disabled:opacity-50"
                      >
                        {ROLES.map(r => <option key={r}>{r}</option>)}
                      </select>
                    ) : (
                      <span className={`${roleBadgeClass(user.role)} text-xs`}>{user.role}</span>
                    )}
                  </td>

                  {/* Linked entity */}
                  <td className="text-[var(--text)] text-xs">
                    {user.safehouseId
                      ? `Safehouse #${user.safehouseId}`
                      : user.supporterId
                      ? `Donor #${user.supporterId}`
                      : '—'}
                  </td>

                  {/* Joined date */}
                  <td className="text-[var(--text)] text-xs">
                    {new Date(user.createdAt).toLocaleDateString('en-PH', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </td>

                  {/* Active status badge */}
                  <td>
                    {user.isActive
                      ? <span className="badge badge-success text-xs">Active</span>
                      : <span className="badge badge-error text-xs">Inactive</span>
                    }
                  </td>

                  {/* Deactivate action */}
                  <td>
                    {user.isActive && (
                      <button
                        disabled={saving === user.id}
                        onClick={() => handleDeactivate(user)}
                        className="text-xs text-[var(--alert)] hover:underline disabled:opacity-50 transition-opacity"
                      >
                        {saving === user.id ? 'Saving…' : 'Deactivate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}
