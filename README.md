# deno_mock_fetch

[![codecov](https://codecov.io/gh/jonnydgreen/deno-mock-fetch/branch/main/graph/badge.svg)](https://codecov.io/gh/jonnydgreen/deno-mock-fetch)

[Deno mock fetch](https://deno.land/x/deno_mock_fetch) implementation to be used
in testing. This module allows one to intercept calls to the global `fetch` API
and control the behaviour accordingly.

## Features

- Intercept calls to the global `fetch` API
- Intercept multiple types of requests at once, based on:
  - Request Origin
  - Request Path
  - Request Query string
  - Request Body
  - Request Headers
- Intercept request indefinitely
- Intercept request a finite number of times
- Simulate a request time delay
- Support for falling back to calling a real API for defined hostnames
- All global `fetch` API inputs are supported
- Advanced methods for matching requests:
  - `string`
  - `RegExp`
  - `Function`
- Throw custom error support
- Set default headers
- Auto-generated headers:
  - `content-length`

## Table of Contents

- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Examples](#examples)
- [Contributing](#contributing)
- [Limitations](#limitations)
- [License](#license)
- [Inspirations](#inspirations)

## Quick Start

Set up a basic `fetch` interceptor.

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";

const mockFetch = new MockFetch();

mockFetch
  // Intercept `GET https://example.com/hello`
  .intercept("https://example.com/hello", { method: "GET" })
  // Respond with status `200` and text `hello`
  .response("hello", { status: 200 });
```

Call the matching URL:

```typescript
const response = await fetch("https://example.com/hello");

const text = await response.text();

console.log(response.status); // 200
console.log(text); // "hello"
```

By default, subsequent calls to the same URL will reject with a
`MockNotMatchedError`:

```typescript
// Rejects with MockNotMatchedError
await fetch("https://example.com/hello");
```

This behaviour can be changed as demonstrated in the [examples](#examples).

## Examples

I want to:

- [Intercept a request containing a Query String](#intercept-a-request-containing-a-query-string)
- [Intercept a request indefinitely](#intercept-a-request-indefinitely)
- [Intercept a request a set number of times](#intercept-a-request-a-set-number-of-times)
- [Intercept a request with a delay](#intercept-a-request-with-a-delay)
- [Default to calling the original URL if a mock is not matched](#default-to-calling-the-original-url-if-a-mock-is-not-matched)
- [Default to calling specified URLs if a mock is not matched](#default-to-calling-specified-urls-if-a-mock-is-not-matched)
- [Deactivate calling original URLs](#deactivate-calling-original-urls)
- [Activate fetch interceptions](#activate-fetch-interceptions)
- [Deactivate fetch interceptions](#deactivate-fetch-interceptions)
- [Check if fetch interceptions are active](#check-if-fetch-interceptions-are-active)
- [Close and clean up the Mock Fetch instance](#close-and-clean-up-the-mock-fetch-instance)
- [Get the number of times requests have been intercepted](#get-the-number-of-times-requests-have-been-intercepted)
- [View registered mock metadata](#view-registered-mock-metadata)
- [Intercept a request based on method RegExp](#intercept-a-request-based-on-method-regexp)
- [Intercept a request based on method Function](#intercept-a-request-based-on-method-function)
- [Intercept a request based on URL RegExp](#intercept-a-request-based-on-url-regexp)
- [Intercept a request based on URL Function](#intercept-a-request-based-on-url-function)
- [Intercept a request based on body](#intercept-a-request-based-on-body)
- [Intercept a request based on headers object](#intercept-a-request-based-on-headers-object)
- [Intercept a request based on headers instance](#intercept-a-request-based-on-headers-instance)
- [Intercept a request based on headers array](#intercept-a-request-based-on-headers-array)
- [Intercept a request based on headers function](#intercept-a-request-based-on-headers-function)
- [Throw a custom error upon fetch call](#throw-a-custom-error-upon-fetch-call)
- [Set default headers](#set-default-headers)
- [Autogenerate `content-length` header](#autogenerate-content-length-header)
- [Intercept requests alongside superdeno](#intercept-requests-alongside-superdeno)

### Intercept a request containing a Query String

Set up the interceptor.

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";

const mockFetch = new MockFetch();

mockFetch
  .intercept("https://example.com/hello?foo=bar", { method: "GET" })
  .response("hello", { status: 200 });
```

Call the matching URL:

```typescript
const response = await fetch("https://example.com/hello?foo=bar");

const text = await response.text();

console.log(response.status); // 200
console.log(text); // "hello"
```

### Intercept a request indefinitely

Set up the interceptor, using the `persist` method on the `MockScope` instance.

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";

const mockFetch = new MockFetch();

mockFetch
  .intercept("https://example.com/hello", { method: "GET" })
  .response("hello", { status: 200 })
  .persist();
```

Call the matching URL:

```typescript
const response = await fetch("https://example.com/hello");

const text = await response.text();

console.log(response.status); // 200
console.log(text); // "hello"
```

Call the matching URL again:

```typescript
const response = await fetch("https://example.com/hello");

const text = await response.text();

console.log(response.status); // 200
console.log(text); // "hello"
```

### Intercept a request a set number of times

Set up the interceptor, using the `times` method on the `MockScope` instance.

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";

const mockFetch = new MockFetch();

mockFetch
  .intercept("https://example.com/hello", { method: "GET" })
  .response("hello", { status: 200 })
  // Will intercept matching requests twice
  .times(2);
```

Call the matching URL:

```typescript
const response = await fetch("https://example.com/hello");

const text = await response.text();

console.log(response.status); // 200
console.log(text); // "hello"
```

Call the matching URL again:

```typescript
const response = await fetch("https://example.com/hello");

const text = await response.text();

console.log(response.status); // 200
console.log(text); // "hello"
```

Call the matching URL a final time:

```typescript
// Rejects with MockNotMatchedError
await fetch("https://example.com/hello");
```

### Intercept a request with a delay

Set up the interceptor, using the `delay` method on the `MockScope` instance.

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";

const mockFetch = new MockFetch();

mockFetch
  .intercept("https://example.com/hello", { method: "GET" })
  .response("hello", { status: 200 })
  // Delay 1000ms before returning the response
  .delay(1000);
```

Call the matching URL:

```typescript
const response = await fetch("https://example.com/hello");

// 1000ms later...

const text = await response.text();

console.log(response.status); // 200
console.log(text); // "hello"
```

### Default to calling the original URL if a mock is not matched

Sometimes, one might want to default to calling the original URL if a mock is
not matched. This can be done with the `activateNetConnect` method on the
`MockFetch` instance.

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";

const mockFetch = new MockFetch();

mockFetch.activateNetConnect();

mockFetch
  .intercept("https://example.com/hello", { method: "GET" })
  .response("hello", { status: 200 });
```

Call the matching URL:

```typescript
const response = await fetch("https://example.com/hello");

const text = await response.text();

console.log(response.status); // 200
console.log(text); // "hello"
```

Call the same URL:

```typescript
const response = await fetch("https://example.com/hello");

const text = await response.text();

console.log(response.status); // 200
console.log(text); // Some html from the actual endpoint
```

### Default to calling specified URLs if a mock is not matched

In addition, one might want to default to calling the original URL for certain
hostnames if a mock is not matched. This can be done by passing matchers to the
`activateNetConnect` method on the `MockFetch` instance.

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";

const mockFetch = new MockFetch();

// Allow calls to `example.com` upon an unmatched request.
// This can be called multiple to times to register multiple hostnames
mockFetch.activateNetConnect("example.com");
```

Call a non-matching URL:

```typescript
const response = await fetch("https://example.com/hello");

const text = await response.text();

console.log(response.status); // 200
console.log(text); // Some html from the actual endpoint
```

Call another non-matching URL:

```typescript
const response = await fetch("https://another-example.com/hello");

// Rejects with MockNotMatchedError
await fetch("https://example.com/hello");
```

### Deactivate calling original URLs

Deactivate calling original URLs by calling the `deactivateNetConnect` on the
`MockFetch` instance.

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";

const mockFetch = new MockFetch();

mockFetch.activateNetConnect();

// Do work...

mockFetch.deactivateNetConnect();
```

### Activate fetch interceptions

Activate fetch interceptions by calling the `activate` method on the `MockFetch`
instance.

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";

const mockFetch = new MockFetch();

mockFetch.activate();
```

### Deactivate fetch interceptions

Deactivate fetch interceptions by calling the `deactivate` method on the
`MockFetch` instance.

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";

const mockFetch = new MockFetch();

mockFetch.deactivate();
```

### Check if fetch interceptions are active

Check if fetch interceptions are active by checking the value of the
`isMockActive` field on the `MockFetch` instance.

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";

const mockFetch = new MockFetch();

console.log(mockFetch.isMockActive); // true
```

### Close and clean up the Mock Fetch instance

Close and clean up the Mock Fetch instance by calling the `close` method on the
`MockFetch` instance.

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";

const mockFetch = new MockFetch();

mockFetch.close();
```

### Get the number of times requests have been intercepted

Get the number of times requests have been intercepted by checking the value of
the `calls` field on the `MockFetch` instance.

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";

const mockFetch = new MockFetch();

console.log(mockFetch.calls); // 0

mockFetch
  .intercept("https://example.com/hello?foo=bar", { method: "GET" })
  .response("hello", { status: 200 });

const response = await fetch("https://example.com/hello");

const text = await response.text();

console.log(response.status); // 200
console.log(text); // "hello"

console.log(mockFetch.calls); // 1
```

### View registered mock metadata

View registered mock scope metadata by checking the value of the `metadata`
field on the `MockScope` instance.

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";

const mockFetch = new MockFetch();

console.log(mockFetch.calls); // 0

const mockScope = mockFetch
  .intercept("https://example.com/hello?foo=bar", { method: "GET" })
  .response("hello", { status: 200 });

console.log(mockScope.metadata); // MockRequest
```

### Intercept a request based on method RegExp

Set up the interceptor.

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";

const mockFetch = new MockFetch();

mockFetch
  .intercept("https://example.com/hello", { method: /GET/ })
  .response("hello", { status: 200 });
```

Call the matching URL:

```typescript
const response = await fetch("https://example.com/hello");

const text = await response.text();

console.log(response.status); // 200
console.log(text); // "hello"
```

### Intercept a request based on method Function

Set up the interceptor.

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";

const mockFetch = new MockFetch();

mockFetch
  .intercept("https://example.com/hello", {
    method: (input) => input === "GET",
  })
  .response("hello", { status: 200 });
```

Call the matching URL:

```typescript
const response = await fetch("https://example.com/hello");

const text = await response.text();

console.log(response.status); // 200
console.log(text); // "hello"
```

### Intercept a request based on URL RegExp

Set up the interceptor.

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";

const mockFetch = new MockFetch();

mockFetch
  .intercept(new RegExp("https\\:\\/\\/example\\.com\\/hello\\?foo\\=bar"))
  .response("hello", { status: 200 });
```

Call the matching URL:

```typescript
const response = await fetch("https://example.com/hello?foo=bar");

const text = await response.text();

console.log(response.status); // 200
console.log(text); // "hello"
```

### Intercept a request based on URL Function

Set up the interceptor.

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";

const mockFetch = new MockFetch();

mockFetch
  .intercept((input) => input === "https://example.com/hello?foo=bar")
  .response("hello", { status: 200 });
```

Call the matching URL:

```typescript
const response = await fetch("https://example.com/hello?foo=bar");

const text = await response.text();

console.log(response.status); // 200
console.log(text); // "hello"
```

### Intercept a request based on body

Set up the interceptor.

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";

const mockFetch = new MockFetch();

mockFetch
  .intercept("https://example.com/hello", {
    method: "POST",
    body: "hello",
  })
  .response("there", { status: 200 });
```

Call the matching URL:

```typescript
const response = await fetch("https://example.com/hello", {
  method: "POST",
  body: "hello",
});

const text = await response.text();

console.log(response.status); // 200
console.log(text); // "there"
```

Note, the following body types are also supported:

- `string`
- `RegExp`
- `(input: string) => boolean`
- `Blob`
- `ArrayBufferLike`
- `FormData`
- `URLSearchParams`

### Intercept a request based on headers object

Set up the interceptor.

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";

const mockFetch = new MockFetch();

mockFetch
  .intercept("https://example.com/hello", {
    headers: {
      hello: "there",
      foo: /bar/,
      hey: (input: string) => input === "ho",
    },
  })
  .response("hello", { status: 200 });
```

Call the matching URL:

```typescript
const response = await fetch("https://example.com/hello", {
  headers: new Headers({
    hello: "there",
    foo: "bar",
    hey: "ho",
  }),
});

const text = await response.text();

console.log(response.status); // 200
console.log(text); // "hello"
```

### Intercept a request based on headers instance

Set up the interceptor.

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";

const mockFetch = new MockFetch();

mockFetch
  .intercept("https://example.com/hello", {
    headers: new Headers({
      hello: "there",
      another: "one",
    }),
  })
  .response("hello", { status: 200 });
```

Call the matching URL:

```typescript
const response = await fetch("https://example.com/hello", {
  headers: new Headers({
    hello: "there",
    another: "one",
  }),
});

const text = await response.text();

console.log(response.status); // 200
console.log(text); // "hello"
```

### Intercept a request based on headers array

Set up the interceptor.

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";

const mockFetch = new MockFetch();

mockFetch
  .intercept("https://example.com/hello", {
    headers: [
      ["hello", "there"],
      ["foo", /bar/],
      ["hey", (input: string) => input === "ho"],
    ],
  })
  .response("hello", { status: 200 });
```

Call the matching URL:

```typescript
const response = await fetch("https://example.com/hello", {
  headers: new Headers({
    hello: "there",
    foo: "bar",
    hey: "ho",
  }),
});

const text = await response.text();

console.log(response.status); // 200
console.log(text); // "hello"
```

### Intercept a request based on headers function

Set up the interceptor.

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";

const mockFetch = new MockFetch();

mockFetch
  .intercept("https://example.com/hello", {
    headers: (headers) => headers.get("hello") === "there",
  })
  .response("hello", { status: 200 });
```

Call the matching URL:

```typescript
const response = await fetch("https://example.com/hello", {
  headers: new Headers({
    hello: "there",
  }),
});

const text = await response.text();

console.log(response.status); // 200
console.log(text); // "hello"
```

### Throw a custom error upon fetch call

Set up the interceptor and defined an error using the following
[documentation](https://developer.mozilla.org/en-US/docs/Web/API/fetch#exceptions)
as a guide.

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";

const mockFetch = new MockFetch();

mockFetch
  .intercept((input) => input === "https://example.com/hello")
  .throwError(new TypeError("Network error"));
```

Call the matching URL:

```typescript
await fetch("https://example.com/hello"); // Throws the defined error: new TypeError("Network error")
```

### Set default headers

Set up the interceptor.

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";

const mockFetch = new MockFetch();

const mockInterceptor = mockFetch
  .intercept("https://example.com/hello")
  .defaultResponseHeaders({ foo: "bar" })
  .response("hello", { status: 200 });
```

Call the matching URL:

```typescript
const response = await fetch("https://example.com/hello");
const text = await response.text();

console.log(response.status); // 200
console.log(response.headers); // { "content-type", "text/plain;charset=UTF-8", foo: "bar" }
console.log(text); // "hello"
```

### Autogenerate `content-length` header

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";

const mockFetch = new MockFetch();

const mockInterceptor = mockFetch
  .intercept("https://example.com/hello")
  .responseContentLength()
  .response("hello", { status: 200 });
```

Call the matching URL:

```typescript
const response = await fetch("https://example.com/hello");
const text = await response.text();

console.log(response.status); // 200
console.log(response.headers); // { "content-type", "text/plain;charset=UTF-8", "content-length": "5" }
console.log(text); // "hello"
```

### Intercept requests alongside superdeno

To work alongside superdeno, one must setup calls to `127.0.0.1` before
continuing.

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";
import { superdeno } from "https://deno.land/x/superdeno/mod.ts";
import { opine } from "https://deno.land/x/opine@1.9.1/mod.ts";

const app = opine();

app.get("/user", (req, res) => {
  res.setStatus(200).json({ name: "Deno" });
});

// Setup mock before calling superdeno
const mockFetch = new MockFetch();
mockFetch.activateNetConnect("127.0.0.1");

superdeno(app)
  .get("/user")
  .expect("Content-Type", /json/)
  .expect("Content-Length", "15")
  .expect(200)
  .end((err, res) => {
    if (err) throw err;
  });
```

## API Documentation

To browse API documentation:

- Go to https://deno.land/x/deno_mock_fetch.
- Click "View Documentation".

## Contributing

Contributions, issues and feature requests are very welcome. If you are using
this package and fixed a bug for yourself, please consider submitting a PR!

Further details can be found in the [Contributing guide](./CONTRIBUTING.md).

## Limitations

The following limitations are known:

### Cannot intercept with a ReadableStream as the request body

The following with throw an `InvalidArgumentError`:

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";

const mockFetch = new MockFetch();
mockFetch.intercept("https://example.com/hello", {
  method: "POST",
  body: new ReadableStream(),
});
// Throws an `InvalidArgumentError`
```

### No support for trailers

Trailers are currently not supported for the following reasons:

- Not returned in
  [Deno fetch responses](https://github.com/denoland/deno/issues/16200)
- Limited
  [support and documentation](https://developer.mozilla.org/en-US/docs/Web/API/Response)

## License

This module is 100% free and open-source, under the [MIT license](./LICENSE).

## Inspirations

This modules has been inspired by the following:

- [`undici`](https://www.npmjs.com/package/undici)
- [`nock`](https://www.npmjs.com/package/nock)
