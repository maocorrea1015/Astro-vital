import { decodeError, type Decoder } from './validators.ts'

export type ApiErrorKind =
  | 'configuration'
  | 'access-unconfigured'
  | 'invalid-request'
  | 'unauthorized'
  | 'not-found'
  | 'rate-limited'
  | 'server'
  | 'http'
  | 'network'
  | 'timeout'
  | 'cancelled'
  | 'invalid-response'

const messages: Record<ApiErrorKind, string> = {
  configuration: 'Configuración de API inválida.',
  'access-unconfigured': 'El acceso protegido aún no está configurado.',
  'invalid-request': 'Solicitud inválida.',
  unauthorized: 'Acceso a la API no autorizado.',
  'not-found': 'Recurso no encontrado.',
  'rate-limited': 'Límite de solicitudes alcanzado.',
  server: 'La API devolvió un error de servidor.',
  http: 'Respuesta HTTP inesperada.',
  network: 'No se pudo conectar con la API.',
  timeout: 'La API excedió el tiempo de espera.',
  cancelled: 'Solicitud cancelada.',
  'invalid-response': 'La API devolvió una respuesta JSON inesperada.',
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number
  readonly retryAfterSeconds?: number

  constructor(kind: ApiErrorKind, status?: number, retryAfterSeconds?: number) {
    super(messages[kind])
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export interface ApiClientOptions {
  /** Absolute HTTP(S) base for public requests. Defaults to the browser origin. */
  publicBaseUrl?: string
  /** Same-origin path prefix, only after an authenticated gateway has been agreed. */
  protectedPathPrefix?: string
  timeoutMs?: number
  fetchImpl?: typeof fetch
}

interface GetOptions {
  access: 'public' | 'protected'
  signal?: AbortSignal
}

function parsePublicBase(input: string | undefined) {
  if (input === undefined) return globalThis.location?.origin ?? ''
  try {
    const url = new URL(input)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
      throw new ApiError('configuration')
    }
    return url.href.replace(/\/+$/, '')
  } catch {
    throw new ApiError('configuration')
  }
}

function retryAfterHeader(value: string | null): number | undefined {
  if (value === null) return undefined
  const trimmed = value.trim()
  if (/^\d+$/.test(trimmed)) {
    const seconds = Number(trimmed)
    return Number.isSafeInteger(seconds) ? seconds : undefined
  }
  if (!/^[a-z]{3}/i.test(trimmed)) return undefined
  const date = Date.parse(trimmed)
  return Number.isFinite(date) ? Math.max(0, Math.ceil((date - Date.now()) / 1000)) : undefined
}

const statusKinds: Partial<Record<number, ApiErrorKind>> = {
  400: 'invalid-request',
  401: 'unauthorized',
  403: 'unauthorized',
  404: 'not-found',
  429: 'rate-limited',
}

async function responseError(response: Response): Promise<ApiError> {
  const { status } = response
  const kind = statusKinds[status] ?? (status >= 500 ? 'server' : 'http')
  if (kind !== 'rate-limited') return new ApiError(kind, status)

  const header = retryAfterHeader(response.headers.get('Retry-After'))
  if (header !== undefined) return new ApiError(kind, status, header)

  let seconds: number | undefined
  try {
    seconds = decodeError(await response.json()).retry_after
  } catch {
    // A malformed error body must preserve the HTTP status.
  }
  return new ApiError(kind, status, seconds)
}

export function createApiClient({
  publicBaseUrl, protectedPathPrefix, timeoutMs = 10_000, fetchImpl = globalThis.fetch.bind(globalThis),
}: ApiClientOptions = {}) {
  const publicBase = parsePublicBase(publicBaseUrl)
  if (
    (protectedPathPrefix !== undefined && !/^\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+$/.test(protectedPathPrefix))
    || !Number.isInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 2_147_483_647
  ) {
    throw new ApiError('configuration')
  }

  const inFlight = new Map<string, Promise<unknown>>()
  const retryNotBefore = { public: 0, protected: 0 }

  async function request(url: string, { access, signal }: GetOptions): Promise<unknown> {
    if (signal?.aborted) throw new ApiError('cancelled')
    const waitMs = retryNotBefore[access] - Date.now()
    if (waitMs > 0) throw new ApiError('rate-limited', 429, Math.ceil(waitMs / 1000))

    const controller = new AbortController()
    let timedOut = false
    const cancel = () => controller.abort()
    signal?.addEventListener('abort', cancel, { once: true })
    const timer = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, timeoutMs)

    const abortError = () => new ApiError(timedOut ? 'timeout' : 'cancelled')

    try {
      const response = await fetchImpl(url, {
        headers: { Accept: 'application/json' },
        credentials: access === 'protected' ? 'same-origin' : 'omit',
        cache: 'no-store',
        redirect: 'error',
        signal: controller.signal,
      })
      if (controller.signal.aborted) throw abortError()
      if (!response.ok) {
        const error = await responseError(response)
        if (!controller.signal.aborted && error.kind === 'rate-limited' && error.retryAfterSeconds !== undefined) {
          retryNotBefore[access] = Math.max(retryNotBefore[access], Date.now() + error.retryAfterSeconds * 1000)
        }
        throw error
      }
      try {
        const payload: unknown = await response.json()
        if (controller.signal.aborted) throw abortError()
        return payload
      } catch {
        throw new ApiError('invalid-response', response.status)
      }
    } catch (error) {
      if (controller.signal.aborted) throw abortError()
      if (error instanceof ApiError) throw error
      throw new ApiError('network')
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', cancel)
    }
  }

  async function get<T>(path: string, decode: Decoder<T>, options: GetOptions): Promise<T> {
    if (!/^\/api\/[a-zA-Z0-9_/-]+$/.test(path)) throw new ApiError('invalid-request')
    if (options.access === 'protected' && protectedPathPrefix === undefined) {
      throw new ApiError('access-unconfigured')
    }
    // Anchor protected calls to the document's origin, independently of any base element.
    const base = options.access === 'protected'
      ? `${globalThis.location?.origin ?? ''}${protectedPathPrefix}`
      : publicBase
    const url = `${base}${path}`
    if (options.signal) return decode(await request(url, options))

    // Independent cancellation must never abort another caller's request.
    const key = `${options.access}:${url}`
    let pending = inFlight.get(key)
    if (!pending) {
      pending = request(url, options).finally(() => inFlight.delete(key))
      inFlight.set(key, pending)
    }
    return decode(await pending)
  }

  return { get }
}
