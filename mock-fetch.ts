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
   * @param input The request input of the `fetch` API call.
   * @param init The request init input of the `fetch` API call.
   * @returns {MockInterceptor} A Mock Interceptor that allows further customisation of the Request mocking.
   *
   * @example
   * const mockFetch = new MockFetch();
   * mockFetch
   *   // Intercept `GET https://example.com/hello`
   *   .intercept("https://example.com/hello", { method: "GET" })
   *   // Reply with status `200` and text `hello`
   *   .reply("hello", { status: 200 });
   */
  public intercept(
    input: URL | Request | string,
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
   *
   * @param {MockMatcher} matcher The Net Connect Hostname Matcher.
   */
  activateNetConnect(
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
    init?: MockRequestInit,
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
        const origin = requestKey.url.origin;
        if (this.#netConnect === false) {
          throw new MockNotMatchedError(
            `${error.message}: subsequent request to origin ${origin} was not allowed (net.connect deactivated)`,
          );
        }
        if (this.#checkNetConnect(this.#netConnect, requestKey.url)) {
          return this.#originalFetch(input, init);
        } else {
          throw new MockNotMatchedError(
            `${error.message}: subsequent request to origin ${origin} was not allowed (net.connect is not activated for this origin)`,
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
  async #mockFetch(mockRequest: MockRequest) {
    // TODO: error
    // // If specified, trigger dispatch error
    // if (error !== null) {
    //   deleteMockRequest(this[kDispatches], key);
    //   handler.onError(error);
    //   return true;
    // }

    // Delay
    if (typeof mockRequest.delay === "number" && mockRequest.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, mockRequest.delay));
    }

    // Update mock request metadata and return response
    const updatedMockRequest = this.#updateMockRequest(mockRequest);
    return Promise.resolve(updatedMockRequest.response);
  }

  #checkNetConnect(netConnect: boolean | MockMatcher[], url: URL): boolean {
    if (netConnect === true) {
      return true;
    } else if (
      Array.isArray(netConnect) &&
      netConnect.some((matcher) => matchValue(matcher, url.host))
    ) {
      return true;
    }
    return false;
  }
}
