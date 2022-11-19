import { MockRequest, MockRequestInit } from "./mock-fetch.type.ts";
import { MockScope } from "./mock-scope.ts";

/**
 * Defines an interceptor for a Mock
 */
export class MockInterceptor {
  #mockRequest: Request;
  #mockRequests: MockRequest[];

  constructor(
    mockRequests: MockRequest[],
    input: URL | Request | string,
    init?: MockRequestInit,
  ) {
    this.#mockRequest = new Request(input, init);
    this.#mockRequests = mockRequests;

    // TODO: support URI fragments
  }

  /**
   * Mock a request with a defined reply.
   */
  reply(body?: BodyInit | null, init?: ResponseInit) {
    const mockRequest: MockRequest = {
      request: this.#mockRequest,
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
}
