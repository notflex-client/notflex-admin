const BASE = 'http://localhost:8080'

export function useApi() {
  function get<T>(path: string, params?: Record<string, any>) {
    return $fetch<T>(`${BASE}${path}`, { params })
  }
  function post<T>(path: string, body: any) {
    return $fetch<T>(`${BASE}${path}`, { method: 'POST', body })
  }
  function put<T>(path: string, body: any) {
    return $fetch<T>(`${BASE}${path}`, { method: 'PUT', body })
  }
  function del<T>(path: string) {
    return $fetch<T>(`${BASE}${path}`, { method: 'DELETE' })
  }
  return { get, post, put, del }
}
