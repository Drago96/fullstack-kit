import { Redirect, Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { authClient } from '@/auth-client';

export default function LogInScreen() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [failure, setFailure] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  if (isPending) return null;
  // The keychain still holds the cookie from the last run, so a returning user skips this.
  if (session) return <Redirect href="/notes" />;

  const submit = async () => {
    setSubmitting(true);
    const { error } = await authClient.signIn.email({ email, password });
    setSubmitting(false);
    // Better Auth answers 403 while the address is still unverified.
    if (error) {
      setFailure(error.status === 403 ? 'Verify your email first' : 'Log in failed');
      return;
    }
    router.replace('/notes');
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Log in' }} />
      <TextInput
        accessibilityLabel="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="Email"
        style={styles.input}
        value={email}
      />
      <TextInput
        accessibilityLabel="Password"
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
      />
      <Button disabled={submitting} onPress={submit} title="Log in" />
      {failure ? <Text accessibilityRole="alert">{failure}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, gap: 12, justifyContent: 'center', padding: 24 },
  input: { borderColor: '#ccc', borderRadius: 4, borderWidth: 1, padding: 12 },
});
