import {
  Config,
  ConfigError,
  ConfigProvider,
  Effect,
  Exit,
  Layer,
  Cause,
} from "effect";
import { describe, it, expect } from "@effect/vitest";
import { createEnvVar } from "./createEnvVar";

describe("createEnvVar", () => {
  describe("optional in development (with default)", () => {
    it.effect("should fail when missing in production", () =>
      Effect.gen(function* () {
        const config = createEnvVar(Config.string("TEST_VAR"), "default");

        const result = yield* Effect.exit(config);

        expect(Exit.isFailure(result)).toBe(true);
        if (Exit.isFailure(result) && Cause.isFailType(result.cause)) {
          expect(ConfigError.isConfigError(result.cause.error)).toBe(true);
        }
      }).pipe(
        Effect.provide(
          Layer.setConfigProvider(
            ConfigProvider.fromMap(new Map([["NODE_ENV", "production"]])),
          ),
        ),
      ),
    );

    it.effect(
      "should succeed with default value when missing in development",
      () =>
        Effect.gen(function* () {
          const config = createEnvVar(Config.string("TEST_VAR"), "default");

          const result = yield* config;
          expect(result).toBe("default");
        }).pipe(
          Effect.provide(
            Layer.setConfigProvider(
              ConfigProvider.fromMap(new Map([["NODE_ENV", "development"]])),
            ),
          ),
        ),
    );
  });

  describe("required in all environments (no default)", () => {
    it.effect("should fail when missing in production", () =>
      Effect.gen(function* () {
        const config = createEnvVar(Config.string("TEST_VAR"));

        const result = yield* Effect.exit(config);

        expect(Exit.isFailure(result)).toBe(true);
        if (Exit.isFailure(result) && Cause.isFailType(result.cause)) {
          expect(ConfigError.isConfigError(result.cause.error)).toBe(true);
        }
      }).pipe(
        Effect.provide(
          Layer.setConfigProvider(
            ConfigProvider.fromMap(new Map([["NODE_ENV", "production"]])),
          ),
        ),
      ),
    );

    it.effect("should fail when missing in development", () =>
      Effect.gen(function* () {
        const config = createEnvVar(Config.string("TEST_VAR"));

        const result = yield* Effect.exit(config);

        expect(Exit.isFailure(result)).toBe(true);
        if (Exit.isFailure(result) && Cause.isFailType(result.cause)) {
          expect(ConfigError.isConfigError(result.cause.error)).toBe(true);
        }
      }).pipe(
        Effect.provide(
          Layer.setConfigProvider(
            ConfigProvider.fromMap(new Map([["NODE_ENV", "development"]])),
          ),
        ),
      ),
    );

    it.effect("should succeed when value exists", () =>
      Effect.gen(function* () {
        const config = createEnvVar(Config.string("TEST_VAR"));

        const result = yield* config;
        expect(result).toBe("test-value");
      }).pipe(
        Effect.provide(
          Layer.setConfigProvider(
            ConfigProvider.fromMap(
              new Map([
                ["NODE_ENV", "development"],
                ["TEST_VAR", "test-value"],
              ]),
            ),
          ),
        ),
      ),
    );
  });

  describe("with value present", () => {
    it.effect("should use actual value when present (with default)", () =>
      Effect.gen(function* () {
        const config = createEnvVar(Config.string("TEST_VAR"), "default-value");

        const result = yield* config;
        expect(result).toBe("actual-value");
      }).pipe(
        Effect.provide(
          Layer.setConfigProvider(
            ConfigProvider.fromMap(
              new Map([
                ["NODE_ENV", "development"],
                ["TEST_VAR", "actual-value"],
              ]),
            ),
          ),
        ),
      ),
    );

    it.effect("should use actual value when present (no default)", () =>
      Effect.gen(function* () {
        const config = createEnvVar(Config.string("TEST_VAR"));

        const result = yield* config;
        expect(result).toBe("actual-value");
      }).pipe(
        Effect.provide(
          Layer.setConfigProvider(
            ConfigProvider.fromMap(
              new Map([
                ["NODE_ENV", "production"],
                ["TEST_VAR", "actual-value"],
              ]),
            ),
          ),
        ),
      ),
    );
  });
});
