import { Config } from "effect";
import { createEnvVar } from "./createEnvVar";
import type {
  EnvVarsInput,
  EnvVarDefinition,
  OptionalConfig,
  CreateEnvOptions,
  CreateEnvReturn,
  ResolvedEnvValues,
  EnvProxy,
} from "./types";

function isOptionalConfig<T>(
  value: EnvVarDefinition<T>,
): value is OptionalConfig<T> {
  return Array.isArray(value) && value.length === 2;
}

/** Config with a direct name property (primitive configs like string, number, etc.) */
interface ConfigWithName {
  readonly name: string;
}

/** Config that wraps another config (mapped, validated, branded) */
interface ConfigWithOriginal {
  readonly original: Config.Config<unknown>;
}

/** Config with a fallback (orElse, withDefault) */
interface ConfigWithFirst {
  readonly first: Config.Config<unknown>;
}

function hasName(config: Config.Config<unknown>): config is Config.Config<unknown> & ConfigWithName {
  return "name" in config && typeof config.name === "string";
}

function hasOriginal(config: Config.Config<unknown>): config is Config.Config<unknown> & ConfigWithOriginal {
  return "original" in config && config.original !== null && typeof config.original === "object";
}

function hasFirst(config: Config.Config<unknown>): config is Config.Config<unknown> & ConfigWithFirst {
  return "first" in config && config.first !== null && typeof config.first === "object";
}

/**
 * Extracts the environment variable name from a Config object.
 * Works with nested, mapped, validated, and other transformed configs.
 */
function extractConfigName(config: Config.Config<unknown>): string | undefined {
  if (hasName(config)) return config.name;
  if (hasOriginal(config)) return extractConfigName(config.original);
  if (hasFirst(config)) return extractConfigName(config.first);
  return undefined;
}

/**
 * Creates a typed environment configuration from a record of Config definitions.
 *
 * Each variable can be defined as:
 * - `Config.Config<T>` - required in all environments
 * - `[Config.Config<T>, T] as const` - required only in production, uses the
 *   provided default value in development/test environments
 *
 * @template EnvVars - The record of environment variable definitions
 *
 * @param options - Configuration options
 * @param options.vars - Record of environment variable definitions
 *
 * @returns An object containing:
 *   - `env`: An Effect Config proxy that supports both `yield* env.key` for
 *     individual values and `yield* env` for all values.
 *   - `requiredSecrets`: Array of environment variable names that are required
 *     (no default value) and must be set for deployment.
 *
 * @example
 * const { env, requiredSecrets } = createEnv({
 *   vars: {
 *     databaseUrl: Config.redacted("DATABASE_URL"),
 *     apiKey: [Config.string("API_KEY"), "dev-key-123"] as const,
 *   },
 * });
 *
 * // requiredSecrets = ["DATABASE_URL"]
 *
 * // In an Effect generator:
 * const dbUrl = yield* env.databaseUrl;  // Redacted
 * const key = yield* env.apiKey;         // string
 * const all = yield* env;                // { databaseUrl: Redacted, apiKey: string }
 */
export function createEnv<EnvVars extends EnvVarsInput>(
  options: CreateEnvOptions<EnvVars>,
): CreateEnvReturn<EnvVars> {
  const processedVars: Record<string, Config.Config<unknown>> = {};
  const requiredSecrets: string[] = [];

  for (const key of Object.keys(options.vars)) {
    const value = options.vars[key];
    if (value === undefined) continue;

    if (isOptionalConfig(value)) {
      // Tuple: [Config, defaultValue] - optional, has a default
      processedVars[key] = createEnvVar(value[0], value[1]);
    } else {
      // Just a Config (required in all environments)
      processedVars[key] = createEnvVar(value);
      // Extract the env var name for required secrets
      const envVarName = extractConfigName(value);
      if (envVarName) {
        requiredSecrets.push(envVarName);
      }
    }
  }

  const allEnvVars = Config.all(processedVars) as Config.Config<
    ResolvedEnvValues<EnvVars>
  >;

  const env = new Proxy(allEnvVars, {
    get(target, prop: string | symbol) {
      if (typeof prop === "string" && prop in processedVars) {
        return Config.map(
          target,
          (allValues) => allValues[prop as keyof typeof allValues],
        );
      }
      return target[prop as keyof typeof target];
    },
  }) as EnvProxy<EnvVars>;

  return { env, requiredSecrets };
}
