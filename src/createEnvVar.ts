import { Config, Option, ConfigError, Either, Schema } from "effect";

const environment = Config.string("NODE_ENV");

/* walker to get the path from a config type that has transformations, like `Config.string("SECRET_KEY").pipe(Config.array)` */
interface ConfigName {
  name: string;
}

interface ConfigOriginal {
  original: ConfigType;
}

interface ConfigFirstSecond {
  first: ConfigType;
  second: ConfigType;
}

interface ConfigBuried {
  config: ConfigType;
}

type ConfigType =
  | ConfigName
  | ConfigOriginal
  | ConfigFirstSecond
  | ConfigBuried;

const configSchema = Schema.Union(
  Schema.Struct({
    name: Schema.String,
  }),
  Schema.Struct({
    original: Schema.suspend((): Schema.Schema<ConfigType> => configSchema),
  }),
  Schema.Struct({
    config: Schema.suspend((): Schema.Schema<ConfigType> => configSchema),
  }),
  Schema.Struct({
    first: Schema.suspend((): Schema.Schema<ConfigType> => configSchema),
    second: Schema.suspend((): Schema.Schema<ConfigType> => configSchema),
  }),
);

const extractPath = (v: typeof configSchema.Type): string[] => {
  if ("name" in v) {
    return [v.name];
  }

  if ("original" in v) {
    const extracted = extractPath(v.original);
    if (extracted.length) {
      return extracted;
    }
  }

  if ("first" in v) {
    const first = extractPath(v.first);
    if (first.length > 0) return first;
    return extractPath(v.second);
  }

  if ("config" in v) {
    const extracted = extractPath(v.config);
    if (extracted.length) {
      return extracted;
    }
  }

  return [];
};
/* end of walker */

function getConfigPath(config: Config.Config<unknown>): string[] {
  const decoded = Schema.decodeUnknownEither(configSchema)(config);
  return Either.match(decoded, {
    onLeft: () => [],
    onRight: extractPath,
  });
}

function createMissingDataError(
  config: Config.Config<unknown>,
  optionalInDevelopment: boolean,
): ConfigError.ConfigError {
  const path = getConfigPath(config);
  const message = optionalInDevelopment
    ? "Environment variable required in production"
    : "Environment variable required in all environments";
  return ConfigError.MissingData(path, message);
}

function isValueRequired(env: string, optionalInDevelopment: boolean): boolean {
  if (optionalInDevelopment) {
    return env === "production";
  }
  return true;
}

/**
 * Creates an environment variable configuration with optional development fallback.
 *
 * @template T - The type of the environment variable value
 * @param config - The Config instance to read the environment variable
 * @param defaultValueInDevelopment - Optional default value to use in non-production environments.
 *   - If provided: Variable is required only in production, uses default in development
 *   - If omitted: Variable is required in all environments
 * @returns A Config that validates the environment variable based on the current NODE_ENV
 *
 * @example
 * // Required in all environments (no default)
 * const dbUrl = createEnvVar(Config.string("DATABASE_URL"));
 *
 * @example
 * // Required only in production, uses default in development
 * const apiKey = createEnvVar(Config.string("API_KEY"), "dev-key-123");
 */
export function createEnvVar<T>(
  config: Config.Config<T>,
  defaultValueInDevelopment?: T,
): Config.Config<T> {
  const optionalInDevelopment = defaultValueInDevelopment !== undefined;

  return Config.all({
    env: environment,
    value: Config.option(config),
  }).pipe(
    Config.mapOrFail(({ env, value }) => {
      const isRequired = isValueRequired(env, optionalInDevelopment);

      if (isRequired && Option.isNone(value)) {
        return Either.left(createMissingDataError(config, optionalInDevelopment));
      }

      return Either.right(
        Option.getOrElse(() => defaultValueInDevelopment as T)(value),
      );
    }),
  );
}
