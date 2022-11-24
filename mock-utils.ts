import { MockNotMatchedError } from "./mock-fetch.error.ts";
import { MockMatcher, MockRequest, RequestKey } from "./mock-fetch.type.ts";

export function matchValue(
  matcher: MockMatcher,
  value: string,
) {
  if (typeof matcher === "string") {
    return matcher === value;
  }
  if (matcher instanceof RegExp) {
    return matcher.test(value);
  }
  return matcher(value) === true;
}

/**
 * As per RFC 3986, clients are not supposed to send URI
 * fragments to servers when they retrieve a document. Therefore,
 * we strip these out.
 */
export function stripURIFragments(rawURL: string): string {
  const url = new URL(rawURL);
  return url.href.replace(url.hash, "");
}

export function safeURL(rawURL: string): string {
  const urlSegments = rawURL.split("?");

  if (urlSegments.length !== 2) {
    return stripURIFragments(rawURL);
  }

  const qp = new URLSearchParams(urlSegments.pop());
  qp.sort();
  return stripURIFragments([...urlSegments, qp.toString()].join("?"));
}

export function getResourceMethod(
  input: string | Request | URL,
  init: RequestInit | undefined,
): string {
  if (input instanceof Request) {
    return input.method;
  }
  return init?.method || "GET";
}

export function getResourceURL(input: string | Request | URL): URL {
  if (typeof input === "string") {
    return new URL(input);
  }

  if (input instanceof URL) {
    return input;
  }

  return new URL(input.url);
}

export function getResourceHeaders(
  input: URL | Request | string,
  init?: RequestInit,
): Headers {
  if (input instanceof Request) {
    return input.headers;
  }

  if (init?.headers) {
    return new Headers(init.headers);
  }

  return new Headers();
}

export async function getResourceBody(
  input: URL | Request | string,
  init?: RequestInit,
): Promise<string | undefined> {
  if (input instanceof Request) {
    return await input.text();
  }

  if (init?.body) {
    if (init.body instanceof FormData) {
      return JSON.stringify([...init.body.entries()]);
    }
    return init.body.toString();
  }
}

export async function buildKey(
  input: URL | Request | string,
  init?: RequestInit,
): Promise<RequestKey> {
  const url = getResourceURL(input);
  return {
    url,
    method: getResourceMethod(input, init),
    body: await getResourceBody(input, init),
    headers: getResourceHeaders(input, init),
    query: url.searchParams,
  };
}

export function isMockMatcher(input: unknown): input is MockMatcher {
  return typeof input === "string" || typeof input === "function" ||
    input instanceof RegExp;
}

export function matchHeaders(
  mockRequest: MockRequest,
  headers: Headers,
) {
  let mockHeaderMatchers: [string, MockMatcher][] = [];
  if (mockRequest.request.input instanceof Request) {
    mockHeaderMatchers = [...mockRequest.request.input.headers.entries()];
  } else {
    const initHeaders = mockRequest.request.init?.headers;
    if (initHeaders instanceof Headers) {
      mockHeaderMatchers = [...initHeaders.entries()];
    } else if (Array.isArray(initHeaders)) {
      mockHeaderMatchers = [...initHeaders] as [string, MockMatcher][];
    } else if (typeof initHeaders === "function") {
      return initHeaders(headers);
    } else if (initHeaders) {
      mockHeaderMatchers = [...Object.entries(initHeaders)];
    }
  }

  for (const [headerName, headerMatcher] of mockHeaderMatchers) {
    const header = headers.get(headerName);
    if (header === null || !matchValue(headerMatcher, header)) {
      return false;
    }
  }
  return true;
}

export function getMockRequest(
  mockRequests: MockRequest[],
  key: RequestKey,
): MockRequest {
  // Match URL
  let matchedMockRequests = mockRequests
    .filter(({ consumed }) => !consumed)
    .filter(({ request }) => matchValue(request.url, key.url.href));
  if (matchedMockRequests.length === 0) {
    throw new MockNotMatchedError(
      `Mock Request not matched for URL '${key.url}'`,
    );
  }

  // Match method
  matchedMockRequests = matchedMockRequests.filter(({ request }) =>
    matchValue(request.method, key.method)
  );
  if (matchedMockRequests.length === 0) {
    throw new MockNotMatchedError(
      `Mock Request not matched for method '${key.method}'`,
    );
  }

  // Match body
  matchedMockRequests = matchedMockRequests.filter(({ request }) =>
    typeof request.body !== "undefined"
      ? matchValue(request.body, key.body ?? "")
      : true
  );
  if (matchedMockRequests.length === 0) {
    throw new MockNotMatchedError(
      `Mock Request not matched for body '${key.body}'`,
    );
  }

  // Match headers
  matchedMockRequests = matchedMockRequests.filter((mockRequest) =>
    matchHeaders(mockRequest, key.headers)
  );
  if (matchedMockRequests.length === 0) {
    throw new MockNotMatchedError(
      `Mock Request not matched for headers '${
        JSON.stringify([...key.headers.entries()])
      }'`,
    );
  }

  // Only take the first matched request
  return matchedMockRequests[0];
}
