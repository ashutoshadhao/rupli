import type { Context } from 'hono';
import type { z } from 'zod';

export class ApiError extends Error {
  constructor(public status: 400 | 401 | 404 | 409, public code: string, message: string) { super(message); }
}
export const notFound = (what: string) => new ApiError(404, 'not_found', `${what} not found`);

export async function body<S extends z.ZodType>(c: Context, s: S): Promise<z.infer<S>> {
  return s.parse(await c.req.json());
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function idParam(c: Context, name = 'id'): string {
  const v = c.req.param(name);
  if (!v || !UUID.test(v)) throw notFound('resource');
  return v;
}

export function onError(err: Error, c: Context) {
  if (err instanceof ApiError) return c.json({ error: { code: err.code, message: err.message } }, err.status);
  if (err.name === 'ZodError') {
    const message = (err as z.ZodError).issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    return c.json({ error: { code: 'invalid_input', message } }, 400);
  }
  if (err instanceof SyntaxError) return c.json({ error: { code: 'invalid_json', message: 'Body must be JSON' } }, 400);
  console.error(err);
  return c.json({ error: { code: 'internal', message: 'Something went wrong' } }, 500);
}
