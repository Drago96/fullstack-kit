import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';
import { env } from './env';

// A device has no origin and no cookie jar, so unlike web there is no proxy that keeps the
// session first-party: the Expo plugin keeps the cookie in the device keychain, replays it
// on every auth call, and sends the app's scheme as `expo-origin` for the API to trust.
export const authClient = createAuthClient({
  baseURL: env.EXPO_PUBLIC_API_URL,
  basePath: '/auth',
  plugins: [expoClient({ scheme: 'reference', storagePrefix: 'reference', storage: SecureStore })],
});
