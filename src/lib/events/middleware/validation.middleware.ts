/**
 * @module events/middleware/validation
 * @description Event payload validation middleware.
 *
 * Validates event payloads against JSON schemas before processing.
 * Supports:
 * - Basic type checking
 * - Required field validation
 * - Custom validator functions
 * - Event version validation
 * - Schema-based validation (Zod)
 */

import type { EventEnvelope, EventMiddleware, EventType } from '../types';

// ─── Validation Schema ───────────────────────────────────────────────────────

/**
 * A simple schema definition for event validation.
 * For more complex validation, use Zod schemas.
 */
export interface ValidationSchema {
  /** Required fields */
  required?: string[];
  /** Field type definitions */
  fields?: Record<string, 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any'>;
  /** Minimum field count */
  minFields?: number;
  /** Maximum field count */
  maxFields?: number;
  /** Custom validator function */
  validate?: (data: unknown) => string | null; // Returns null if valid, error message if invalid
}

// ─── Zod Schema Support ──────────────────────────────────────────────────────

/**
 * Type for a Zod schema object.
 * Using `any` to avoid hard dependency on Zod.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ZodSchema = any;

// ─── Validation Registry ─────────────────────────────────────────────────────

const schemaRegistry = new Map<string, ValidationSchema | ZodSchema>();

/**
 * Register a validation schema for an event type.
 *
 * @param eventType - The event type to validate
 * @param schema - Either a ValidationSchema or a Zod schema
 *
 * @example
 * ```typescript
 * // Using built-in schema
 * registerSchema('trading.gold.buy.created', {
 *   required: ['orderId', 'userId', 'goldAmount', 'pricePerGram'],
 *   fields: {
 *     orderId: 'string',
 *     userId: 'string',
 *     goldAmount: 'number',
 *     pricePerGram: 'number',
 *   },
 * });
 *
 * // Using Zod schema
 * import { z } from 'zod';
 * registerSchema('trading.gold.buy.created', z.object({
 *   orderId: z.string().uuid(),
 *   userId: z.string(),
 *   goldAmount: z.number().positive(),
 *   pricePerGram: z.number().positive(),
 * }));
 * ```
 */
export function registerSchema(
  eventType: string,
  schema: ValidationSchema | ZodSchema,
): void {
  schemaRegistry.set(eventType, schema);
}

/**
 * Unregister a validation schema.
 */
export function unregisterSchema(eventType: string): void {
  schemaRegistry.delete(eventType);
}

/**
 * Get the registered schema for an event type.
 */
export function getSchema(eventType: string): ValidationSchema | ZodSchema | undefined {
  return schemaRegistry.get(eventType);
}

// ─── Validation Functions ────────────────────────────────────────────────────

/**
 * Validate data against a built-in ValidationSchema.
 */
function validateWithSchema(
  data: unknown,
  schema: ValidationSchema,
  eventType: string,
): string | null {
  if (!data || typeof data !== 'object') {
    return `Event ${eventType}: data must be an object`;
  }

  const obj = data as Record<string, unknown>;

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (obj[field] === undefined || obj[field] === null) {
        return `Event ${eventType}: missing required field "${field}"`;
      }
    }
  }

  // Check field types
  if (schema.fields) {
    for (const [field, expectedType] of Object.entries(schema.fields)) {
      if (obj[field] !== undefined && expectedType !== 'any') {
        const actualType = Array.isArray(obj[field]) ? 'array' : typeof obj[field];
        if (actualType !== expectedType) {
          return `Event ${eventType}: field "${field}" expected ${expectedType}, got ${actualType}`;
        }
      }
    }
  }

  // Check field count
  const fieldCount = Object.keys(obj).length;
  if (schema.minFields !== undefined && fieldCount < schema.minFields) {
    return `Event ${eventType}: minimum ${schema.minFields} fields required, got ${fieldCount}`;
  }
  if (schema.maxFields !== undefined && fieldCount > schema.maxFields) {
    return `Event ${eventType}: maximum ${schema.maxFields} fields allowed, got ${fieldCount}`;
  }

  // Run custom validator
  if (schema.validate) {
    const customError = schema.validate(data);
    if (customError) return customError;
  }

  return null; // Valid
}

/**
 * Validate data against a Zod schema.
 */
async function validateWithZod(
  data: unknown,
  schema: ZodSchema,
  eventType: string,
): Promise<string | null> {
  try {
    await schema.parseAsync(data);
    return null;
  } catch (error) {
    const zodError = error as { errors?: Array<{ message: string; path: string[] }> };
    const messages = zodError.errors?.map((e) => `${e.path.join('.')}: ${e.message}`) ?? [];
    return `Event ${eventType}: validation failed - ${messages.join(', ')}`;
  }
}

// ─── Validation Middleware ───────────────────────────────────────────────────

export interface ValidationMiddlewareOptions {
  /** Fail fast on validation error (default: true) */
  failFast?: boolean;
  /** Log validation errors (default: true) */
  logErrors?: boolean;
  /** Custom validation registry (default: global) */
  registry?: Map<string, ValidationSchema | ZodSchema>;
  /** Minimum event version required (default: 1) */
  minVersion?: number;
  /** Event types to skip validation */
  skipEventTypes?: string[];
}

/**
 * Create a validation middleware.
 *
 * @param options - Validation configuration options
 * @returns Event middleware function
 *
 * @example
 * ```typescript
 * // Register schemas first
 * registerSchema('trading.gold.buy.created', { ... });
 *
 * // Use the middleware
 * const validation = createValidationMiddleware({ failFast: true });
 * subscriber.use(validation);
 * ```
 */
export function createValidationMiddleware(
  options?: ValidationMiddlewareOptions,
): EventMiddleware {
  const registry = options?.registry ?? schemaRegistry;
  const failFast = options?.failFast ?? true;
  const logErrors = options?.logErrors ?? true;
  const minVersion = options?.minVersion ?? 1;
  const skipSet = new Set(options?.skipEventTypes ?? [
    'system.health.check',
    'system.metrics.collected',
    'system.error.occurred',
    'trading.gold.price.updated',
  ]);

  return async (event: EventEnvelope, next: () => Promise<void>) => {
    const { type, version } = event.metadata;

    // Skip validation for certain event types
    if (skipSet.has(type)) {
      await next();
      return;
    }

    // Validate event version
    if (version < minVersion) {
      const msg = `Event ${type} version ${version} is below minimum ${minVersion}`;
      if (logErrors) console.error(`[Validation] ${msg}`);
      if (failFast) throw new Error(msg);
    }

    // Check if a schema is registered for this event type
    const schema = registry.get(type);
    if (!schema) {
      // No schema registered - skip validation
      await next();
      return;
    }

    // Validate
    let error: string | null = null;

    if (isZodSchema(schema)) {
      error = await validateWithZod(event.data, schema, type);
    } else {
      error = validateWithSchema(event.data, schema, type);
    }

    if (error) {
      if (logErrors) {
        console.error(`[Validation] ${error}`);
      }
      if (failFast) {
        throw new Error(error);
      }
    }

    await next();
  };
}

/**
 * Check if a schema is a Zod schema.
 */
function isZodSchema(schema: ValidationSchema | ZodSchema): schema is ZodSchema {
  return schema && typeof schema === 'object' && 'parse' in schema && 'safeParse' in schema;
}

/**
 * Default validation middleware instance.
 */
export const validationMiddleware = createValidationMiddleware({
  failFast: false,
  logErrors: true,
});
