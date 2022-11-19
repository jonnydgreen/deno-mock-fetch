import * as blocks from "https://deno.land/std@0.163.0/testing/bdd.ts";
import * as asserts from "https://deno.land/std@0.163.0/testing/asserts.ts";
import { MockFetch } from "./mod.ts";
import { MockNotMatchedError } from "./mock-fetch.error.ts";

blocks.describe("mock-fetch", () => {
  let mockFetch: MockFetch;

  blocks.beforeEach(() => {
    mockFetch = new MockFetch();
  });

  blocks.afterEach(() => {
    mockFetch.close();
  });

  blocks.it("should intercept a basic request", async () => {
    // Arrange
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

  blocks.it("should support an input URL", async () => {
    // Arrange
    const mockScope = mockFetch
      .intercept(new URL("https://example.com/hello"), { method: "GET" })
      .reply("hello", { status: 200 });

    // Act
    const response = await fetch(new URL("https://example.com/hello"), {
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
      fetch(new URL("https://example.com/hello"), {
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

  blocks.it("should support an input Request", async () => {
    // Arrange
    const request = new Request("https://example.com/hello", { method: "GET" });
    const mockScope = mockFetch
      .intercept(request)
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

  blocks.it("should support matching by method", async () => {
    // Arrange
    const mockScope = mockFetch
      .intercept(new URL("https://example.com/hello"), { method: "POST" })
      .reply("hello", { status: 200 });

    // Act
    const resultNoMatch = await asserts.assertRejects(() =>
      fetch(new URL("https://example.com/hello"), {
        method: "GET",
      })
    );

    // Assert
    asserts.assertIsError(
      resultNoMatch,
      MockNotMatchedError,
      "Mock Request not matched for method 'GET'",
    );

    // Act
    const response = await fetch(new URL("https://example.com/hello"), {
      method: "POST",
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
      fetch(new URL("https://example.com/hello"), {
        method: "POST",
      })
    );

    // Assert
    asserts.assertIsError(
      result,
      MockNotMatchedError,
      "Mock Request not matched for URL 'https://example.com/hello'",
    );
  });

  blocks.it("should support matching by query string", async () => {
    // Arrange
    const mockScope = mockFetch
      .intercept(new URL("https://example.com/hello?foo=bar"), {
        method: "GET",
      })
      .reply("hello", { status: 200 });

    // Act
    const resultNoMatch = await asserts.assertRejects(() =>
      fetch(new URL("https://example.com/hello?foo=baz"), {
        method: "GET",
      })
    );

    // Assert
    asserts.assertIsError(
      resultNoMatch,
      MockNotMatchedError,
      "Mock Request not matched for URL 'https://example.com/hello?foo=baz'",
    );

    // Act
    const response = await fetch(new URL("https://example.com/hello?foo=bar"), {
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
      fetch(new URL("https://example.com/hello?foo=bar"), {
        method: "GET",
      })
    );

    // Assert
    asserts.assertIsError(
      result,
      MockNotMatchedError,
      "Mock Request not matched for URL 'https://example.com/hello?foo=bar'",
    );
  });

  blocks.it("should support persisting requests", async () => {
    // Arrange
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

  blocks.describe("when net connect is activated", () => {
    blocks.it(
      "should support calling a real endpoint for matching hostnames",
      async () => {
        // Arrange
        mockFetch.activateNetConnect();
        const mockScope = mockFetch
          .intercept(new URL("https://example.com/hello"), { method: "GET" })
          .reply("hello", { status: 200 });

        // Act
        const resultNoMatch = await asserts.assertRejects(() =>
          fetch(new URL("https://example.com/foo"), {
            method: "GET",
          })
        );

        // Assert
        asserts.assertIsError(
          resultNoMatch,
          Deno.errors.PermissionDenied,
          'Requires net access to "example.com", run again with the --allow-net flag',
        );
        asserts.assertEquals(
          mockScope.metadata.calls,
          0,
          "Mock should not be called",
        );
        asserts.assertEquals(
          mockScope.metadata.consumed,
          false,
          "Mock should not be consumed",
        );
      },
    );
  });
});
