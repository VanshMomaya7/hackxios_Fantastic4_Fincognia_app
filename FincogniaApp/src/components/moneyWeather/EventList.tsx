/**
 * Event List Component
 * Displays upcoming events, bills, and recurring payments
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/designTokens';
import type { Event } from '../../types';

interface EventListProps {
  events: Event[];
  loading?: boolean;
}

interface EventItemProps {
  event: Event;
}

function EventItem({ event }: EventItemProps) {
  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const daysDiff = Math.ceil((timestamp - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) return 'Today';
    if (daysDiff === 1) return 'Tomorrow';
    if (daysDiff < 7) return `In ${daysDiff} days`;
    if (daysDiff < 30) return `In ${Math.floor(daysDiff / 7)} weeks`;

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'bill':
        return '📄';
      case 'recurring':
        return '🔄';
      case 'festival':
        return '🎉';
      default:
        return '📅';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'bill':
        return colors.semantic.warning;
      case 'recurring':
        return colors.primary.blue;
      case 'festival':
        return colors.accent.pink;
      default:
        return colors.neutral.darkGray;
    }
  };

  const eventColor = getEventColor(event.type);
  const isUpcoming = event.date <= Date.now() + 7 * 24 * 60 * 60 * 1000; // Within 7 days

  return (
    <View style={[styles.item, isUpcoming && styles.itemUpcoming]}>
      <View style={[styles.iconContainer, { backgroundColor: eventColor + '20' }]}>
        <Text style={styles.icon}>{getEventIcon(event.type)}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>{event.description}</Text>
        <Text style={styles.date}>{formatDate(event.date)}</Text>
        {event.merchant && (
          <Text style={styles.merchant}>{event.merchant}</Text>
        )}
      </View>

      <View style={styles.amountContainer}>
        <Text style={[styles.amount, { color: eventColor }]}>
          {formatAmount(event.amount)}
        </Text>
      </View>
    </View>
  );
}

export default function EventList({ events, loading = false }: EventListProps) {
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Upcoming Events</Text>
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Upcoming Events</Text>
        <Text style={styles.emptyText}>No upcoming events</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upcoming Events</Text>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EventItem event={item} />}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.large,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  title: {
    fontSize: typography.size.h2,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
    marginBottom: spacing.md,
  },
  loadingText: {
    fontSize: typography.size.body,
    color: colors.neutral.mediumGray,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  emptyText: {
    fontSize: typography.size.body,
    color: colors.neutral.mediumGray,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.neutral.background,
    borderRadius: borderRadius.medium,
  },
  itemUpcoming: {
    borderLeftWidth: 3,
    borderLeftColor: colors.semantic.warning,
    paddingLeft: spacing.sm - 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  description: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.black,
    marginBottom: spacing.xs / 2,
  },
  date: {
    fontSize: typography.size.caption,
    color: colors.neutral.darkGray,
    marginBottom: spacing.xs / 2,
  },
  merchant: {
    fontSize: typography.size.caption,
    color: colors.neutral.mediumGray,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.bold,
  },
  separator: {
    height: spacing.sm,
  },
});


