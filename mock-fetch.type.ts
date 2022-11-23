export type Fetch = (
  input: URL | Request | string,
  init?: RequestInit,
) => Promise<Response>;

export interface MockRequestInit extends Omit<RequestInit, "method"> {
  method: MockMatcher;
}

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

export interface MockRequestInputs {
  input: URL | Request | MockMatcher;
  init?: MockRequestInit;
  url: MockMatcher;
  method: MockMatcher;
}

export interface MockRequest {
  request: MockRequestInputs;
  response: Response;
  error?: Error;
  consumed: boolean;
  pending: boolean;
  persist: boolean;
  times: number;
  delay: number;
  calls: number;
}

export type MockMatcher =
  | string
  | ((input: string) => boolean)
  | RegExp;
