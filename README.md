# @emergente-labs/effect-env

Type-safe environment variable configuration for [Effect-TS](https://effect.website) applications. The "T3 env" equivalent for Effect -- clean DX, per-environment defaults, proxy access, and test helpers.

## Installation

```bash
npm install @emergente-labs/effect-env effect
```

## Quick Start

```typescript
import { createEnv } from "@emergente-labs/effect-env";
import { Config, Effect, Redacted } from "effect";

const { env, requiredSecrets } = createEnv({
  vars: {
    // Required in all environments
    databaseUrl: Config.redacted("DATABASE_URL"),
    
    // Optional in development, required in production
    apiKey: [Config.string("API_KEY"), "dev-key-123"] as const,
    
    // Number config with default
    port: [Config.number("PORT"), 3000] as const,
  },
});

// requiredSecrets = ["DATABASE_URL"]

// Access individual variables
const program = Effect.gen(function* () {
  const dbUrl = yield* env.databaseUrl;      // Redacted<string>
  const key = yield* env.apiKey;             // string
  const port = yield* env.port;              // number
  
  // Or access all at once
  const all = yield* env;
  // { databaseUrl: Redacted<string>, apiKey: string, port: number }
});
```

## API

### `createEnv(options)`

Creates a typed environment configuration from a record of Config definitions.

Each variable can be:
- `Config.Config<T>` -- required in all environments
- `[Config.Config<T>, T] as const` -- required only in production, uses default in dev/test

Returns `{ env, requiredSecrets }`:
- `env` -- dual-access proxy: `yield* env.key` for individual values, `yield* env` for all
- `requiredSecrets` -- array of env var names that must be set in production

### `createEnvVar(config, defaultValueInDevelopment?)`

Lower-level function for creating individual environment-aware configs.

### `createTestEnvLayer(envMap)`

Creates an Effect Layer that provides mock environment variables for testing.

```typescript
import { createTestEnvLayer } from "@emergente-labs/effect-env";

const testLayer = createTestEnvLayer({
  DATABASE_URL: "postgresql://localhost:5432/test",
  NODE_ENV: "test",
});

// Use in tests
const result = yield* myEffect.pipe(Effect.provide(testLayer));
```

## License

MIT
