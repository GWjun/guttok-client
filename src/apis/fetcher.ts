import APIError from '#apis/APIError'

interface FetchOptions extends RequestInit {
  timeout?: number
  retries?: number
  retryDelay?: number
}

const BASE_URL = '/api'
const DEFAULT_TIMEOUT = 10000 // 10 seconds
const DEFAULT_RETRIES = 1
const DEFAULT_RETRY_DELAY = 500 // 0.5 second

class Fetcher {
  private readonly baseUrl: string

  constructor(baseUrl: string = '') {
    this.baseUrl = BASE_URL + baseUrl
  }

  private async request<T>(
    url: string,
    options: FetchOptions = {},
  ): Promise<T> {
    const {
      timeout = DEFAULT_TIMEOUT,
      retries = DEFAULT_RETRIES,
      retryDelay = DEFAULT_RETRY_DELAY,
      ...fetchOptions
    } = options

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        ...fetchOptions,
        signal: controller.signal,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorResponse = await response.json()
        throw new APIError({
          message: errorResponse.message ?? '',
          statusCode: response.status,
          errorCode: errorResponse?.errorCode ?? 'BAD_REQUEST_ERROR',
        })
      }

      return response.json() as Promise<T>
    } catch (error) {
      clearTimeout(timeoutId)

      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay))
        return this.request<T>(url, {
          ...options,
          retries: retries - 1,
        })
      }

      if (error instanceof APIError) {
        throw error
      } else {
        throw new APIError({
          message: '잘못된 요청 입니다.',
          statusCode: 400,
          errorCode: 'BAD_REQUEST_ERROR',
        })
      }
    }
  }

  public get<T>(
    url: string,
    options: Omit<FetchOptions, 'method'> = {},
  ): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'GET',
    })
  }

  public post<T>(
    url: string,
    body: unknown,
    options: Omit<FetchOptions, 'method' | 'body'> = {},
  ): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  public put<T>(
    url: string,
    body: unknown,
    options: Omit<FetchOptions, 'method' | 'body'> = {},
  ): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  public delete<T>(
    url: string,
    options: Omit<FetchOptions, 'method'> = {},
  ): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'DELETE',
    })
  }
}

export default Fetcher
