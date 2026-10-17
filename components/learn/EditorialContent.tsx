import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface EditorialContentProps {
  content: string;
  fontSizeScale?: 'standard' | 'large';
}

export const EditorialContent: React.FC<EditorialContentProps> = ({
  content,
  fontSizeScale = 'standard',
}) => {
  const { colors } = useTheme();

  const isLarge = fontSizeScale === 'large';
  const baseFontSize = isLarge ? 17.5 : 15.5;
  const baseLineHeight = isLarge ? 30 : 27;
  const headingFontSize = isLarge ? 22 : 19.5;
  const headingLineHeight = isLarge ? 28 : 25;

  if (!content) return null;

  // Split into structural blocks separated by double newlines or single newlines with clear headers
  const rawBlocks = content.split(/\n\s*\n/);

  return (
    <View style={styles.container}>
      {rawBlocks.map((block, blockIndex) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // 1. Detect Section Headings (Markdown ### or short heading lines)
        const isMarkdownHeading = /^#{1,3}\s+(.+)$/.test(trimmed);
        if (isMarkdownHeading) {
          const headingText = trimmed.replace(/^#{1,3}\s+/, '');
          return (
            <Text
              key={`heading-${blockIndex}`}
              style={[
                styles.sectionHeading,
                {
                  color: colors.textPrimary,
                  fontSize: headingFontSize,
                  lineHeight: headingLineHeight,
                },
              ]}
            >
              {headingText}
            </Text>
          );
        }

        // 2. Detect List Blocks (Lines starting with • or - or 1., 2.)
        const lines = trimmed.split('\n');
        const hasListItems = lines.some((l) => /^\s*([•\-\*]|\d+\.)\s+/.test(l));

        if (hasListItems) {
          return (
            <View key={`list-block-${blockIndex}`} style={styles.listBlock}>
              {lines.map((line, lineIdx) => {
                const lineTrim = line.trim();
                if (!lineTrim) return null;

                const listMatch = lineTrim.match(/^\s*([•\-\*]|\d+\.)\s+(.+)$/);
                if (listMatch) {
                  const marker = listMatch[1];
                  const itemText = listMatch[2];
                  const isNumbered = /\d+\./.test(marker);

                  // Extract bold subhead if formatted like "Title: Description"
                  const colonSplit = itemText.match(/^([^:]+):\s*(.*)$/);

                  return (
                    <View key={`item-${lineIdx}`} style={styles.listItemRow}>
                      <View style={styles.markerCol}>
                        {isNumbered ? (
                          <Text style={[styles.numberMarker, { color: colors.brandOrange }]}>
                            {marker}
                          </Text>
                        ) : (
                          <View
                            style={[
                              styles.bulletDot,
                              { backgroundColor: colors.brandOrange },
                            ]}
                          />
                        )}
                      </View>
                      <View style={styles.itemTextWrap}>
                        {colonSplit ? (
                          <Text
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
                            <Text style={styles.boldSubhead}>{colonSplit[1]}: </Text>
                            {colonSplit[2]}
                          </Text>
                        ) : (
                          <Text
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
                            {itemText}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                }

                // Normal line inside list block
                return (
                  <Text
                    key={`line-${lineIdx}`}
                    selectable
                    style={[
                      styles.bodyParagraph,
                      {
                        color: colors.textPrimary,
                        fontSize: baseFontSize,
                        lineHeight: baseLineHeight,
                        marginBottom: 8,
                      },
                    ]}
                  >
                    {lineTrim}
                  </Text>
                );
              })}
            </View>
          );
        }

        // 3. Standard Editorial Paragraph
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
            {trimmed}
          </Text>
        );
      })}

      {/* Editorial End Sigil (Apple style three discreet dots) */}
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
    marginTop: 8,
  },
  bodyParagraph: {
    fontWeight: '400',
    letterSpacing: 0.15,
    marginBottom: 20,
  },
  sectionHeading: {
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 18,
    marginBottom: 12,
  },
  listBlock: {
    marginBottom: 16,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  markerCol: {
    width: 22,
    paddingTop: 5,
    alignItems: 'flex-start',
  },
  bulletDot: {
    width: 5.5,
    height: 5.5,
    borderRadius: 3,
  },
  numberMarker: {
    fontSize: 13,
    fontWeight: '800',
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
    paddingVertical: 24,
  },
  endSigilText: {
    fontSize: 18,
    letterSpacing: 6,
    opacity: 0.6,
  },
});
