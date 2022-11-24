import * as blocks from "https://deno.land/std@0.163.0/testing/bdd.ts";
import * as asserts from "https://deno.land/std@0.163.0/testing/asserts.ts";
import { FakeTime } from "https://deno.land/std@0.163.0/testing/time.ts";
import { MockFetch } from "./mod.ts";
import {
  InvalidArgumentError,
  MockNotMatchedError,
} from "./mock-fetch.error.ts";

blocks.describe("deno-mock-fetch", () => {
  let mockFetch: MockFetch;

  blocks.beforeEach(() => {
    mockFetch = new MockFetch();
  });

  blocks.afterEach(() => {
    mockFetch.close();
  });

  blocks.describe("calls", () => {
    blocks.it("should increment the number of calls", async () => {
      // Arrange
      mockFetch
        .intercept("https://example.com/hello", { method: "GET" })
        .response("hello", { status: 200 }).persist();

      // Act and Assert
      asserts.assertEquals(mockFetch.calls, 0);
      await fetch("https://example.com/hello", { method: "GET" });
      asserts.assertEquals(mockFetch.calls, 1);
      await fetch("https://example.com/hello", { method: "GET" });
      asserts.assertEquals(mockFetch.calls, 2);
    });
  });

  blocks.describe("activate", () => {
    blocks.it("should activate the interceptor", async () => {
      // Arrange
      mockFetch.deactivate();
      mockFetch
        .intercept("https://example.com/hello", { method: "GET" })
        .response("hello", { status: 200 }).persist();
      mockFetch.activate();

      // Act
      const response = await fetch("https://example.com/hello", {
        method: "GET",
      });
      const text = await response.text();

      // Assert
      asserts.assertEquals(mockFetch.isMockActive, true);
      asserts.assertEquals(response.status, 200);
      asserts.assertEquals(text, "hello");
    });
  });

  blocks.describe("deactivate", () => {
    blocks.it("should deactivate the interceptor", async () => {
      // Arrange
      mockFetch.activate();
      mockFetch
        .intercept("https://example.com/hello", { method: "GET" })
        .response("hello", { status: 200 }).persist();
      mockFetch.deactivate();

      // Act
      const error = await asserts.assertRejects(() =>
        fetch("https://example.com/hello", {
          method: "GET",
        })
      );

      // Assert
      asserts.assertEquals(mockFetch.isMockActive, false);
      asserts.assertIsError(
        error,
        Deno.errors.PermissionDenied,
        'Requires net access to "example.com"',
      );
    });
  });

  blocks.describe("intercept", () => {
    blocks.it("should intercept a basic request", async () => {
      // Arrange
      const mockScope = mockFetch
        .intercept("https://example.com/hello", { method: "GET" })
        .response("hello", { status: 200 });

      // Act
      const response = await fetch("https://example.com/hello", {
        method: "GET",
      });
      const text = await response.text();

      // Assert
      asserts.assertEquals(mockFetch.isMockActive, true);
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
        .response("hello", { status: 200 });

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

    blocks.it("should support a Request-based interceptor", async () => {
      // Arrange
      const request = new Request("https://example.com/hello", {
        method: "GET",
      });
      const mockScope = mockFetch
        .intercept(request)
        .response("hello", { status: 200 });

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

    blocks.it("should support an input Request", async () => {
      // Arrange
      const mockScope = mockFetch
        .intercept("https://example.com/hello", { method: "GET" })
        .response("hello", { status: 200 });

      // Act
      const response = await fetch(new Request("https://example.com/hello"));
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

    blocks.it("should support an non-init input", async () => {
      // Arrange
      const mockScope = mockFetch
        .intercept("https://example.com/hello", { method: "GET" })
        .response("hello", { status: 200 });

      // Act
      const response = await fetch("https://example.com/hello");
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

    blocks.it("should support throwing an error", async () => {
      // Arrange
      const mockScope = mockFetch
        .intercept("https://example.com/hello")
        .throwError(new TypeError("Network error"));

      // Act
      const error = await asserts.assertRejects(() =>
        fetch("https://example.com/hello")
      );

      // Assert
      asserts.assertEquals(mockFetch.isMockActive, true);
      asserts.assertIsError(error, TypeError, "Network error");
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
    });

    blocks.describe("when matching by method", () => {
      [
        {
          name: "should support matching by method string",
          input: "POST",
        },
        {
          name: "should support matching by method RegExp",
          input: /POST/,
        },
        {
          name: "should support matching by method function",
          input: (input: string) => input === "POST",
        },
      ].forEach((test) => {
        blocks.it(test.name, async () => {
          // Arrange
          const mockScope = mockFetch
            .intercept(new URL("https://example.com/hello"), {
              method: test.input,
            })
            .response("hello", { status: 200 });

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
      });
    });

    blocks.describe("when matching by query string", () => {
      [
        {
          name: "should support matching by query string string type",
          input: "https://example.com/hello?foo=bar",
        },
        {
          name: "should support matching by query string RegExp",
          input: new RegExp("https\\:\\/\\/example\\.com\\/hello\\?foo\\=bar"),
        },
        {
          name: "should support matching by query string function",
          input: (input: string) =>
            input === "https://example.com/hello?foo=bar",
        },
      ].forEach((test) => {
        blocks.it(test.name, async () => {
          // Arrange
          const mockScope = mockFetch
            .intercept(test.input, {
              method: "GET",
            })
            .response("hello", { status: 200 });

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
          const response = await fetch(
            new URL("https://example.com/hello?foo=bar"),
            {
              method: "GET",
            },
          );
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
      });
    });

    blocks.describe("when matching by body", () => {
      const formData1 = new FormData();
      formData1.set("hello", "there");
      const formData2 = new FormData();
      formData2.set("hello", "there");
      [
        {
          name: "should support matching by body string type",
          input: "hello",
          body: "hello",
        },
        {
          name: "should support matching by body RegExp type",
          input: /hello/,
          body: "hello",
        },
        {
          name: "should support matching by body function type",
          input: (input: string) => input === "hello",
          body: "hello",
        },
        {
          name: "should support matching by body Blob type",
          input: new Blob(["hello"]),
          body: "hello",
        },
        {
          name: "should support matching by body ArrayBufferLike type",
          input: new TextEncoder().encode("hello"),
          body: "hello",
        },
        {
          name: "should support matching by body FormData type",
          input: formData1,
          body: formData2,
        },
        {
          name: "should support matching by body URLSearchParams type",
          input: new URLSearchParams([["hello", "there"]]),
          body: "hello=there",
        },
        {
          name: "should error when matching by body ReadableStream",
          input: new ReadableStream(),
          body: "",
          error: {
            prototype: InvalidArgumentError,
            msg:
              "Matching a request body with a ReadableStream is not supported at this time",
          },
        },
      ].forEach((test) => {
        if (test.error) {
          blocks.it(test.name, () => {
            // Arrange and Act
            const error = asserts.assertThrows(() =>
              mockFetch
                .intercept(new URL("https://example.com/hello"), {
                  method: "POST",
                  body: test.input,
                })
            );

            // Assert
            asserts.assertIsError(error, test.error.prototype, test.error.msg);
          });
        } else {
          blocks.it(test.name, async () => {
            // Arrange
            const mockScope = mockFetch
              .intercept(new URL("https://example.com/hello"), {
                method: "POST",
                body: test.input,
              })
              .response("hello", { status: 200 });

            // Act
            const resultNoMatch = await asserts.assertRejects(() =>
              fetch(new URL("https://example.com/hello"), {
                method: "POST",
                body: "no-match",
              })
            );

            // Assert
            asserts.assertIsError(
              resultNoMatch,
              MockNotMatchedError,
              "Mock Request not matched for body 'no-match'",
            );

            // Act
            const response = await fetch(new URL("https://example.com/hello"), {
              method: "POST",
              body: test.body,
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
        }
      });
    });

    blocks.describe("when customising mock scope", () => {
      blocks.it("should support persisting requests", async () => {
        // Arrange
        const mockScope = mockFetch
          .intercept("https://example.com/hello", { method: "GET" })
          .response("hello", { status: 200 }).persist();

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
            .response("hello", { status: 200 }).times(2);

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

      blocks.it("should support delaying requests", async () => {
        // Arrange
        const time = new FakeTime();

        try {
          const mockScope = mockFetch
            .intercept("https://example.com/hello", { method: "GET" })
            .response("hello", { status: 200 }).delay(1000);

          // Act
          const promise = fetch("https://example.com/hello", {
            method: "GET",
          }).then(async (response) => {
            const text = await response.text();
            asserts.assertEquals(response.status, 200);
            asserts.assertEquals(text, "hello");
            asserts.assertEquals(
              mockScope.metadata.calls,
              1,
              "Mock should be called",
            );
            asserts.assertEquals(
              mockScope.metadata.consumed,
              true,
              "Mock should be consumed",
            );
          });

          // Assert
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
          await time.tickAsync(500);
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
          await time.tickAsync(1000);
          asserts.assertEquals(
            mockScope.metadata.calls,
            1,
            "Mock should be called",
          );
          asserts.assertEquals(
            mockScope.metadata.consumed,
            true,
            "Mock should be consumed",
          );

          await promise;
        } finally {
          time.restore();
        }
      });
    });

    blocks.it(
      "should use default headers when default Response Headers are defined",
      async () => {
        // Arrange
        const interceptor = mockFetch
          .intercept("https://example.com/hello")
          .defaultResponseHeaders({ hello: "there" });

        interceptor.response("hello1", { status: 200 });
        interceptor.response("hello2", {
          status: 200,
          headers: { foo: "bar" },
        });
        interceptor.response("hello3", { status: 200, headers: { hi: "ho" } });

        // Act
        const response1 = await fetch("https://example.com/hello");
        const text1 = await response1.text();
        const response2 = await fetch("https://example.com/hello");
        const text2 = await response2.text();

        interceptor.defaultResponseHeaders({ hey: "hey" });

        const response3 = await fetch("https://example.com/hello");
        const text3 = await response3.text();

        // Assert
        asserts.assertEquals(response1.status, 200);
        asserts.assertEquals(text1, "hello1");
        asserts.assertEquals(
          [...response1.headers.entries()],
          [["content-type", "text/plain;charset=UTF-8"], ["hello", "there"]],
        );
        asserts.assertEquals(response2.status, 200);
        asserts.assertEquals(text2, "hello2");
        asserts.assertEquals(
          [...response2.headers.entries()],
          [["content-type", "text/plain;charset=UTF-8"], ["foo", "bar"], [
            "hello",
            "there",
          ]],
        );
        asserts.assertEquals(response3.status, 200);
        asserts.assertEquals(text3, "hello3");
        asserts.assertEquals(
          [...response3.headers.entries()],
          [["content-type", "text/plain;charset=UTF-8"], ["hey", "hey"], [
            "hi",
            "ho",
          ]],
        );
      },
    );

    blocks.it(
      "should not treat URI fragment as part of the URL-based request matching",
      async () => {
        // Arrange
        const mockScope = mockFetch
          .intercept("https://example.com/hello#some-fragment")
          .response("hello", { status: 200 });

        // Act
        const response = await fetch("https://example.com/hello");
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
      },
    );
  });

  blocks.describe("activateNetConnect", () => {
    blocks.it(
      "should support calling a real endpoint",
      async () => {
        // Arrange
        mockFetch.activateNetConnect();
        const mockScope = mockFetch
          .intercept(new URL("https://example.com/hello"), { method: "GET" })
          .response("hello", { status: 200 });

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
          'Requires net access to "example.com"',
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

    blocks.it(
      "should support calling a real endpoint for a matching hostname",
      async () => {
        // Arrange
        mockFetch.activateNetConnect("example.com");
        const mockScope = mockFetch
          .intercept(new URL("https://example.com/hello"), { method: "GET" })
          .response("hello", { status: 200 });

        // Act
        const resultNoMatch = await asserts.assertRejects(() =>
          fetch(new URL("https://example.com/foo"), {
            method: "GET",
          })
        );
        const resultMockNotMatched = await asserts.assertRejects(() =>
          fetch(new URL("https://wrong-example.com/foo"), {
            method: "GET",
          })
        );

        // Assert
        asserts.assertIsError(
          resultNoMatch,
          Deno.errors.PermissionDenied,
          'Requires net access to "example.com"',
        );
        asserts.assertIsError(
          resultMockNotMatched,
          MockNotMatchedError,
          "Mock Request not matched for URL 'https://wrong-example.com/foo': subsequent request to hostname wrong-example.com was not allowed (Net Connect is not activated for this hostname)",
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

    blocks.it(
      "should support calling a real endpoint for matching hostnames",
      async () => {
        // Arrange
        mockFetch.activateNetConnect("example.com");
        mockFetch.activateNetConnect("another-example.com");
        mockFetch
          .intercept(new URL("https://example.com/hello"), { method: "GET" })
          .response("hello", { status: 200 });
        mockFetch
          .intercept(new URL("https://another-example.com/hello"), {
            method: "GET",
          })
          .response("hello", { status: 200 });

        // Act
        const resultNoMatch1 = await asserts.assertRejects(() =>
          fetch(new URL("https://example.com/foo"), {
            method: "GET",
          })
        );
        const resultNoMatch2 = await asserts.assertRejects(() =>
          fetch(new URL("https://another-example.com/foo"), {
            method: "GET",
          })
        );
        const resultMockNotMatched = await asserts.assertRejects(() =>
          fetch(new URL("https://wrong-example.com/foo"), {
            method: "GET",
          })
        );

        // Assert
        asserts.assertIsError(
          resultNoMatch1,
          Deno.errors.PermissionDenied,
          'Requires net access to "example.com"',
        );
        asserts.assertIsError(
          resultNoMatch2,
          Deno.errors.PermissionDenied,
          'Requires net access to "another-example.com"',
        );
        asserts.assertIsError(
          resultMockNotMatched,
          MockNotMatchedError,
          "Mock Request not matched for URL 'https://wrong-example.com/foo': subsequent request to hostname wrong-example.com was not allowed (Net Connect is not activated for this hostname)",
        );
      },
    );
  });

  blocks.describe("deactivateNetConnect", () => {
    blocks.it(
      "should not call a real endpoint when net connected is deactivated",
      async () => {
        // Arrange
        mockFetch.activateNetConnect();
        mockFetch.deactivateNetConnect();
        const mockScope = mockFetch
          .intercept(new URL("https://example.com/hello"), { method: "GET" })
          .response("hello", { status: 200 });

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
          "Mock should be called",
        );
        asserts.assertEquals(
          mockScope.metadata.consumed,
          true,
          "Mock should be consumed",
        );
      },
    );
  });
});
