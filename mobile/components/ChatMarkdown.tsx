import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

interface Props {
  content: string;
  color: string;
  accent: string;
}

// Minimal markdown: **bold**, bullets, numbered lists, headings. Anything else renders as plain text.
function renderInline(text: string, color: string, keyPrefix: string) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g).filter(Boolean).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <Text key={`${keyPrefix}-${i}`} style={styles.bold}>{part.slice(2, -2)}</Text>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <Text key={`${keyPrefix}-${i}`} style={styles.italic}>{part.slice(1, -1)}</Text>;
    }
    return <Text key={`${keyPrefix}-${i}`}>{part.replace(/`/g, '')}</Text>;
  });
}

export default function ChatMarkdown({ content, color, accent }: Props) {
  const lines = content.replace(/\r/g, '').split('\n');
  const blocks: React.ReactNode[] = [];

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    if (!line.trim()) return;

    const heading = line.match(/^#{1,6}\s+(.*)$/);
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const numbered = line.match(/^\s*(\d+)[.)]\s+(.*)$/);

    if (heading) {
      blocks.push(
        <Text key={idx} style={[styles.heading, { color }]}>{renderInline(heading[1], color, `h${idx}`)}</Text>
      );
    } else if (bullet) {
      blocks.push(
        <View key={idx} style={styles.row}>
          <Text style={[styles.marker, { color: accent }]}>•</Text>
          <Text style={[styles.body, styles.flex, { color }]}>{renderInline(bullet[1], color, `b${idx}`)}</Text>
        </View>
      );
    } else if (numbered) {
      blocks.push(
        <View key={idx} style={styles.row}>
          <Text style={[styles.marker, { color: accent }]}>{numbered[1]}.</Text>
          <Text style={[styles.body, styles.flex, { color }]}>{renderInline(numbered[2], color, `n${idx}`)}</Text>
        </View>
      );
    } else {
      blocks.push(
        <Text key={idx} style={[styles.body, styles.para, { color }]}>{renderInline(line, color, `p${idx}`)}</Text>
      );
    }
  });

  return <View>{blocks}</View>;
}

const styles = StyleSheet.create({
  body: { fontSize: 14, lineHeight: 21 },
  para: { marginBottom: 6 },
  heading: { fontSize: 15, fontWeight: '800', marginBottom: 6, marginTop: 2 },
  row: { flexDirection: 'row', marginBottom: 5, paddingRight: 4 },
  marker: { width: 18, fontSize: 14, lineHeight: 21, fontWeight: '800' },
  flex: { flex: 1 },
  bold: { fontWeight: '800' },
  italic: { fontStyle: 'italic' },
});