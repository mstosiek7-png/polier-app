import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        404
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Screen not found
      </Text>
      <Button
        mode="contained"
        onPress={() => router.replace('/')}
        buttonColor="#00897B"
        style={styles.button}
      >
        Go to Dashboard
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  title: {
    fontWeight: 'bold',
    color: '#00897B',
    marginBottom: 8,
  },
  subtitle: {
    color: '#757575',
    marginBottom: 24,
  },
  button: {
    borderRadius: 12,
  },
});
