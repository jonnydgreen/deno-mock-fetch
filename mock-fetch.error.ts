export class InvalidArgumentError extends Error {
  override name = "InvalidArgumentError";
  constructor(message: string) {
    super(message);
  }
}

export class MockNotMatchedError extends Error {
  override name = "MockNotMatchedError";
  constructor(message: string) {
    super(message);
  }
}
