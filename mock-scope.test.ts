import * as blocks from "https://deno.land/std@0.163.0/testing/bdd.ts";
import * as asserts from "https://deno.land/std@0.163.0/testing/asserts.ts";
import { InvalidArgumentError, MockRequest, MockScope } from "./mod.ts";

blocks.describe("MockScope", () => {
  blocks.describe("delay", () => {
    [
      {
        name: "should throw an error if a negative delay is passed",
        delay: -1,
        error: "Invalid delay: waitInMs must be a valid integer > 0",
      },
      {
        name: "should throw an error if a zero delay is passed",
        delay: 0,
        error: "Invalid delay: waitInMs must be a valid integer > 0",
      },
      {
        name: "should throw an error if a non-integer delay is passed",
        delay: 1.1,
        error: "Invalid delay: waitInMs must be a valid integer > 0",
      },
    ].forEach((test) => {
      blocks.it(test.name, () => {
        // Arrange
        const mockScope = new MockScope({} as unknown as MockRequest);

        // Act
        const error = asserts.assertThrows(() => mockScope.delay(test.delay));

        // Assert
        asserts.assertIsError(error, InvalidArgumentError, test.error);
      });
    });
  });

  blocks.describe("times", () => {
    [
      {
        name: "should throw an error if a negative input is passed",
        repeatTimes: -1,
        error: "Invalid times input: repeatTimes must be a valid integer > 0",
      },
      {
        name: "should throw an error if a zero input is passed",
        repeatTimes: 0,
        error: "Invalid times input: repeatTimes must be a valid integer > 0",
      },
      {
        name: "should throw an error if a non-integer input is passed",
        repeatTimes: 1.1,
        error: "Invalid times input: repeatTimes must be a valid integer > 0",
      },
    ].forEach((test) => {
      blocks.it(test.name, () => {
        // Arrange
        const mockScope = new MockScope({} as unknown as MockRequest);

        // Act
        const error = asserts.assertThrows(() =>
          mockScope.times(test.repeatTimes)
        );

        // Assert
        asserts.assertIsError(error, InvalidArgumentError, test.error);
      });
    });
  });
});
