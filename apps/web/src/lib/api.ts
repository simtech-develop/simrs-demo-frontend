const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

type ApiOptions = RequestInit & {
  body?: BodyInit | null;
};

async function request<T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const message =
      data?.message instanceof Array
        ? data.message.join(', ')
        : data?.message || `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}

export const api = {
  get<T>(endpoint: string) {
    return request<T>(endpoint, {
      method: 'GET',
    });
  },

  post<T, P>(endpoint: string, payload: P) {
    return request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  patch<T, P>(endpoint: string, payload: P) {
    return request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  delete<T>(endpoint: string) {
    return request<T>(endpoint, {
      method: 'DELETE',
    });
  },
};
