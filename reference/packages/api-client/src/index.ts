import createClient from 'openapi-fetch';
import type { paths } from './schema';

export type { paths };

export function createApiClient(baseUrl: string) {
  return createClient<paths>({ baseUrl });
}
