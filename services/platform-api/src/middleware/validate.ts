import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { z, ZodIssue, ZodSchema } from "zod";

type MaybeSchema = ZodSchema<unknown> | undefined;
type InferSchema<TSchema extends MaybeSchema, TFallback> =
  TSchema extends ZodSchema<unknown> ? z.infer<TSchema> : TFallback;

type DefaultParams = Record<string, string>;
type DefaultQuery = Record<string, unknown>;

export type ValidationSchemas<
  TBodySchema extends MaybeSchema = undefined,
  TQuerySchema extends MaybeSchema = undefined,
  TParamsSchema extends MaybeSchema = undefined,
> = {
  body?: TBodySchema;
  query?: TQuerySchema;
  params?: TParamsSchema;
};

export type ValidatedRequest<
  TBodySchema extends MaybeSchema = undefined,
  TQuerySchema extends MaybeSchema = undefined,
  TParamsSchema extends MaybeSchema = undefined,
> = Omit<Request, "body" | "query" | "params"> & {
  body: InferSchema<TBodySchema, unknown>;
  query: InferSchema<TQuerySchema, DefaultQuery>;
  params: InferSchema<TParamsSchema, DefaultParams>;
};

export type ValidatedRequestHandler<
  TBodySchema extends MaybeSchema = undefined,
  TQuerySchema extends MaybeSchema = undefined,
  TParamsSchema extends MaybeSchema = undefined,
> = (
  req: ValidatedRequest<TBodySchema, TQuerySchema, TParamsSchema>,
  res: Response,
  next: NextFunction,
) => unknown;

const replaceRequestPart = (
  req: object,
  key: "body" | "query" | "params",
  value: unknown,
): void => {
  Object.defineProperty(req, key, {
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  });
};

const collectIssues = <TSchema extends ZodSchema<unknown>>(
  schema: TSchema,
  value: unknown,
  issues: ZodIssue[],
): unknown => {
  const result = schema.safeParse(value);

  if (!result.success) {
    issues.push(...result.error.issues);
    return undefined;
  }

  return result.data;
};

export function validate<
  TBodySchema extends MaybeSchema = undefined,
  TQuerySchema extends MaybeSchema = undefined,
  TParamsSchema extends MaybeSchema = undefined,
>(
  schemas: ValidationSchemas<TBodySchema, TQuerySchema, TParamsSchema>,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const issues: ZodIssue[] = [];
      const parsedBody = schemas.body
        ? collectIssues(schemas.body, req.body, issues)
        : undefined;
      const parsedQuery = schemas.query
        ? collectIssues(schemas.query, req.query, issues)
        : undefined;
      const parsedParams = schemas.params
        ? collectIssues(schemas.params, req.params, issues)
        : undefined;

      if (issues.length > 0) {
        res.status(400).json({ error: "Validation failed", details: issues });
        return;
      }

      if (schemas.body) {
        replaceRequestPart(req, "body", parsedBody);
      }

      if (schemas.query) {
        replaceRequestPart(req, "query", parsedQuery);
      }

      if (schemas.params) {
        replaceRequestPart(req, "params", parsedParams);
      }

      next();
    } catch (error: unknown) {
      next(error);
    }
  };
}
