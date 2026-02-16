import {
  Config,
  ConfigError,
  ConfigProvider,
  Effect,
  Exit,
  Layer,
  Cause,
  Redacted,
} from "effect";
import { describe, it, expect } from "@effect/vitest";
import { createEnv } from "./createEnv";

const testEnvLayer = (envMap: Record<string, string>) =>
  Layer.setConfigProvider(
    ConfigProvider.fromMap(new Map(Object.entries(envMap))),
  );

describe("createEnv", () => {
  describe("async mode (default)", () => {
    it.effect("should resolve individual env vars with yield*", () =>
      Effect.gen(function* () {
        const { env } = createEnv({
          vars: {
            testVar: Config.string("TEST_VAR"),
          },
        });

        const result = yield* env.testVar;
        expect(result).toBe("test-value");
      }).pipe(
        Effect.provide(
          testEnvLayer({
            NODE_ENV: "development",
            TEST_VAR: "test-value",
          }),
        ),
      ),
    );

    it.effect("should resolve all env vars at once with yield*", () =>
      Effect.gen(function* () {
        const { env } = createEnv({
          vars: {
            testVar: Config.string("TEST_VAR"),
            anotherVar: Config.string("ANOTHER_VAR"),
          },
        });

        const result = yield* env;
        expect(result).toEqual({
          testVar: "test-value",
          anotherVar: "another-value",
        });
      }).pipe(
        Effect.provide(
          testEnvLayer({
            NODE_ENV: "development",
            TEST_VAR: "test-value",
            ANOTHER_VAR: "another-value",
          }),
        ),
      ),
    );

    it.effect("should use default value in development for optional vars", () =>
      Effect.gen(function* () {
        const { env } = createEnv({
          vars: {
            optionalVar: [
              Config.string("OPTIONAL_VAR"),
              "default-value",
            ] as const,
          },
        });

        const result = yield* env.optionalVar;
        expect(result).toBe("default-value");
      }).pipe(
        Effect.provide(
          testEnvLayer({
            NODE_ENV: "development",
          }),
        ),
      ),
    );

    it.effect("should fail for optional vars missing in production", () =>
      Effect.gen(function* () {
        const { env } = createEnv({
          vars: {
            optionalVar: [
              Config.string("OPTIONAL_VAR"),
              "default-value",
            ] as const,
          },
        });

        const result = yield* Effect.exit(env.optionalVar);

        expect(Exit.isFailure(result)).toBe(true);
        if (Exit.isFailure(result) && Cause.isFailType(result.cause)) {
          expect(ConfigError.isConfigError(result.cause.error)).toBe(true);
        }
      }).pipe(
        Effect.provide(
          testEnvLayer({
            NODE_ENV: "production",
          }),
        ),
      ),
    );

    it.effect("should fail for required vars missing in any environment", () =>
      Effect.gen(function* () {
        const { env } = createEnv({
          vars: {
            requiredVar: Config.string("REQUIRED_VAR"),
          },
        });

        const result = yield* Effect.exit(env.requiredVar);

        expect(Exit.isFailure(result)).toBe(true);
        if (Exit.isFailure(result) && Cause.isFailType(result.cause)) {
          expect(ConfigError.isConfigError(result.cause.error)).toBe(true);
        }
      }).pipe(
        Effect.provide(
          testEnvLayer({
            NODE_ENV: "development",
          }),
        ),
      ),
    );

    it.effect("should work with redacted values", () =>
      Effect.gen(function* () {
        const { env } = createEnv({
          vars: {
            secret: Config.redacted("SECRET"),
          },
        });

        const result = yield* env.secret;
        expect(Redacted.value(result)).toBe("super-secret");
      }).pipe(
        Effect.provide(
          testEnvLayer({
            NODE_ENV: "development",
            SECRET: "super-secret",
          }),
        ),
      ),
    );

    it.effect("should work with number configs", () =>
      Effect.gen(function* () {
        const { env } = createEnv({
          vars: {
            port: Config.number("PORT"),
          },
        });

        const result = yield* env.port;
        expect(result).toBe(3000);
      }).pipe(
        Effect.provide(
          testEnvLayer({
            NODE_ENV: "development",
            PORT: "3000",
          }),
        ),
      ),
    );

    it.effect("should work with mixed required and optional vars", () =>
      Effect.gen(function* () {
        const { env } = createEnv({
          vars: {
            required: Config.string("REQUIRED"),
            optional: [Config.string("OPTIONAL"), "default"] as const,
          },
        });

        const result = yield* env;
        expect(result).toEqual({
          required: "required-value",
          optional: "default",
        });
      }).pipe(
        Effect.provide(
          testEnvLayer({
            NODE_ENV: "development",
            REQUIRED: "required-value",
          }),
        ),
      ),
    );
  });
});
