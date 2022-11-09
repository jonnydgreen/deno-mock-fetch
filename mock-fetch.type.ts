export type Fetch = (
  input: URL | Request | string,
  init?: RequestInit,
) => Promise<Response>;
