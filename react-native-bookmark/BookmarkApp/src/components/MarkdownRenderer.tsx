import React from 'react';
import Markdown from 'react-native-markdown-display';
import { StyleSheet, Text, View } from 'react-native';

interface MarkdownRendererProps {
  content: string;
  numberOfLines?: number;
}

export default function MarkdownRenderer({ content, numberOfLines }: MarkdownRendererProps) {
  // If content is empty or undefined, return a fallback
  if (!content || content.trim() === '') {
    return null;
  }

  // For simple text without markdown, just use Text component with numberOfLines
  const hasMarkdown = /[*_`#\[\]()>-]/.test(content);
  
  if (!hasMarkdown) {
    return (
      <Text 
        style={styles.simpleText} 
        numberOfLines={numberOfLines}
      >
        {content}
      </Text>
    );
  }

  const markdownStyles = {
    body: {
      color: '#D1D5DB',
      fontSize: 14,
      lineHeight: 20,
    },
    paragraph: {
      color: '#D1D5DB',
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 4,
    },
    text: {
      color: '#D1D5DB',
      fontSize: 14,
    },
    heading1: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold' as const,
      marginBottom: 8,
    },
    heading2: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold' as const,
      marginBottom: 6,
    },
    heading3: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600' as const,
      marginBottom: 4,
    },
    strong: {
      color: '#FFFFFF',
      fontWeight: 'bold' as const,
    },
    em: {
      color: '#F3F4F6',
      fontStyle: 'italic' as const,
    },
    code_inline: {
      backgroundColor: '#374151',
      color: '#F97316',
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 3,
      fontSize: 13,
    },
    code_block: {
      backgroundColor: '#1F2937',
      color: '#F97316',
      padding: 12,
      borderRadius: 6,
      marginVertical: 8,
      fontSize: 13,
    },
    fence: {
      backgroundColor: '#1F2937',
      color: '#F97316',
      padding: 12,
      borderRadius: 6,
      marginVertical: 8,
      fontSize: 13,
    },
    blockquote: {
      backgroundColor: '#374151',
      borderLeftWidth: 4,
      borderLeftColor: '#F97316',
      paddingLeft: 12,
      paddingVertical: 8,
      marginVertical: 8,
      borderRadius: 4,
    },
    list_item: {
      color: '#D1D5DB',
      fontSize: 14,
      marginBottom: 4,
    },
    bullet_list: {
      marginBottom: 8,
    },
    ordered_list: {
      marginBottom: 8,
    },
    link: {
      color: '#60A5FA',
      textDecorationLine: 'underline' as const,
    },
    hr: {
      backgroundColor: '#4B5563',
      height: 1,
      marginVertical: 12,
    },
  };

  const markdownComponent = (
    <Markdown style={markdownStyles}>
      {content}
    </Markdown>
  );

  // If numberOfLines is specified, wrap in a height-constrained View
  if (numberOfLines) {
    const maxHeight = numberOfLines * 20; // Approximate line height
    return (
      <View style={[styles.container, { maxHeight }]}>
        {markdownComponent}
      </View>
    );
  }

  return markdownComponent;
}

const styles = StyleSheet.create({
  simpleText: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 20,
  },
  container: {
    overflow: 'hidden',
  },
});