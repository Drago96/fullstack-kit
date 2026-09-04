import { createApiClient } from '@reference/api-client';
import { env } from '@/env';

// Rendered per request: the greeting comes from the API, not from build time.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const api = createApiClient(env.API_URL);
  const { data, error } = await api.GET('/hello', { params: { query: { name: 'World' } } });
  if (error || !data) throw new Error('The API did not answer');
  return (
    <main>
      <h1>{data.message}</h1>
    </main>
  );
}
