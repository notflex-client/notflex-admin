export function useApi() {
  const config = useRuntimeConfig()
  const base = (config.public.apiUrl as string) || 'http://localhost:8080'

  function headers() {
    if (!import.meta.client) return undefined
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : undefined
  }

  function get<T>(path: string, params?: Record<string, any>) {
    return $fetch<T>(`${base}${path}`, { params, headers: headers() })
  }
  function post<T>(path: string, body: any) {
    return $fetch<T>(`${base}${path}`, { method: 'POST', body, headers: headers() })
  }
  function put<T>(path: string, body: any) {
    return $fetch<T>(`${base}${path}`, { method: 'PUT', body, headers: headers() })
  }
  function del<T>(path: string) {
    return $fetch<T>(`${base}${path}`, { method: 'DELETE', headers: headers() })
  }
  function postForm<T>(path: string, body: FormData) {
    return $fetch<T>(`${base}${path}`, { method: 'POST', body, headers: headers() })
  }
  return { get, post, put, del, postForm }
}
