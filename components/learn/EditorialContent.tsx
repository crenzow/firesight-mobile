import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface EditorialContentProps {
  content: string;
  fontSizeScale?: 'standard' | 'large';
  fontSizeStep?: number;
}

type ListItem = {
  marker: string;
  isNumbered: boolean;
  subhead?: string;
  body: string;
};

type Block =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: ListItem[] };

export const EditorialContent: React.FC<EditorialContentProps> = ({
  content,
  fontSizeScale = 'standard',
  fontSizeStep,
}) => {
  const { colors, isDark } = useTheme();

  const step = fontSizeStep !== undefined ? fontSizeStep : fontSizeScale === 'large' ? 2 : 1;
  const baseFontSize = [14, 15.5, 17.5, 19.5][step] ?? 15.5;
  const baseLineHeight = [21.5, 23.5, 26, 28.5][step] ?? 23.5;
  const headingFontSize = [16.5, 18, 20.5, 22.5][step] ?? 18;
  const headingLineHeight = [22, 24, 27, 29][step] ?? 24;

  const blocks = useMemo(() => {
    if (!content) return [];

    const lines = content.split(/\r?\n/);
    const parsedBlocks: Block[] = [];
    let currentList: ListItem[] | null = null;
    let prevWasBlank = true;

    const flushList = () => {
      if (currentList && currentList.length > 0) {
        parsedBlocks.push({ type: 'list', items: currentList });
        currentList = null;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        flushList();
        prevWasBlank = true;
        continue;
      }

      // Check for List item (•, -, *, or 1., 2.)
      const listMatch = trimmed.match(/^([•\-\*]|\d+[\.\)])\s+(.+)$/u);
      if (listMatch) {
        const marker = listMatch[1];
        const itemText = listMatch[2];
        const isNumbered = /\d+[\.\)]/.test(marker);
        const colonSplit = itemText.match(/^([^:]+):\s*(.*)$/);

        const item: ListItem = {
          marker,
          isNumbered,
          subhead: colonSplit ? colonSplit[1].trim() + ':' : undefined,
          body: colonSplit ? colonSplit[2].trim() : itemText.trim(),
        };

        if (!currentList) {
          currentList = [];
        }
        currentList.push(item);
        prevWasBlank = false;
        continue;
      }

      // If we were in a list and hit non-list text, flush the list
      flushList();

      // Check for Section Heading (markdown hashes OR standalone short title without punctuation)
      const hashMatch = trimmed.match(/^#{1,6}\s+(.+)$/);
      const isStandaloneHeading =
        prevWasBlank &&
        trimmed.length < 65 &&
        !/[.,;:]$/.test(trimmed);

      if (hashMatch || isStandaloneHeading) {
        const headingText = hashMatch ? hashMatch[1].trim() : trimmed;
        parsedBlocks.push({ type: 'heading', text: headingText });
        prevWasBlank = false;
        continue;
      }

      // Standard Paragraph
      parsedBlocks.push({ type: 'paragraph', text: trimmed });
      prevWasBlank = false;
    }

    flushList();
    return parsedBlocks;
  }, [content]);

  if (!content || blocks.length === 0) return null;

  return (
    <View style={styles.container}>
      {blocks.map((block, blockIndex) => {
        if (block.type === 'heading') {
          return (
            <Text
              key={`heading-${blockIndex}`}
              style={[
                styles.sectionHeading,
                {
                  color: colors.textPrimary,
                  fontSize: headingFontSize,
                  lineHeight: headingLineHeight,
                  marginTop: blockIndex === 0 ? 4 : 18,
                },
              ]}
            >
              {block.text}
            </Text>
          );
        }

        if (block.type === 'list') {
          return (
            <View key={`list-${blockIndex}`} style={styles.listBlock}>
              {block.items.map((item, itemIdx) => (
                <View key={`item-${itemIdx}`} style={styles.listItemRow}>
                  <View style={styles.markerCol}>
                    {item.isNumbered ? (
                      <Text
                        style={[
                          styles.numberMarker,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {item.marker}
                      </Text>
                    ) : (
                      <View
                        style={[
                          styles.bulletDot,
                          {
                            backgroundColor: isDark ? '#94A3B8' : '#64748B',
                          },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.itemTextWrap}>
                    <Text
                      selectable
                      style={[
                        styles.bodyParagraph,
                        {
                          color: colors.textPrimary,
                          fontSize: baseFontSize,
                          lineHeight: baseLineHeight,
                          marginBottom: 0,
                        },
                      ]}
                    >
                      {item.subhead && (
                        <Text style={[styles.boldSubhead, { color: colors.textPrimary }]}>
                          {item.subhead}{' '}
                        </Text>
                      )}
                      {item.body}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          );
        }

        // Paragraph
        return (
          <Text
            key={`para-${blockIndex}`}
            selectable
            style={[
              styles.bodyParagraph,
              {
                color: colors.textPrimary,
                fontSize: baseFontSize,
                lineHeight: baseLineHeight,
              },
            ]}
          >
            {block.text}
          </Text>
        );
      })}

      {/* Editorial End Sigil */}
      <View style={styles.endSigilWrap}>
        <Text style={[styles.endSigilText, { color: colors.textMuted }]}>
          ·   ·   ·
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
  },
  bodyParagraph: {
    fontWeight: '400',
    letterSpacing: 0.15,
    marginBottom: 12,
  },
  sectionHeading: {
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  listBlock: {
    marginBottom: 12,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 7,
  },
  markerCol: {
    width: 20,
    paddingTop: 8,
    alignItems: 'flex-start',
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  numberMarker: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemTextWrap: {
    flex: 1,
  },
  boldSubhead: {
    fontWeight: '700',
  },
  endSigilWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  endSigilText: {
    fontSize: 16,
    letterSpacing: 6,
    opacity: 0.5,
  },
});
