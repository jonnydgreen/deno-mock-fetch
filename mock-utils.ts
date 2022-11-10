// TODO: check this file

// const { MockNotMatchedError } = require('./mock-errors')
// const {
//   kDispatches,
//   kMockAgent,
//   kOriginalDispatch,
//   kOrigin,
//   kGetNetConnect
// } = require('./mock-symbols')
// const { STATUS_CODES } = require('http')

import { MockNotMatchedError } from "./errors.ts";
import { MockRequest, MockRequestKey, RequestKey } from "./mock-fetch.type.ts";

export function matchValue(
  match: string | RegExp | ((value: unknown) => boolean),
  value: string,
) {
  if (typeof match === "string") {
    return match === value;
  }
  if (match instanceof RegExp) {
    return match.test(value);
  }
  if (typeof match === "function") {
    return match(value) === true;
  }
  return false;
}

// function lowerCaseEntries (headers) {
//   return Object.fromEntries(
//     Object.entries(headers).map(([headerName, headerValue]) => {
//       return [headerName.toLocaleLowerCase(), headerValue]
//     })
//   )
// }

// /**
//  * @param {import('../../index').Headers|string[]|Record<string, string>} headers
//  * @param {string} key
//  */
// function getHeaderByName (headers, key) {
//   if (Array.isArray(headers)) {
//     for (let i = 0; i < headers.length; i += 2) {
//       if (headers[i].toLocaleLowerCase() === key.toLocaleLowerCase()) {
//         return headers[i + 1]
//       }
//     }

//     return undefined
//   } else if (typeof headers.get === 'function') {
//     return headers.get(key)
//   } else {
//     return lowerCaseEntries(headers)[key.toLocaleLowerCase()]
//   }
// }

// /** @param {string[]} headers */
// function buildHeadersFromArray (headers) { // fetch HeadersList
//   const clone = headers.slice()
//   const entries = []
//   for (let index = 0; index < clone.length; index += 2) {
//     entries.push([clone[index], clone[index + 1]])
//   }
//   return Object.fromEntries(entries)
// }

// function matchHeaders (mockDispatch, headers) {
//   if (typeof mockDispatch.headers === 'function') {
//     if (Array.isArray(headers)) { // fetch HeadersList
//       headers = buildHeadersFromArray(headers)
//     }
//     return mockDispatch.headers(headers ? lowerCaseEntries(headers) : {})
//   }
//   if (typeof mockDispatch.headers === 'undefined') {
//     return true
//   }
//   if (typeof headers !== 'object' || typeof mockDispatch.headers !== 'object') {
//     return false
//   }

//   for (const [matchHeaderName, matchHeaderValue] of Object.entries(mockDispatch.headers)) {
//     const headerValue = getHeaderByName(headers, matchHeaderName)

//     if (!matchValue(matchHeaderValue, headerValue)) {
//       return false
//     }
//   }
//   return true
// }

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

// function matchKey (mockDispatch, { path, method, body, headers }) {
//   const pathMatch = matchValue(mockDispatch.path, path)
//   const methodMatch = matchValue(mockDispatch.method, method)
//   const bodyMatch = typeof mockDispatch.body !== 'undefined' ? matchValue(mockDispatch.body, body) : true
//   const headersMatch = matchHeaders(mockDispatch, headers)
//   return pathMatch && methodMatch && bodyMatch && headersMatch
// }

// function getResponseData (data) {
//   if (Buffer.isBuffer(data)) {
//     return data
//   } else if (typeof data === 'object') {
//     return JSON.stringify(data)
//   } else {
//     return data.toString()
//   }
// }

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

// function generateKeyValues (data) {
//   return Object.entries(data).reduce((keyValuePairs, [key, value]) => [...keyValuePairs, key, value], [])
// }

// /**
//  * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
//  * @param {number} statusCode
//  */
// function getStatusText (statusCode) {
//   return STATUS_CODES[statusCode] || 'unknown'
// }
