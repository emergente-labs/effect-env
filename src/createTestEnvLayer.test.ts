import { Config, Effect } from "effect";
import { describe, it, expect } from "@effect/vitest";
import { createTestEnvLayer } from "./createTestEnvLayer";

describe("createTestEnvLayer", () => {
  it.effect("should provide env vars from a Map", () =>
    Effect.gen(function* () {
      const result = yield* Config.string("TEST_VAR");
      expect(result).toBe("test-value");
    }).pipe(
      Effect.provide(createTestEnvLayer(new Map([["TEST_VAR", "test-value"]]))),
    ),
  );

  it.effect("should provide env vars from a Record", () =>
    Effect.gen(function* () {
      const result = yield* Config.string("TEST_VAR");
      expect(result).toBe("test-value");
    }).pipe(
      Effect.provide(
        createTestEnvLayer({
          TEST_VAR: "test-value",
        }),
      ),
    ),
  );

  it.effect("should provide multiple env vars", () =>
    Effect.gen(function* () {
      const var1 = yield* Config.string("VAR_1");
      const var2 = yield* Config.string("VAR_2");

      expect(var1).toBe("value-1");
      expect(var2).toBe("value-2");
    }).pipe(
      Effect.provide(
        createTestEnvLayer({
          VAR_1: "value-1",
          VAR_2: "value-2",
        }),
      ),
    ),
  );
});
