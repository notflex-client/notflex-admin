export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const auth = useAuth()
  auth.loadFromStorage()

  const isPublic = to.path === '/login'

  if (!auth.token.value) {
    if (isPublic) return
    return navigateTo('/login')
  }

  if (!auth.user.value) {
    await auth.fetchProfile()
  }

  if (!auth.token.value && !isPublic) {
    return navigateTo('/login')
  }

  if (auth.user.value && !auth.isAdmin.value) {
    await auth.logout()
    if (!isPublic) return navigateTo('/login')
  }

  if (isPublic && auth.token.value && auth.isAdmin.value) {
    return navigateTo('/')
  }
})
