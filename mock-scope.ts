import { InvalidArgumentError } from "./mock-fetch.error.ts";
import { MockRequest } from "./mock-fetch.type.ts";

/**
 * Defines the scope API for an interceptor response
 */
export class MockScope {
  #mockRequest: MockRequest;

  constructor(mockRequest: MockRequest) {
    this.#mockRequest = mockRequest;
  }

  /**
   * Delay a response by a set amount in ms.
   */
  delay(waitInMs: number) {
    if (!Number.isInteger(waitInMs) || waitInMs <= 0) {
      throw new InvalidArgumentError(
        "Invalid delay: waitInMs must be a valid integer > 0",
      );
    }

    this.#mockRequest.delay = waitInMs;
    return this;
  }

  /**
   * For a defined response, never mark as consumed.
   */
  persist() {
    this.#mockRequest.persist = true;
    return this;
  }

  /**
   * Allow one to define a response for a set amount of matching requests.
   */
  times(repeatTimes: number) {
    if (!Number.isInteger(repeatTimes) || repeatTimes <= 0) {
      throw new InvalidArgumentError(
        "Invalid times input: repeatTimes must be a valid integer > 0",
      );
    }

    this.#mockRequest.times = repeatTimes;
    return this;
  }

  /**
   * Mock Request Metadata for the Mock Scope.
   */
  get metadata(): Readonly<MockRequest> {
    return this.#mockRequest;
  }
}
