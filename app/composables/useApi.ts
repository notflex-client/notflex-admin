type RequestBody = Record<string, unknown> | FormData | null

type QueryParams = Record<string, string | number | boolean | null | undefined>

export function useApi() {
  const config = useRuntimeConfig()
  const base = (config.public.apiUrl as string) || 'http://localhost:8080'
  const auth = useAuth()
  const router = useRouter()

  function headers() {
    if (!import.meta.client) return undefined
    const token = auth.token.value || localStorage.getItem('adminToken')
    return token ? { Authorization: `Bearer ${token}` } : undefined
  }

  async function handle401(err: unknown): Promise<never> {
    const e = err as { response?: { status?: number }, statusCode?: number }
    const status = e?.response?.status ?? e?.statusCode
    if (status === 401) {
      await auth.logout()
      router.push('/login')
    }
    throw err
  }

  function get<T>(path: string, params?: QueryParams) {
    return $fetch<T>(`${base}${path}`, { params, headers: headers() }).catch(handle401) as Promise<T>
  }

  function post<T>(path: string, body: RequestBody) {
    return $fetch<T>(`${base}${path}`, { method: 'POST', body, headers: headers() }).catch(handle401) as Promise<T>
  }

  function put<T>(path: string, body: RequestBody) {
    return $fetch<T>(`${base}${path}`, { method: 'PUT', body, headers: headers() }).catch(handle401) as Promise<T>
  }

  function del<T>(path: string) {
    return $fetch<T>(`${base}${path}`, { method: 'DELETE', headers: headers() }).catch(handle401) as Promise<T>
  }

  function postForm<T>(path: string, body: FormData) {
    return $fetch<T>(`${base}${path}`, { method: 'POST', body, headers: headers() }).catch(handle401) as Promise<T>
  }

  return { get, post, put, del, postForm }
}
