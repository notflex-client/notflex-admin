export function useApi() {
  const config = useRuntimeConfig()
  const base = (config.public.apiUrl as string) || 'http://localhost:8080'
  function get<T>(path: string, params?: Record<string, any>) {
    return $fetch<T>(`${base}${path}`, { params })
  }
  function post<T>(path: string, body: any) {
    return $fetch<T>(`${base}${path}`, { method: 'POST', body })
  }
  function put<T>(path: string, body: any) {
    return $fetch<T>(`${base}${path}`, { method: 'PUT', body })
  }
  function del<T>(path: string) {
    return $fetch<T>(`${base}${path}`, { method: 'DELETE' })
  }
  function postForm<T>(path: string, body: FormData) {
    return $fetch<T>(`${base}${path}`, { method: 'POST', body })
  }
  return { get, post, put, del, postForm }
}
