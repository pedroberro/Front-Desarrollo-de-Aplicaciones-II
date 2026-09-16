import axios from 'axios';
import type { ApiErrorBody } from '../types';

function getBody(error: unknown): Partial<ApiErrorBody> | null {
  if (!axios.isAxiosError(error)) return null;
  const body = error.response?.data;
  return body && typeof body === 'object' ? (body as Partial<ApiErrorBody>) : null;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const body = getBody(error);
  return typeof body?.message === 'string' ? body.message : fallback;
}

/** Per-field messages from a 400 validation error, keyed by the DTO field name. */
export function getApiFieldErrors(error: unknown): Record<string, string> {
  return getBody(error)?.errors ?? {};
}

export function getApiCode(error: unknown): string | undefined {
  return getBody(error)?.code;
}

export function getApiStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}
