/**
 * StandardAPI - A powerful, type-safe wrapper around the native Fetch API.
 * Designed for the RPB ecosystem to standardize HTTP requests, error handling,
 * and Next.js integration.
 */

export class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data: any,
    public url: string
  ) {
    super(`API Error ${status} (${statusText}) at ${url}`);
    this.name = 'APIError';
  }
}

export interface StandardAPIOptions extends RequestInit {
  baseUrl?: string;
  params?: Record<string, string | number | boolean | undefined | null>;
  validationSchema?: any; // To be used with Zod or similar
  revalidate?: number | false; // Next.js shortcut
}

export interface APIInterceptor {
  onRequest?: (url: string, options: RequestInit) => RequestInit | Promise<RequestInit>;
  onResponse?: (response: Response) => Response | Promise<Response>;
  onError?: (error: APIError) => void | Promise<void>;
}

export class StandardAPI {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;
  private interceptors: APIInterceptor[] = [];

  constructor(baseUrl: string = '', defaultHeaders: HeadersInit = {}) {
    // Remove trailing slash if present
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.defaultHeaders = defaultHeaders;
  }

  /**
   * Add an interceptor to the client
   */
  addInterceptor(interceptor: APIInterceptor) {
    this.interceptors.push(interceptor);
    return this;
  }

  /**
   * Core request method
   */
  async request<T = any>(endpoint: string, options: StandardAPIOptions = {}): Promise<T> {
    const { baseUrl, params, validationSchema, revalidate, ...fetchOptions } = options;

    // Determine final URL
    const urlBase = baseUrl ?? this.baseUrl;
    const urlPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(`${urlBase}${urlPath}`);

    // Append query parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    // Merge headers
    const headers = new Headers(this.defaultHeaders);
    if (fetchOptions.headers) {
      new Headers(fetchOptions.headers).forEach((value, key) => {
        headers.set(key, value);
      });
    }

    // Next.js specific caching shortcut
    if (revalidate !== undefined) {
      (fetchOptions as any).next = { revalidate };
    }

    // Auto-set Content-Type for JSON bodies
    if (
      fetchOptions.body &&
      typeof fetchOptions.body !== 'string' &&
      !(fetchOptions.body instanceof FormData) &&
      !(fetchOptions.body instanceof Blob) &&
      !(fetchOptions.body instanceof URLSearchParams)
    ) {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      fetchOptions.body = JSON.stringify(fetchOptions.body);
    }

    let finalOptions: RequestInit = { ...fetchOptions, headers };

    // Apply request interceptors
    for (const interceptor of this.interceptors) {
      if (interceptor.onRequest) {
        finalOptions = await interceptor.onRequest(url.toString(), finalOptions);
      }
    }

    try {
      let response = await fetch(url.toString(), finalOptions);

      // Apply response interceptors
      for (const interceptor of this.interceptors) {
        if (interceptor.onResponse) {
          response = await interceptor.onResponse(response);
        }
      }

      // Handle non-2xx responses
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = await response.text();
        }
        throw new APIError(response.status, response.statusText, errorData, url.toString());
      }

      // Handle empty responses
      if (response.status === 204) {
        return {} as T;
      }

      // Parse JSON response
      let data: any;
      try {
        data = await response.json();
      } catch (error) {
        throw new APIError(response.status, 'Invalid JSON Response', null, url.toString());
      }

      // Optional validation
      if (validationSchema) {
        const result = validationSchema.safeParse ? validationSchema.safeParse(data) : { success: true, data };
        if (!result.success) {
          console.error('API Validation Error:', result.error);
          // We still return data but log the error
        }
        return result.data as T;
      }

      return data as T;
    } catch (error) {
      if (error instanceof APIError) {
        for (const interceptor of this.interceptors) {
          if (interceptor.onError) {
            await interceptor.onError(error);
          }
        }
      }
      throw error;
    }
  }

  get<T = any>(endpoint: string, options?: StandardAPIOptions) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T = any>(endpoint: string, body?: any, options?: StandardAPIOptions) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  put<T = any>(endpoint: string, body?: any, options?: StandardAPIOptions) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  patch<T = any>(endpoint: string, body?: any, options?: StandardAPIOptions) {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  delete<T = any>(endpoint: string, options?: StandardAPIOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Singleton instance for internal API calls (relative paths)
export const api = new StandardAPI('', {
  'Content-Type': 'application/json',
});

// Helper to create instances for external services
export const createClient = (baseUrl: string, headers: HeadersInit = {}) => {
  return new StandardAPI(baseUrl, headers);
};
