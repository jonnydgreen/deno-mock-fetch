import {
  MockMatcher,
  MockRequest,
  MockRequestInit,
} from "./mock-fetch.type.ts";
import { MockScope } from "./mock-scope.ts";
import { isMockMatcher, safeURL } from "./mock-utils.ts";

/**
 * Defines an interceptor for a Mock
 */
export class MockInterceptor {
  readonly #mockRequests: MockRequest[];
  readonly #input: URL | Request | MockMatcher;
  readonly #init?: MockRequestInit;
  readonly #defaultRequest = new Request("https://example.com");

  constructor(
    mockRequests: MockRequest[],
    input: URL | Request | MockMatcher,
    init?: MockRequestInit,
  ) {
    this.#mockRequests = mockRequests;
    this.#input = input;
    this.#init = init;

    // TODO: support URI fragments
  }

  /**
   * Mock a request with a defined reply.
   */
  reply(body?: BodyInit | null, init?: ResponseInit) {
    const mockRequest: MockRequest = {
      request: {
        input: this.#input,
        init: this.#init,
        method: this.#methodMatcher(),
        url: this.#urlMatcher(),
      },
      get response() {
        return new Response(body, init);
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

  // TODO
  // /**
  //  * Mock a request with a defined error.
  //  */
  // replyWithError (error) {
  // }

  // TODO
  // /**
  //  * Set default reply headers on the interceptor for subsequent replies
  //  */
  // defaultReplyHeaders (headers) {
  // }

  // TODO
  // /**
  //  * Set default reply trailers on the interceptor for subsequent replies
  //  */
  // defaultReplyTrailers (trailers) {
  // }

  // TODO
  // /**
  //  * Set reply content length header for replies on the interceptor
  //  */
  // replyContentLength () {
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
}
