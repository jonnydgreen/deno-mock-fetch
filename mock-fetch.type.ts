export type Fetch = (
  input: URL | Request | string,
  init?: RequestInit,
) => Promise<Response>;

export interface MockRequestInit
  extends Omit<RequestInit, "method" | "body" | "headers"> {
  method?: MockMatcher;
  body?: BodyInit | null | MockMatcher;
  headers?: MockHeadersInit;
}

export type MockHeadersInit = Headers | Record<string, MockMatcher> | [
  string,
  MockMatcher,
][] | ((headers: Headers) => boolean);

export interface RequestKey {
  url: URL;
  method: string;
  headers: Headers;
  query?: URLSearchParams;
  body?: string;
}

export interface MockRequestInputs {
  input: URL | Request | MockMatcher;
  init?: MockRequestInit;
  url: MockMatcher;
  method: MockMatcher;
  body?: MockMatcher;
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
