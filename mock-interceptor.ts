import { InvalidArgumentError } from "./mock-fetch.error.ts";
import {
  MockMatcher,
  MockRequest,
  MockRequestInit,
} from "./mock-fetch.type.ts";
import { MockScope } from "./mock-scope.ts";
import { isMockMatcher, safeURL } from "./mock-utils.ts";

/**
 * Defines an interceptor for a Mock.
 * Instantiated when `MockFetch.intercept(...)` is called.
 */
export class MockInterceptor {
  readonly #mockRequests: MockRequest[];
  readonly #input: URL | Request | MockMatcher;
  readonly #init?: MockRequestInit;
  readonly #defaultRequest = new Request("https://example.com");
  #defaultHeadersInit?: HeadersInit;

  constructor(
    mockRequests: MockRequest[],
    input: URL | Request | MockMatcher,
    init?: MockRequestInit,
  ) {
    this.#mockRequests = mockRequests;
    this.#input = input;
    this.#init = init;

    if (this.#init?.body instanceof ReadableStream) {
      // TODO: add limitations section in the README
      throw new InvalidArgumentError(
        "Matching a request body with a ReadableStream is not supported at this time",
      );
    }

    // TODO: support URI fragments
  }

  /**
   * Mock a request with a defined response.
   */
  response(
    /**
     * Response body
     */
    body?: BodyInit | null,
    /**
     * Response response init definition.
     */
    init?: ResponseInit,
  ): MockScope {
    const getHeadersInit = this.#getDefaultHeadersInit.bind(this);
    const mockRequest: MockRequest = {
      request: {
        input: this.#input,
        init: this.#init,
        method: this.#methodMatcher(),
        url: this.#urlMatcher(),
        body: this.#bodyMatcher(),
      },
      get response() {
        const response = new Response(body, init);
        const headers = new Headers(getHeadersInit());
        for (const [key, value] of headers.entries()) {
          response.headers.append(key, value);
        }
        return response;
      },
      calls: 0,
      times: 0,
      delay: 0,
      consumed: false,
      pending: true,
      persist: false,
    };
    this.#mockRequests.push(mockRequest);
    return new MockScope(mockRequest);
  }

  /**
   * Mock a request with a defined error that will be thrown
   * when global `fetch` is called.
   */
  throwError(
    /** Error to be thrown. */
    error: Error,
  ): MockScope {
    const mockRequest: MockRequest = {
      request: {
        input: this.#input,
        init: this.#init,
        method: this.#methodMatcher(),
        url: this.#urlMatcher(),
        body: this.#bodyMatcher(),
      },
      response: new Response(),
      error,
      calls: 0,
      times: 0,
      delay: 0,
      consumed: false,
      pending: true,
      persist: false,
    };
    this.#mockRequests.push(mockRequest);
    return new MockScope(mockRequest);
  }

  /**
   * Set default response headers on the interceptor for subsequent responses
   */
  defaultResponseHeaders(headersInit: HeadersInit): MockInterceptor {
    this.#defaultHeadersInit = headersInit;
    return this;
  }

  #getDefaultHeadersInit(): HeadersInit | undefined {
    return this.#defaultHeadersInit;
  }

  // TODO
  // /**
  //  * Set response content length header for replies on the interceptor
  //  */
  // responseContentLength () {
  // }

  /**
   * Get interceptor method matcher
   */
  #methodMatcher(): MockMatcher {
    const method = this.#init?.method;
    return isMockMatcher(method) ? method : this.#defaultRequest.method;
  }

  /**
   * Get interceptor URL matcher
   */
  #urlMatcher(): MockMatcher {
    let url: MockMatcher;
    if (isMockMatcher(this.#input)) {
      url = this.#input;
    } else if (this.#input instanceof URL) {
      url = this.#input.href;
    } else {
      url = this.#input.url;
    }
    return typeof url === "string" ? safeURL(url) : url;
  }

  /**
   * Get interceptor body matcher
   *
   * Note, if input is of type Request, this will be handled in MockFetch initialisation.
   */
  #bodyMatcher(): MockMatcher | undefined {
    let body: MockMatcher | undefined;
    const initBody = this.#init?.body;
    if (isMockMatcher(initBody)) {
      body = initBody;
    }
    return body;
  }
}
