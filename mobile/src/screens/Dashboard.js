import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { db } from '../utils/firebase';
import { collection, query, where, onSnapshot, limit, doc, orderBy } from 'firebase/firestore';
import { Shield, MapPin, Briefcase, Bell, User, Scale, AlertTriangle, ChevronRight, Calendar } from 'lucide-react-native';

const FIREBASE_APP_ID = 'legal-13d13';

const FeatureCard = ({ icon: Icon, title, subtitle, color, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={[styles.iconBox, { backgroundColor: '#f1f5f9' }]}>
      <Icon size={24} color={color} />
    </View>
    <View style={styles.cardInfo}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </View>
    <ChevronRight size={20} color={theme.colors.border} />
  </TouchableOpacity>
);

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Path: artifacts/{appId}/traffic_alerts
    const alertsRef = collection(db, 'artifacts', FIREBASE_APP_ID, 'traffic_alerts');
    const qAlerts = query(alertsRef, orderBy('createdAt', 'desc'), limit(3));
    
    const unsubscribeAlerts = onSnapshot(qAlerts, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentAlerts(alerts);
    });

    // Path: artifacts/{appId}/events
    const eventsRef = collection(db, 'artifacts', FIREBASE_APP_ID, 'events');
    const qEvents = query(eventsRef, orderBy('date', 'asc'), limit(3));

    const unsubscribeEvents = onSnapshot(qEvents, (snapshot) => {
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUpcomingEvents(events);
      setLoading(false);
    });

    return () => {
      unsubscribeAlerts();
      unsubscribeEvents();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // Refresh logic handled by onSnapshot, but we can add a manual delay for UI feedback
    setTimeout(() => setRefreshing(false), 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {profile?.displayName || 'Citizen'}</Text>
          <Text style={styles.subGreeting}>Welcome to SabiRight Mobile</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn}>
          <User size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollArea}
        refreshControl={<RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />}
      >
        {/* Credits Card */}
        <View style={styles.creditsCard}>
          <View>
            <Text style={styles.creditsLabel}>Available Credits</Text>
            <Text style={styles.creditsValue}>{profile?.credits || 0} SB</Text>
          </View>
          <TouchableOpacity style={styles.topUpBtn}>
            <Text style={styles.topUpText}>Top Up</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.featuresGrid}>
          <FeatureCard 
            icon={Scale} 
            title="Civic Guard" 
            subtitle="Know your rights" 
            color={theme.colors.primary} 
          />
          <FeatureCard 
            icon={AlertTriangle} 
            title="Traffic Alerts" 
            subtitle="Lagos & Abuja live" 
            color={theme.colors.accent} 
          />
          <FeatureCard 
            icon={Briefcase} 
            title="AI Job Match" 
            subtitle="Verified listings" 
            color="#16a34a" 
          />
        </View>

        {/* Upcoming Events Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
              <TouchableOpacity key={event.id} style={styles.eventCard}>
                <View style={styles.eventDate}>
                  <Calendar size={18} color={theme.colors.primary} />
                  <Text style={styles.dateText}>{event.date}</Text>
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <View style={styles.eventMeta}>
                    <MapPin size={12} color={theme.colors.textLight} />
                    <Text style={styles.metaText}>{event.location}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>No upcoming events</Text>
          )}
        </View>

        <View style={styles.alertsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Alerts</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : recentAlerts.length > 0 ? (
            recentAlerts.map((alert) => (
              <View key={alert.id} style={styles.alertItem}>
                <View style={[styles.alertIndicator, { backgroundColor: alert.type === 'danger' ? theme.colors.error : theme.colors.accent }]} />
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>{alert.location}</Text>
                  <Text style={styles.alertDesc}>{alert.description}</Text>
                </View>
                <Text style={styles.alertTime}>Just now</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No recent alerts</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
  },
  subGreeting: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  scrollArea: {
    padding: theme.spacing.lg,
  },
  creditsCard: {
    backgroundColor: theme.colors.text,
    borderRadius: theme.roundness.lg,
    padding: theme.spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  creditsLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 4,
  },
  creditsValue: {
    color: 'white',
    fontSize: 28,
    fontWeight: '800',
  },
  topUpBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.roundness.md,
  },
  topUpText: {
    color: 'white',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  featuresGrid: {
    marginBottom: theme.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: theme.roundness.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: theme.colors.textLight,
  },
  alertsSection: {
    marginTop: theme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  viewAll: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  alertItem: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  alertIndicator: {
    width: 4,
    height: 30,
    borderRadius: 2,
    marginRight: theme.spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  alertDesc: {
    fontSize: 13,
    color: theme.colors.textLight,
  },
  alertTime: {
    fontSize: 11,
    color: theme.colors.textLight,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textLight,
    marginTop: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  eventCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  eventDate: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: theme.spacing.md,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
    marginRight: theme.spacing.md,
    width: 80,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: 4,
    textAlign: 'center',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginLeft: 4,
  },
});

export default Dashboard;
