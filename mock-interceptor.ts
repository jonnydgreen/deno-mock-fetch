import { MockScope } from "./mock-scope.ts";
import { MockRequest } from "./mock-utils.ts";

/**
 * Defines an interceptor for a Mock
 */
export class MockInterceptor {
  #mockRequest: Request;
  #mockRequests: MockRequest[];

  constructor(
    mockRequests: MockRequest[],
    input: URL | Request | string,
    init?: RequestInit,
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
  //   if (typeof error === 'undefined') {
  //     throw new InvalidArgumentError('error must be defined')
  //   }

  //   const newMockDispatch = addMockDispatch(this.#Dispatches, this.#DispatchKey, { error })
  //   return new MockScope(newMockDispatch)
  // }

  // TODO
  // /**
  //  * Set default reply headers on the interceptor for subsequent replies
  //  */
  // defaultReplyHeaders (headers) {
  //   if (typeof headers === 'undefined') {
  //     throw new InvalidArgumentError('headers must be defined')
  //   }

  //   this.#DefaultHeaders = headers
  //   return this
  // }

  // TODO
  // /**
  //  * Set default reply trailers on the interceptor for subsequent replies
  //  */
  // defaultReplyTrailers (trailers) {
  //   if (typeof trailers === 'undefined') {
  //     throw new InvalidArgumentError('trailers must be defined')
  //   }

  //   this.#DefaultTrailers = trailers
  //   return this
  // }

  // TODO
  // /**
  //  * Set reply content length header for replies on the interceptor
  //  */
  // replyContentLength () {
  //   this.#ContentLength = true
  //   return this
  // }
}
