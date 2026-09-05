import { createApiClient } from '@reference/api-client';
import createQueryHooks from 'openapi-react-query';
import { authClient } from './auth-client';
import { env } from './env';

const client = createApiClient(env.EXPO_PUBLIC_API_URL);

// Only Better Auth's own fetch replays the stored cookie, so every other call to the API
// has to attach it by hand.
client.use({
  onRequest: async ({ request }) => {
    request.headers.set('cookie', await authClient.getCookie());
    return request;
  },
});

export const api = createQueryHooks(client);
