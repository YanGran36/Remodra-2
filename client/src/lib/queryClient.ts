import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Backend API base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: RequestInit
): Promise<Response> {
  // If the URL starts with /api, use it directly (Vite proxy will handle it)
  const fullUrl = url.startsWith('/api') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  
  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    ...options // Permitir opciones adicionales como signal para AbortController
  });

  await throwIfResNotOk(res);
  return res;
}

export async function fetchWithBaseUrl(url: string, options?: RequestInit) {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  return fetch(fullUrl, options);
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const fullUrl = url.startsWith('/api') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    
    const res = await fetch(fullUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 5000, // Considerar los datos obsoletos después de 5 segundos
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
