import { config } from '../../config';

type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type QueryParamValue = string | number | boolean | null | undefined;

export type QueryParams = Record<string, QueryParamValue | QueryParamValue[]>;

export interface ApiRequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  params?: QueryParams;
}

interface ApiClientErrorOptions {
  endpointUrl: string;
  method: ApiMethod;
  statusCode?: number;
  responseBody?: unknown;
  originalError?: unknown;
}

export class ApiClientError extends Error {
  public readonly endpointUrl: string;
  public readonly method: ApiMethod;
  public readonly statusCode?: number;
  public readonly responseBody?: unknown;
  public readonly originalError?: unknown;

  constructor(message: string, options: ApiClientErrorOptions) {
    super(message);
    this.name = 'ApiClientError';
    this.endpointUrl = options.endpointUrl;
    this.method = options.method;
    this.statusCode = options.statusCode;
    this.responseBody = options.responseBody;
    this.originalError = options.originalError;
  }
}

export class ApiClient {
  public readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = normalizeBaseUrl(baseUrl);
  }

  public get<TResponse>(endpoint: string, options?: ApiRequestOptions): Promise<TResponse> {
    return this.request<TResponse>('GET', endpoint, undefined, options);
  }

  public post<TResponse, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    options?: ApiRequestOptions,
  ): Promise<TResponse> {
    return this.request<TResponse>('POST', endpoint, body, options);
  }

  public put<TResponse, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    options?: ApiRequestOptions,
  ): Promise<TResponse> {
    return this.request<TResponse>('PUT', endpoint, body, options);
  }

  public patch<TResponse, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    options?: ApiRequestOptions,
  ): Promise<TResponse> {
    return this.request<TResponse>('PATCH', endpoint, body, options);
  }

  public delete<TResponse>(endpoint: string, options?: ApiRequestOptions): Promise<TResponse> {
    return this.request<TResponse>('DELETE', endpoint, undefined, options);
  }

  public resolveUrl(endpoint: string, params?: QueryParams): string {
    if (/^[a-z][a-z\d+\-.]*:/i.test(endpoint)) {
      throw new Error(`API client endpoints must be relative paths. Received: ${endpoint}`);
    }

    const url = new URL(endpoint.replace(/^\/+/, ''), `${this.baseUrl}/`);

    if (params !== undefined) {
      appendQueryParams(url, params);
    }

    return url.toString();
  }

  private async request<TResponse>(
    method: ApiMethod,
    endpoint: string,
    body?: unknown,
    options: ApiRequestOptions = {},
  ): Promise<TResponse> {
    const { params, ...requestOptions } = options;
    const endpointUrl = this.resolveUrl(endpoint, params);
    const headers = new Headers(requestOptions.headers);

    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    const requestBody = prepareRequestBody(body, headers);

    try {
      const response = await fetch(endpointUrl, {
        ...requestOptions,
        method,
        headers,
        body: requestBody,
      });
      const responseBody = await parseResponseBody(response);

      if (!response.ok) {
        throw new ApiClientError(`API request failed with status ${response.status}`, {
          endpointUrl,
          method,
          statusCode: response.status,
          responseBody,
        });
      }

      return responseBody as TResponse;
    } catch (caughtError) {
      if (caughtError instanceof ApiClientError) {
        throw caughtError;
      }

      throw new ApiClientError('API request failed before receiving a response', {
        endpointUrl,
        method,
        originalError: caughtError,
      });
    }
  }
}

const normalizeBaseUrl = (value: string): string => {
  try {
    const url = new URL(value);
    return url.toString().replace(/\/$/, '');
  } catch {
    throw new Error(`API base URL must be a valid absolute URL. Received: ${value}`);
  }
};

const appendQueryParams = (url: URL, params: QueryParams): void => {
  Object.entries(params).forEach(([key, value]) => {
    const values = Array.isArray(value) ? value : [value];

    values.forEach((item) => {
      if (item !== null && item !== undefined) {
        url.searchParams.append(key, String(item));
      }
    });
  });
};

const isBodyInit = (body: unknown): body is BodyInit => {
  return (
    typeof body === 'string' ||
    body instanceof URLSearchParams ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  );
};

const prepareRequestBody = (body: unknown, headers: Headers): BodyInit | undefined => {
  if (body === undefined) {
    return undefined;
  }

  if (isBodyInit(body)) {
    return body;
  }

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return JSON.stringify(body);
};

const parseResponseBody = async (response: Response): Promise<unknown> => {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();

  if (text.trim() === '') {
    return undefined;
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json') || contentType.includes('+json')) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  return text;
};

export const logApiClientError = (error: unknown, fallbackEndpoint?: string): void => {
  if (error instanceof ApiClientError) {
    const statusCode = error.statusCode ?? 'no status';
    console.error(
      `[apiClient] ${error.method} ${error.endpointUrl} failed. status=${statusCode} message="${error.message}"`,
    );

    if (error.responseBody !== undefined) {
      console.error('[apiClient] Response body:', error.responseBody);
    }

    if (error.originalError !== undefined) {
      console.error('[apiClient] Original error:', error.originalError);
    }

    return;
  }

  console.error(`[apiClient] ${fallbackEndpoint ?? 'request'} failed.`, error);
};

export const createApiClient = (baseUrl: string): ApiClient => {
  return new ApiClient(baseUrl);
};

export const apiClient = createApiClient(config.API_BASE_URL);
