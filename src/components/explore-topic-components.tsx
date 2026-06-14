import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CircleHelp,
  Droplets,
  HandHeart,
  HeartHandshake,
  Landmark,
  MoonStar,
  Scale,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Sun,
  Utensils,
  Users,
} from 'lucide-react-native';

import type { HadithTopic } from '../services/hadith';

interface TopicColors {
  card: string;
  border: string;
  text: string;
  accent: string;
  accentSoft: string;
}

interface TopicCardProps {
  topic: HadithTopic;
  colors: TopicColors;
  onPress: () => void;
}

const getTopicIcon = (title: string, color: string) => {
  const value = title.toLowerCase();
  const props = { size: 20, color };
  if (/prayer|witr|mosque|friday|eid/.test(value)) return <Landmark {...props} />;
  if (/charity|zakat|gift|help/.test(value)) return <HandHeart {...props} />;
  if (/marriage|family|divorce|relation/.test(value)) return <HeartHandshake {...props} />;
  if (/food|drink|meal|slaughter|hunting/.test(value)) return <Utensils {...props} />;
  if (/fast|ramadaan|i'tikaf/.test(value)) return <MoonStar {...props} />;
  if (/trade|sale|business|loan|debt|hiring/.test(value)) return <BriefcaseBusiness {...props} />;
  if (/ablution|bath|purification|water|tayammum/.test(value)) return <Droplets {...props} />;
  if (/judgment|law|punishment|oath|justice/.test(value)) return <Scale {...props} />;
  if (/qur'an|revelation|knowledge|commentary/.test(value)) return <BookOpen {...props} />;
  if (/prophet|companion|people|permission/.test(value)) return <Users {...props} />;
  if (/dream|creation|destiny|divine/.test(value)) return <Sparkles {...props} />;
  if (/day|time|calendar/.test(value)) return <CalendarDays {...props} />;
  if (/faith|belief|oneness/.test(value)) return <ShieldCheck {...props} />;
  if (/invocation|heart|repentance/.test(value)) return <Sun {...props} />;
  if (/will|condition|witness|report/.test(value)) return <ScrollText {...props} />;
  return <CircleHelp {...props} />;
};

export const TopicCard = ({ topic, colors, onPress }: TopicCardProps) => (
  <TouchableOpacity
    activeOpacity={0.78}
    onPress={onPress}
    style={[styles.topicCard, { backgroundColor: colors.card, borderColor: colors.border }]}
  >
    <View style={[styles.iconContainer, { backgroundColor: colors.accentSoft }]}> 
      {getTopicIcon(topic.english, colors.accent)}
    </View>
    <Text selectable style={[styles.topicTitle, { color: colors.text }]} numberOfLines={4}>
      {topic.english}
    </Text>
  </TouchableOpacity>
);

export const LoadingState = ({ color }: { color: string }) => (
  <View style={styles.stateContainer}>
    <ActivityIndicator size="small" color={color} />
    <Text style={[styles.stateText, { color }]}>Loading topics...</Text>
  </View>
);

export const ErrorState = ({ message, color, onRetry }: { message: string; color: string; onRetry: () => void }) => (
  <View style={styles.stateContainer}>
    <Text selectable style={[styles.stateText, { color }]}>{message}</Text>
    <TouchableOpacity onPress={onRetry} style={[styles.retryButton, { backgroundColor: color }]}> 
      <Text style={styles.retryText}>Try again</Text>
    </TouchableOpacity>
  </View>
);

export const EmptyState = ({ color }: { color: string }) => (
  <View style={styles.stateContainer}>
    <Text selectable style={[styles.stateText, { color }]}>No Hadith topics are available.</Text>
  </View>
);

const styles = StyleSheet.create({
  topicCard: {
    flex: 1,
    minHeight: 104,
    borderWidth: 1,
    borderRadius: 16,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    boxShadow: '0 3px 12px rgba(0,0,0,0.045)',
  },
  iconContainer: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  topicTitle: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  stateContainer: { minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 28 },
  stateText: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  retryButton: { borderRadius: 99, paddingHorizontal: 18, paddingVertical: 9 },
  retryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
});
