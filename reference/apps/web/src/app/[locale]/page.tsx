import { createApiClient } from '@reference/api-client';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent } from '@/components/ui/card';
import { env } from '@/env';

// Rendered per request: the greeting comes from the API, not from build time.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const t = await getTranslations('home');
  const api = createApiClient(env.API_URL);
  const { data, error } = await api.GET('/hello', { params: { query: { name: 'World' } } });
  if (error || !data) throw new Error('The API did not answer');
  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">{data.message}</h1>
      <Card>
        <CardContent>
          <p className="text-muted-foreground">{t('apiNote')}</p>
        </CardContent>
      </Card>
    </main>
  );
}
