import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

export default function App() {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;

  return (
    <View style={styles.root}>
      <StatusBar style="auto" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            isCompact ? styles.contentCompact : styles.contentRegular,
          ]}
          alwaysBounceVertical={false}
        >
          <Text style={[styles.title, isCompact && styles.titleCompact]}>
            Quriora Mobile
          </Text>
          <Text style={styles.body}>
            Mobile shell ready. Content will stay inside safe areas and scroll when the viewport is short.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  contentRegular: {
    padding: 24,
  },
  contentCompact: {
    padding: 16,
  },
  title: {
    maxWidth: '100%',
    color: '#1B6B4A',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 24,
  },
  body: {
    maxWidth: 420,
    color: '#555',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
