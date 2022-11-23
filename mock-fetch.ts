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
   * import { MockFetch } from "https://deno.land/x/deno_mock_fetch@0.2.0/mod.ts";
   *
   * const mockFetch = new MockFetch();
   * mockFetch
   *   // Intercept `GET https://example.com/hello`
   *   .intercept("https://example.com/hello", { method: "GET" })
   *   // Reply with status `200` and text `hello`
   *   .reply("hello", { status: 200 });
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

    // Get Mock Request
    const requestKey = buildKey(input, init);
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
   * Mock dispatch function used to simulate fetch calls.
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
}
