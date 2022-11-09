import * as blocks from "https://deno.land/std@0.163.0/testing/bdd.ts";
import * as asserts from "https://deno.land/std@0.163.0/testing/asserts.ts";
import { MockFetch } from "./mod.ts";
import { MockNotMatchedError } from "./errors.ts";

blocks.describe("mock-fetch", () => {
  blocks.it("should intercept a basic request", async () => {
    // Arrange
    const mockFetch = new MockFetch();
    const mockScope = mockFetch
      .intercept("https://example.com/hello", { method: "GET" })
      .reply("hello", { status: 200 });

    // Act
    const response = await fetch("https://example.com/hello", {
      method: "GET",
    });
    const text = await response.text();

    // Assert
    asserts.assertEquals(response.status, 200);
    asserts.assertEquals(text, "hello");
    asserts.assertEquals(
      mockScope.metadata.calls,
      1,
      "Mock should be called once",
    );
    asserts.assertEquals(
      mockScope.metadata.consumed,
      true,
      "Mock should be consumed",
    );

    // Act
    const result = await asserts.assertRejects(() =>
      fetch("https://example.com/hello", {
        method: "GET",
      })
    );

    // Assert
    asserts.assertIsError(
      result,
      MockNotMatchedError,
      "Mock Request not matched for URL 'https://example.com/hello'",
    );
  });

  blocks.it("should support persisting requests", async () => {
    // Arrange
    const mockFetch = new MockFetch();
    const mockScope = mockFetch
      .intercept("https://example.com/hello", { method: "GET" })
      .reply("hello", { status: 200 }).persist();

    // Act
    const response1 = await fetch("https://example.com/hello", {
      method: "GET",
    });
    const text1 = await response1.text();

    // Assert
    asserts.assertEquals(response1.status, 200);
    asserts.assertEquals(text1, "hello");
    asserts.assertEquals(
      mockScope.metadata.calls,
      1,
      "Mock should be called once",
    );
    asserts.assertEquals(
      mockScope.metadata.consumed,
      false,
      "Mock should not be consumed",
    );

    // Act
    const response2 = await fetch("https://example.com/hello", {
      method: "GET",
    });
    const text2 = await response2.text();

    // Assert
    asserts.assertEquals(response2.status, 200);
    asserts.assertEquals(text2, "hello");
    asserts.assertEquals(
      mockScope.metadata.calls,
      2,
      "Mock should be called twice",
    );
    asserts.assertEquals(
      mockScope.metadata.consumed,
      false,
      "Mock should not be consumed",
    );
  });

  blocks.it(
    "should support restricting requests to a specific number of calls",
    async () => {
      // Arrange
      const mockFetch = new MockFetch();
      const mockScope = mockFetch
        .intercept("https://example.com/hello", { method: "GET" })
        .reply("hello", { status: 200 }).times(2);

      // Act
      const response1 = await fetch("https://example.com/hello", {
        method: "GET",
      });
      const text1 = await response1.text();

      // Assert
      asserts.assertEquals(response1.status, 200);
      asserts.assertEquals(text1, "hello");
      asserts.assertEquals(
        mockScope.metadata.calls,
        1,
        "Mock should be called once",
      );
      asserts.assertEquals(
        mockScope.metadata.consumed,
        false,
        "Mock should not be consumed",
      );
      asserts.assertEquals(
        mockScope.metadata.pending,
        true,
        "Mock should be pending",
      );

      // Act
      const response2 = await fetch("https://example.com/hello", {
        method: "GET",
      });
      const text2 = await response2.text();

      // Assert
      asserts.assertEquals(response2.status, 200);
      asserts.assertEquals(text2, "hello");
      asserts.assertEquals(
        mockScope.metadata.calls,
        2,
        "Mock should be called twice",
      );
      asserts.assertEquals(
        mockScope.metadata.consumed,
        true,
        "Mock should be consumed",
      );
      asserts.assertEquals(
        mockScope.metadata.pending,
        false,
        "Mock should not be pending",
      );

      // Act
      const result = await asserts.assertRejects(() =>
        fetch("https://example.com/hello", {
          method: "GET",
        })
      );

      // Assert
      asserts.assertIsError(
        result,
        MockNotMatchedError,
        "Mock Request not matched for URL 'https://example.com/hello'",
      );
    },
  );
});
