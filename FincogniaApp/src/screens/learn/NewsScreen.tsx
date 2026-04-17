/**
 * News Screen
 * Displays top 10 Indian stock market news with sentiment analysis
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../constants/designTokens';
import { fetchStockNews, type NewsArticle } from '../../services/newsService';

export default function NewsScreen() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNews = useCallback(async () => {
    try {
      setError(null);
      const newsData = await fetchStockNews();
      setNews(newsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load news';
      setError(errorMessage);
      console.error('[News Screen] Error loading news:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadNews();
  }, [loadNews]);

  const handleOpenLink = async (url: string) => {
    try {
      // Ensure URL has proper protocol
      let formattedUrl = url.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl;
      }

      console.log('[News Screen] Attempting to open URL:', formattedUrl);
      
      // On Android, canOpenURL might not work reliably, so we'll try to open directly
      // Wrap in try-catch to handle gracefully
      try {
        const canOpen = await Linking.canOpenURL(formattedUrl);
        console.log('[News Screen] Can open URL:', canOpen);
        
        if (canOpen) {
          await Linking.openURL(formattedUrl);
          return;
        }
      } catch (canOpenError) {
        console.log('[News Screen] canOpenURL check failed, attempting to open anyway:', canOpenError);
      }
      
      // Try to open the URL directly (works on most Android devices)
      await Linking.openURL(formattedUrl);
    } catch (error) {
      console.error('[News Screen] Error opening link:', error);
      // Note: These are mock URLs, so they won't open real articles
      // In production, replace with actual news article URLs
      console.warn('[News Screen] Note: Mock URLs cannot be opened. Replace with real URLs for production.');
    }
  };

  const getSentimentColor = (sentiment?: string): string => {
    if (!sentiment) return colors.neutral.mediumGray;
    switch (sentiment) {
      case 'positive':
        return '#16a34a'; // green
      case 'negative':
        return '#dc2626'; // red
      case 'neutral':
      default:
        return colors.neutral.mediumGray;
    }
  };

  const getSentimentIcon = (sentiment?: string): string => {
    if (!sentiment) return '📰';
    switch (sentiment) {
      case 'positive':
        return '📈';
      case 'negative':
        return '📉';
      case 'neutral':
      default:
        return '📊';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Stock Market News</Text>
          <Text style={styles.headerSubtitle}>Latest updates from Indian markets</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.blue} />
          <Text style={styles.loadingText}>Loading news and analyzing sentiment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Stock Market News</Text>
          <Text style={styles.headerSubtitle}>Latest updates from Indian markets</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadNews}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stock Market News</Text>
        <Text style={styles.headerSubtitle}>Latest updates from Indian markets</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        {news.map((article) => (
          <TouchableOpacity
            key={article.id}
            style={styles.newsCard}
            onPress={() => handleOpenLink(article.url)}
            activeOpacity={0.7}>
            <View style={styles.newsHeader}>
              <Text style={styles.sentimentIcon}>{getSentimentIcon(article.sentiment)}</Text>
              <View style={styles.newsHeaderText}>
                <Text style={styles.source}>{article.source}</Text>
                <View style={styles.sentimentBadge}>
                  <View
                    style={[
                      styles.sentimentDot,
                      { backgroundColor: getSentimentColor(article.sentiment) },
                    ]}
                  />
                  <Text
                    style={[
                      styles.sentimentText,
                      { color: getSentimentColor(article.sentiment) },
                    ]}>
                    {article.sentiment?.toUpperCase() || 'NEUTRAL'}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.headline}>{article.headline}</Text>

            <View style={styles.newsFooter}>
              <Text style={styles.time}>
                {new Date(article.publishedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              <Text style={styles.readMore}>Read more →</Text>
            </View>
          </TouchableOpacity>
        ))}

        {news.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No news available at the moment</Text>
            <Text style={styles.emptySubtext}>Pull to refresh</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  header: {
    backgroundColor: colors.neutral.white,
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerTitle: {
    fontSize: typography.size.h1,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
    marginBottom: spacing.xs / 2,
  },
  headerSubtitle: {
    fontSize: typography.size.caption,
    color: colors.neutral.mediumGray,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.size.body,
    color: colors.neutral.mediumGray,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.size.body,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary.blue,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.medium,
  },
  retryButtonText: {
    color: colors.neutral.white,
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
  },
  newsCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  newsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  sentimentIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  newsHeaderText: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  source: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.mediumGray,
  },
  sentimentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  sentimentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sentimentText: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.semiBold,
  },
  headline: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.medium,
    color: colors.neutral.black,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  time: {
    fontSize: typography.size.caption,
    color: colors.neutral.mediumGray,
  },
  readMore: {
    fontSize: typography.size.caption,
    color: colors.primary.blue,
    fontWeight: typography.weight.semiBold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    fontSize: typography.size.body,
    color: colors.neutral.mediumGray,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.size.caption,
    color: colors.neutral.lightGray,
  },
});

