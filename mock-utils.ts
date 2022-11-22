import { MockNotMatchedError } from "./mock-fetch.error.ts";
import {
  MockMatcher,
  MockRequest,
  MockRequestKey,
  RequestKey,
} from "./mock-fetch.type.ts";

export function matchValue(
  match: MockMatcher,
  value: string,
) {
  if (typeof match === "string") {
    return match === value;
  }
  if (match instanceof RegExp) {
    return match.test(value);
  }
  return match(value) === true;
}

export function safeURL(path: string) {
  const pathSegments = path.split("?");

  if (pathSegments.length !== 2) {
    return path;
  }

  const qp = new URLSearchParams(pathSegments.pop());
  qp.sort();
  return [...pathSegments, qp.toString()].join("?");
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

export function buildKey(
  input: URL | Request | string,
  init?: RequestInit,
): MockRequestKey {
  const url = getResourceURL(input);
  return {
    url,
    method: getResourceMethod(input, init),
    // body,
    // headers,
    query: url.searchParams,
  };
}

export function isMockMatcher(input: unknown): input is MockMatcher {
  return typeof input === "string" || typeof input === "function" ||
    input instanceof RegExp;
}

export function getMockRequest(mockRequests: MockRequest[], key: RequestKey) {
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

  // TODO
  // // Match body
  // matchedMockRequests = matchedMockRequests.filter(({ body }) =>
  //   typeof body !== "undefined" ? matchValue(body, key.body) : true
  // );
  // if (matchedMockRequests.length === 0) {
  //   throw new MockNotMatchedError(`Mock Request not matched for body '${key.body}'`);
  // }

  // TODO
  // // Match headers
  // matchedMockRequests = matchedMockRequests.filter((mockDispatch) =>
  //   matchHeaders(mockDispatch, key.headers)
  // );
  // if (matchedMockRequests.length === 0) {
  //   throw new MockNotMatchedError(
  //     `Mock Request not matched for headers '${
  //       typeof key.headers === "object" ? JSON.stringify(key.headers) : key.headers
  //     }'`,
  //   );
  // }

  // Only take the first matched request
  return matchedMockRequests[0];
}
