export type Fetch = (
  input: URL | Request | string,
  init?: RequestInit,
) => Promise<Response>;

export interface RequestKey {
  url: URL;
  method: string;
  body?: unknown;
  headers?: Headers;
  query?: URLSearchParams;
}

export interface MockRequestKey {
  url: URL;
  method: string;
  query?: URLSearchParams;
}

export interface MockRequest {
  request: Request;
  response: Response;
  consumed: boolean;
  pending: boolean;
  persist: boolean;
  times: number;
  delay: number;
  calls: number;
}

export type MockMatcher =
  | string
  | ((input: unknown) => boolean)
  | RegExp;
