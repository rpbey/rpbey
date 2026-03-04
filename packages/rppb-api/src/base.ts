export class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data: unknown,
    public url: string,
  ) {
    super(`API Error ${status} (${statusText}) at ${url}`);
    this.name = 'APIError';
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  revalidate?: number | false;
}

export interface ClientInterceptor {
  onRequest?: (url: string, options: RequestInit) => RequestInit | Promise<RequestInit>;
  onResponse?: (response: Response) => Response | Promise<Response>;
}

export interface ClientConfig {
  baseUrl?: string;
  headers?: HeadersInit;
  debug?: boolean;
}

export class BaseClient {
  protected interceptors: ClientInterceptor[] = [];
  protected debug: boolean;

  constructor(
    protected baseUrl: string = '',
    protected defaultHeaders: HeadersInit = {},
    config: ClientConfig = {}
  ) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.debug = config.debug ?? false;
  }

  addInterceptor(interceptor: ClientInterceptor) {
    this.interceptors.push(interceptor);
    return this;
  }

  protected log(message: string, data?: any) {
    if (this.debug) {
      console.log(`[@rpb/api] ${message}`, data ?? '');
    }
  }

  async request<T = unknown>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, revalidate, ...fetchOptions } = options;
    const url = new URL(`${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers = new Headers(this.defaultHeaders);
    if (fetchOptions.headers) {
      new Headers(fetchOptions.headers).forEach((value, key) => {
        headers.set(key, value);
      });
    }

    if (
      fetchOptions.body &&
      typeof fetchOptions.body !== 'string' &&
      !(fetchOptions.body instanceof FormData)
    ) {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      fetchOptions.body = JSON.stringify(fetchOptions.body);
    }

    let finalOptions: RequestInit = {
      ...fetchOptions,
      headers,
      ...(revalidate !== undefined ? { next: { revalidate } } : {}),
    } as any;

    const finalUrl = url.toString();

    // Request Interceptors
    for (const interceptor of this.interceptors) {
      if (interceptor.onRequest) {
        finalOptions = await interceptor.onRequest(finalUrl, finalOptions);
      }
    }

    this.log(`🚀 ${finalOptions.method ?? 'GET'} ${finalUrl}`);

    try {
      let response = await fetch(finalUrl, finalOptions);

      // Response Interceptors
      for (const interceptor of this.interceptors) {
        if (interceptor.onResponse) {
          response = await interceptor.onResponse(response);
        }
      }

      if (!response.ok) {
        const data = await response.json().catch(() => response.text());
        this.log(`❌ Error ${response.status}`, data);
        throw new APIError(response.status, response.statusText, data, finalUrl);
      }

      if (response.status === 204) return {} as T;
      
      const data = await response.json();
      this.log(`✅ Success`, { status: response.status });
      return data;
    } catch (error) {
      if (!(error instanceof APIError)) {
        this.log(`💥 Network/Runtime Error`, error);
      }
      throw error;
    }
  }
}
