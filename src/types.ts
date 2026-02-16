import type { Config } from "effect";

/** A config with no default (required in all environments) */
export type RequiredConfig<T> = Config.Config<T>;

/** A config with a default value (required only in production) */
export type OptionalConfig<T> = readonly [Config.Config<T>, T];

/** Union of both config types */
export type EnvVarDefinition<T = unknown> =
  | RequiredConfig<T>
  | OptionalConfig<T>;

/**
 * The input record type for `createEnv`. Each key maps to either:
 * - `Config.Config<T>` - required in all environments
 * - `readonly [Config.Config<T>, T]` - required only in production, uses default in development
 *
 * @example
 * const vars: EnvVarsInput = {
 *   databaseUrl: Config.redacted("DATABASE_URL"),
 *   apiKey: [Config.string("API_KEY"), "dev-key"] as const,
 * };
 */
export type EnvVarsInput = Record<string, EnvVarDefinition>;

/**
 * Extract only the keys that are required (no default value).
 * These are the secrets that must be set for deployment.
 */
export type RequiredEnvKeys<T extends EnvVarsInput> = {
  [K in keyof T]: T[K] extends OptionalConfig<unknown> ? never : K;
}[keyof T];

/**
 * Type helper to get required secret names as a tuple type.
 */
export type RequiredSecretNames<T extends EnvVarsInput> = RequiredEnvKeys<T>[];

/** Extract the success type from a config definition */
export type ExtractConfigType<T> = T extends OptionalConfig<infer U>
  ? U
  : T extends RequiredConfig<infer U>
    ? U
    : never;

/** Map input record to resolved Config types */
export type ResolvedEnvVars<T extends EnvVarsInput> = {
  [K in keyof T]: Config.Config<ExtractConfigType<T[K]>>;
};

/** The resolved plain values object */
export type ResolvedEnvValues<T extends EnvVarsInput> = {
  [K in keyof T]: ExtractConfigType<T[K]>;
};

/** The proxy type that allows both `yield* env.key` and `yield* env` */
export type EnvProxy<T extends EnvVarsInput> = Config.Config<
  ResolvedEnvValues<T>
> &
  ResolvedEnvVars<T>;

/** The env proxy combined with metadata about required secrets */
export interface CreateEnvReturn<EnvVars extends EnvVarsInput> {
  /** The env proxy that supports `yield* env.key` and `yield* env` */
  readonly env: EnvProxy<EnvVars>;
  /** Environment variable names that are required (no default value) */
  readonly requiredSecrets: readonly string[];
}

/**
 * Options for `createEnv`.
 *
 * @template EnvVars - The record of environment variable definitions
 */
export interface CreateEnvOptions<EnvVars extends EnvVarsInput> {
  /** Record of environment variable definitions */
  vars: EnvVars;
}
