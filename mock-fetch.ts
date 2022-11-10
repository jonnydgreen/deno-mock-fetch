import { Fetch, MockRequest, MockRequestKey } from "./mock-fetch.type.ts";
import { MockInterceptor } from "./mock-interceptor.ts";
import { getMockRequest } from "./mock-utils.ts";
import { buildKey } from "./mock-utils.ts";

export class MockFetch {
  readonly #originalFetch: Fetch;
  #mockRequests: MockRequest[] = [];
  #calls = 0;
  #isMockActive = true;

  constructor() {
    this.#originalFetch = globalThis.fetch.bind(globalThis);

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
    init?: RequestInit,
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

  #fetch(input: URL | Request | string, init?: RequestInit): Promise<Response> {
    if (!this.#isMockActive) {
      return this.#originalFetch(input, init);
    }

    const requestKey = buildKey(input, init);

    // TODO: net connect
    if (
      [
        "TODO",
      ].includes(requestKey.url.hostname)
    ) {
      return this.#originalFetch(input, init);
    }

    return this.#mockFetch(requestKey);
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
  async #mockFetch(requestKey: MockRequestKey) {
    // TODO: error
    // // If specified, trigger dispatch error
    // if (error !== null) {
    //   deleteMockRequest(this[kDispatches], key);
    //   handler.onError(error);
    //   return true;
    // }

    const mockRequest = getMockRequest(this.#mockRequests, requestKey);

    // Delay
    if (typeof mockRequest.delay === "number" && mockRequest.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, mockRequest.delay));
    }

    // Update mock request metadata and return response
    const updatedMockRequest = this.#updateMockRequest(mockRequest);
    return Promise.resolve(updatedMockRequest.response);
  }
}
