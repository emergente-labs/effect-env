import { Layer, ConfigProvider } from "effect";

/**
 * Creates a test layer with a given set of environment variables.
 * Useful for testing code that depends on environment variables.
 *
 * @param envMap - A Map or Record of environment variable names to their values
 * @returns A Layer that provides the environment variables to the Effect runtime
 *
 * @example
 * const testLayer = createTestEnvLayer(new Map([
 *   ["DATABASE_URL", "postgresql://user:password@localhost:5432/db"],
 *   ["NODE_ENV", "test"],
 * ]));
 */
export function createTestEnvLayer(
  envMap: Map<string, string> | Record<string, string>,
): Layer.Layer<never> {
  const map = envMap instanceof Map ? envMap : new Map(Object.entries(envMap));
  return Layer.setConfigProvider(ConfigProvider.fromMap(map));
}
