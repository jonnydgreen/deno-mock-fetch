import { MockNotMatchedError } from "./mock-fetch.error.ts";
import {
  MockMatcher,
  MockRequest,
  MockRequestInit,
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
  // TODO: add advanced matchers
  // if (match instanceof RegExp) {
  //   return match.test(value);
  // }
  // if (typeof match === "function") {
  //   return match(value) === true;
  // }
  return false;
}

function safeURL(path: string) {
  if (typeof path !== "string") {
    return path;
  }

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
  init: MockRequestInit | undefined,
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
  init?: MockRequestInit,
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

export function getMockRequest(mockRequests: MockRequest[], key: RequestKey) {
  // Match URL
  let matchedMockRequests = mockRequests
    .filter(({ consumed }) => !consumed)
    .filter(({ request }) => matchValue(safeURL(request.url), key.url.href));
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

  return matchedMockRequests[0];
}
