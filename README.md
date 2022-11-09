# mock-fetch

Deno mock fetch implementation. This module allows one to intercept calls to the
global `fetch` API and control the behaviour accordingly.

## Features

- Intercept calls to the global `fetch` API.
- Intercept multiple types of requests at once, based on:
  - Request Origin
  - Request Path
  - Request Query string
  - Request Body
  - Request Headers
- Intercept request indefinitely
- Intercept request a finite number of times
- Simulate a request time delay

## Upcoming features

- Add `net.connect` support for custom hostnames
- Add throw error support
- Ensure all global `fetch` API inputs are supported
- Set default headers
- Set default trailers
- Auto-generated headers
- Auto-generated trailers
- Full docs coverage in markdown
- Full docs coverage in defined code
- Full test coverage

## Examples

### Basic Usage

Set up a basic `fetch` interceptor.

```typescript
import { MockFetch } from "https://deno.land/x/deno_mock_fetch@0.1.0/mod.ts";

const mockFetch = new MockFetch();

mockFetch
  // Intercept `GET https://example.com/hello`
  .intercept("https://example.com/hello", { method: "GET" })
  // Reply with status `200` and text `hello`
  .reply("hello", { status: 200 });
```

## Contributing

Contributions, issues and feature requests are very welcome. If you are using
this package and fixed a bug for yourself, please consider submitting a PR!

## License

This module is 100% free and open-source, under the [MIT license](./LICENSE).

## Inspirations

This modules has been inspired by the following:

- [`undici`](https://www.npmjs.com/package/undici)
- [`nock`](https://www.npmjs.com/package/nock)
