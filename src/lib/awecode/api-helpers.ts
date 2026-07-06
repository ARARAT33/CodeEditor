// Shared helpers for the AWEAI HTTP API routes.
// Centralizes the response envelope, per-request metadata, JSON body parsing,
// and language resolution that every route under /api previously duplicated.

import { detectLanguageByFilename } from '@/lib/awecode/languages'

export const API_VERSION = '1.0.0'

export interface AWEAIResponse<T = any> {
  ok: boolean
  data?: T
  error?: string
  meta?: {
    version: string
    durationMs: number
    requestId: string
    [key: string]: unknown
  }
}

export interface RequestContext {
  startTime: number
  requestId: string
}

// Creates the per-request context (start time + id) used to build response meta.
export function createRequestContext(): RequestContext {
  return { startTime: Date.now(), requestId: crypto.randomUUID() }
}

function buildMeta(ctx: RequestContext, extra?: Record<string, unknown>) {
  return {
    version: API_VERSION,
    durationMs: Date.now() - ctx.startTime,
    requestId: ctx.requestId,
    ...extra,
  }
}

// Success envelope: { ok: true, data, meta }
export function apiSuccess<T>(
  data: T,
  ctx: RequestContext,
  extraMeta?: Record<string, unknown>,
): Response {
  const body: AWEAIResponse<T> = { ok: true, data, meta: buildMeta(ctx, extraMeta) }
  return Response.json(body)
}

// Error envelope: { ok: false, error, meta }
export function apiError(
  message: string,
  status: number,
  ctx: RequestContext,
  extraMeta?: Record<string, unknown>,
): Response {
  const body: AWEAIResponse = { ok: false, error: message, meta: buildMeta(ctx, extraMeta) }
  return Response.json(body, { status })
}

// Parses the JSON request body, returning either the parsed value or a ready
// 400 response. Use: const parsed = await parseJsonBody(req, ctx);
//                     if ('error' in parsed) return parsed.error
export async function parseJsonBody<T = any>(
  req: Request,
  ctx: RequestContext,
): Promise<{ body: T } | { error: Response }> {
  try {
    return { body: (await req.json()) as T }
  } catch {
    return { error: apiError('Invalid JSON body', 400, ctx) }
  }
}

// Resolves a language id from an explicit language, then a filename, then a
// fallback — the exact precedence the routes relied on.
export function resolveLanguage(
  language?: string,
  filename?: string,
  fallback = 'javascript',
): string {
  if (language) return language
  if (filename) return detectLanguageByFilename(filename).id
  return fallback
}
