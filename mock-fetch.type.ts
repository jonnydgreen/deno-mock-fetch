export type Fetch = (
  input: URL | Request | string,
  init?: RequestInit,
) => Promise<Response>;

export type MockRequestInit = RequestInit;

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

export type MockMatcher = string;
// TODO: add advanced matchers
// | ((input: unknown) => boolean)
// | RegExp;
