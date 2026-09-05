import { zodResolver } from '@hookform/resolvers/zod';
import { type Credentials, credentialsSchema } from '@reference/contract';
import { Redirect, Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { authClient } from '@/auth-client';

export default function LogInScreen() {
  const t = useTranslations('auth');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [failure, setFailure] = useState<string>();
  const { control, handleSubmit, formState } = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: '', password: '' },
  });

  // The Contract's resolver messages and Better Auth's outcomes are error codes, not prose.
  const translate = (code: string | undefined) =>
    code !== undefined && tErrors.has(code) ? tErrors(code) : tErrors('unknown');

  const submit = handleSubmit(async (credentials) => {
    const { error } = await authClient.signIn.email(credentials);
    // Better Auth answers 403 while the address is still unverified.
    if (error) {
      setFailure(error.status === 403 ? 'auth.notVerified' : 'auth.signInFailed');
      return;
    }
    router.replace('/notes');
  });

  if (isPending) return null;
  // The keychain still holds the cookie from the last run, so a returning user skips this.
  if (session) return <Redirect href="/notes" />;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: t('logIn') }} />
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextInput
            accessibilityLabel={t('email')}
            autoCapitalize="none"
            keyboardType="email-address"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder={t('email')}
            style={styles.input}
            value={field.value}
          />
        )}
      />
      {formState.errors.email ? (
        <Text accessibilityRole="alert">{translate(formState.errors.email.message)}</Text>
      ) : null}
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextInput
            accessibilityLabel={t('password')}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder={t('password')}
            secureTextEntry
            style={styles.input}
            value={field.value}
          />
        )}
      />
      {formState.errors.password ? (
        <Text accessibilityRole="alert">{translate(formState.errors.password.message)}</Text>
      ) : null}
      <Button disabled={formState.isSubmitting} onPress={submit} title={t('logIn')} />
      {failure ? <Text accessibilityRole="alert">{translate(failure)}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, gap: 12, justifyContent: 'center', padding: 24 },
  input: { borderColor: '#ccc', borderRadius: 4, borderWidth: 1, padding: 12 },
});
