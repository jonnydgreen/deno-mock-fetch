import { MockNotMatchedError } from "./mock-fetch.error.ts";
import {
  Fetch,
  MockMatcher,
  MockRequest,
  MockRequestInit,
} from "./mock-fetch.type.ts";
import { MockInterceptor } from "./mock-interceptor.ts";
import { getMockRequest, matchValue } from "./mock-utils.ts";
import { buildKey } from "./mock-utils.ts";

const originalFetch = globalThis.fetch.bind(globalThis);

/**
 * Deno Mock Fetch class.
 *
 * Instantiate this to set up global `fetch` API interception.
 */
export class MockFetch {
  readonly #originalFetch: Fetch;
  #mockRequests: MockRequest[] = [];
  #calls = 0;
  #isMockActive = true;
  #netConnect: boolean | MockMatcher[];

  constructor() {
    this.#originalFetch = originalFetch;
    this.#netConnect = false;

    globalThis.fetch = this.#fetch.bind(this);
  }

  /**
   * Intercept a global `fetch` API call for the defined inputs.
   *
   * ```typescript
   * import { MockFetch } from "https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts";
   *
   * const mockFetch = new MockFetch();
   * mockFetch
   *   // Intercept `GET https://example.com/hello`
   *   .intercept("https://example.com/hello", { method: "GET" })
   *   // Response with status `200` and text `hello`
   *   .response("hello", { status: 200 });
   * ```
   */
  public intercept(
    /**
     * The request input of the `fetch` API call.
     */
    input: URL | Request | MockMatcher,
    /**
     * The request init input of the `fetch` API call.
     */
    init?: MockRequestInit,
  ): MockInterceptor {
    const interceptor = new MockInterceptor(this.#mockRequests, input, init);
    return interceptor;
  }

  /**
   * The total number of times Mock Fetch has been called.
   */
  public get calls(): number {
    return this.#calls;
  }

  /**
   * Upon close, cleanup
   */
  public close(): void {
    globalThis.fetch = this.#originalFetch;
    this.#calls = 0;
    this.#isMockActive = false;
    this.#mockRequests = [];
  }

  /**
   * Deactivate Mock Fetch, preserving current state.
   */
  public deactivate() {
    this.#isMockActive = false;
  }

  /**
   * Deactivate Mock Fetch, restoring current state.
   */
  public activate() {
    this.#isMockActive = true;
  }

  /**
   * Indicator for whether MockFetch is active or not.
   */
  public get isMockActive() {
    return this.#isMockActive;
  }

  /**
   * Activate Net Connect support.
   */
  activateNetConnect(
    /**
     * The Net Connect Hostname Matcher.
     */
    matcher?: MockMatcher,
  ) {
    if (matcher) {
      if (Array.isArray(this.#netConnect)) {
        this.#netConnect.push(matcher);
      } else {
        this.#netConnect = [matcher];
      }
    } else {
      this.#netConnect = true;
    }
  }

  /**
   * Deactivate Net Connect support.
   */
  deactivateNetConnect() {
    this.#netConnect = false;
  }

  async #fetch(
    input: URL | Request | string,
    init?: RequestInit,
  ): Promise<Response> {
    if (!this.#isMockActive) {
      return this.#originalFetch(input, init);
    }

    // Run any required initialisations
    await this.#init();

    // Get Mock Request
    const requestKey = await buildKey(input, init);
    try {
      const mockRequest = getMockRequest(this.#mockRequests, requestKey);
      return await this.#mockFetch(mockRequest);
    } catch (error: unknown) {
      // Handle Net Connect
      if (error instanceof MockNotMatchedError) {
        const hostname = requestKey.url.hostname;
        if (this.#netConnect === false) {
          throw new MockNotMatchedError(
            `${error.message}: subsequent request to hostname ${hostname} was not allowed (Net Connect deactivated)`,
          );
        }
        if (this.#checkNetConnect(this.#netConnect, requestKey.url)) {
          return this.#originalFetch(input, init);
        } else {
          throw new MockNotMatchedError(
            `${error.message}: subsequent request to hostname ${hostname} was not allowed (Net Connect is not activated for this hostname)`,
          );
        }
      } else {
        throw error;
      }
    }
  }

  #updateMockRequest(mockRequest: MockRequest): MockRequest {
    this.#calls++;
    // If it's used up and not persistent, mark as consumed
    const calls = ++mockRequest.calls;
    mockRequest.consumed = !mockRequest.persist && calls >= mockRequest.times;
    mockRequest.pending = calls < mockRequest.times;
    return mockRequest;
  }

  /**
   * Mock fetch function used to simulate fetch calls.
   */
  async #mockFetch(mockRequest: MockRequest): Promise<Response> {
    // If specified, simulate a delay
    if (mockRequest.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, mockRequest.delay));
    }

    // Update mock request metadata
    const updatedMockRequest = this.#updateMockRequest(mockRequest);

    // If specified, throw the defined error
    if (mockRequest.error) {
      throw mockRequest.error;
    }

    // Otherwise, return response
    return Promise.resolve(updatedMockRequest.response);
  }

  #checkNetConnect(netConnect: boolean | MockMatcher[], url: URL): boolean {
    if (netConnect === true) {
      return true;
    } else if (
      Array.isArray(netConnect) &&
      netConnect.some((matcher) => matchValue(matcher, url.hostname))
    ) {
      return true;
    }
    return false;
  }

  /**
   * Initialise the mock requests for interception.
   * This happens before every fetch call.
   */
  async #init(): Promise<void> {
    await Promise.all(this.#mockRequests.map(async (mockRequest) => {
      if (!mockRequest.request.body) {
        await this.#setupMockRequestBody(mockRequest);
      }
    }));
  }

  /**
   * Setup the mock request body for subsequent interception. It sets up the following:
   *  - If input is a Request and the body is not consumed, render the body text
   *  - If init.body is a Blob, render the Blob text
   *  - If init.body is an ArrayBufferView, render the decoded view
   *  - If init.body is a FormData instance, render the FormData as text
   *  - If init.body is a URLSearchParams instance, render the params as a string
   */
  async #setupMockRequestBody(mockRequest: MockRequest): Promise<void> {
    if (
      mockRequest.request.input instanceof Request &&
      !mockRequest.request.input.bodyUsed
    ) {
      mockRequest.request.body = await mockRequest.request.input.text();
    } else if (mockRequest.request.init?.body) {
      const body = mockRequest.request.init?.body;
      if (body instanceof Blob) {
        mockRequest.request.body = await body.text();
      } else if ((body as ArrayBufferView).buffer instanceof ArrayBuffer) {
        mockRequest.request.body = new TextDecoder().decode(
          body as ArrayBufferView,
        );
      } else if (body instanceof FormData) {
        mockRequest.request.body = JSON.stringify([...body.entries()]);
      } else if (body instanceof URLSearchParams) {
        mockRequest.request.body = body.toString();
      }
    }
  }
}
