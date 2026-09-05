import { Stack } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { api } from '@/api';

export default function NotesScreen() {
  const notes = api.useQuery('get', '/notes');

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Notes' }} />
      {notes.error ? <Text accessibilityRole="alert">Could not load notes</Text> : null}
      <FlatList
        data={notes.data ?? []}
        keyExtractor={(note) => note.id}
        renderItem={({ item }) => (
          <View style={styles.note}>
            <Text style={styles.title}>{item.title}</Text>
            <Text>{item.body}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24 },
  note: { paddingVertical: 8 },
  title: { fontWeight: 'bold' },
});
