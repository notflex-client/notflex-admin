export interface AdminUser {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: string
  is_active: boolean
}

const userState = () => useState<AdminUser | null>('admin-user', () => null)
const tokenState = () => useState<string | null>('admin-token', () => null)

export function useAuth() {
  const config = useRuntimeConfig()
  const base = (config.public.apiUrl as string) || 'http://localhost:8080'

  const user = userState()
  const token = tokenState()

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  function loadFromStorage() {
    if (!import.meta.client) return
    token.value = localStorage.getItem('adminToken')
  }

  async function login(email: string, password: string) {
    const res = await $fetch<{ token: string, user: AdminUser }>(`${base}/auth/login`, {
      method: 'POST',
      body: { email, password },
    })
    if (res.user.role !== 'admin') {
      throw new Error('This account does not have admin access')
    }
    token.value = res.token
    user.value = res.user
    if (import.meta.client) localStorage.setItem('adminToken', res.token)
    return res.user
  }

  async function fetchProfile() {
    if (!token.value) return null
    try {
      const res = await $fetch<AdminUser>(`${base}/auth/me`, {
        headers: { Authorization: `Bearer ${token.value}` },
      })
      user.value = res
      return res
    } catch {
      logout()
      return null
    }
  }

  async function logout() {
    if (token.value) {
      try {
        await $fetch(`${base}/auth/logout`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token.value}` },
        })
      } catch {}
    }
    token.value = null
    user.value = null
    if (import.meta.client) localStorage.removeItem('adminToken')
  }

  return { user, token, isLoggedIn, isAdmin, loadFromStorage, login, fetchProfile, logout }
}
