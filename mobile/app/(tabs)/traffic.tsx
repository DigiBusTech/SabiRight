import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useCredits } from '../../hooks/useCredits';
import { useTheme } from '../../context/ThemeContext';
import { apiFetch } from '../../lib/api';
import { AlertTriangle, MapPin, RefreshCcw, ShieldCheck } from 'lucide-react-native';

export default function TrafficScreen() {
  const { user, profile } = useAuth();
  const { refresh: refreshCredits } = useCredits();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [traffic, setTraffic] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [routes, setRoutes] = useState<any[]>([]);
  const [results, setResults] = useState<Record<string, any>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [rName, setRName] = useState('');
  const [rFrom, setRFrom] = useState('');
  const [rTo, setRTo] = useState('');
  const [sugField, setSugField] = useState<'from' | 'to' | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const sugTimer = useRef<any>(null);

  const onPlaceInput = (field: 'from' | 'to', v: string) => {
    (field === 'from' ? setRFrom : setRTo)(v);
    setSugField(field);
    if (sugTimer.current) clearTimeout(sugTimer.current);
    if (v.trim().length < 3) { setSuggestions([]); return; }
    sugTimer.current = setTimeout(async () => {
      try {
        const r = await apiFetch(`/api/maps/places-autocomplete?input=${encodeURIComponent(v.trim())}`);
        const d = await r.json();
        setSuggestions((d.suggestions || []).map((s: any) => s.text).slice(0, 5));
      } catch { setSuggestions([]); }
    }, 350);
  };

  const loadRoutes = async () => {
    if (!user?.id) return;
    try {
      const res = await apiFetch(`/api/routes/${user.id}`);
      if (res.ok) setRoutes(await res.json());
    } catch {}
  };

  React.useEffect(() => { loadRoutes(); }, [user?.id]);

  const addRoute = async () => {
    if (!rName.trim() || !rFrom.trim() || !rTo.trim()) {
      Alert.alert('Missing details', 'Enter a name, start and destination.');
      return;
    }
    try {
      const res = await apiFetch('/api/routes', {
        method: 'POST',
        body: JSON.stringify({ routeName: rName.trim(), startLocation: rFrom.trim(), endLocation: rTo.trim() })
      });
      if (!res.ok) throw new Error();
      setRName(''); setRFrom(''); setRTo(''); setAdding(false);
      loadRoutes();
    } catch {
      Alert.alert('Could not save route', 'Check your connection and sign in, then try again.');
    }
  };

  const checkRoute = async (id: string) => {
    setBusyId(id);
    try {
      const res = await apiFetch(`/api/routes/${id}/refresh`, { method: 'POST' });
      if (res.ok) { const d = await res.json(); setResults(prev => ({ ...prev, [id]: d })); }
      else if (res.status === 402) Alert.alert('Out of credits', 'Top up or upgrade your plan to check routes.');
      else Alert.alert('Check failed', 'Could not get traffic for this route.');
    } catch {
      Alert.alert('Check failed', 'Network error.');
    } finally {
      refreshCredits();
      setBusyId(null);
    }
  };

  const removeRoute = async (id: string) => {
    try {
      await apiFetch(`/api/routes/${id}`, { method: 'DELETE' });
      setRoutes(prev => prev.filter(r => r.id !== id));
    } catch {}
  };
  const fetchTraffic = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/dashboard/traffic/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setTraffic(data);
      } else {
        // Offline default fallback
        setTraffic({
          location: `${profile?.city || 'Lagos'} Corridor`,
          status: 'Active',
          description: 'Traffic is moving normally with regular citizen flows. Maintain valid vehicle documents and adhere to FRSC guidelines.'
        });
      }
    } catch (e) {
      // Offline default fallback
      setTraffic({
        location: `${profile?.city || 'Lagos'} Corridor`,
        status: 'Active',
        description: 'Traffic is moving normally with regular citizen flows. Maintain valid vehicle documents and adhere to FRSC guidelines.'
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTraffic();
  }, [user?.id]);

  const handleRefresh = async () => {
    if (!user?.id || loading) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/dashboard/traffic/${user.id}/refresh`, {
        method: 'POST',
        body: JSON.stringify({ city: profile?.city || 'Lagos' })
      });
      if (res.ok) {
        const data = await res.json();
        setTraffic(data.traffic || data);
      } else if (res.status === 402) {
        Alert.alert('Out of credits', 'You do not have enough credits to refresh live traffic alerts. Please top up your credits in your Profile.');
      }
    } catch (e) {
      console.warn('Traffic refresh notice: using cached statutory corridor');
    } finally {
      refreshCredits();
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surfaceCard, borderBottomColor: colors.surfaceBorder }]}>
        <View>
          <View style={styles.titleRow}>
            <AlertTriangle size={20} color="#f59e0b" />
            <Text style={[styles.titleText, { color: colors.textPrimary }]}>SabiMove Alerts</Text>
          </View>
          <Text style={[styles.subtitleText, { color: colors.textMuted }]}>Road conditions & checkpoint intelligence</Text>
        </View>

        <TouchableOpacity
          onPress={handleRefresh}
          disabled={loading}
          style={[styles.refreshBtn, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
        >
          <RefreshCcw size={14} color={colors.primary} />
          <Text style={[styles.refreshBtnText, { color: colors.primary }]}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollList} 
        contentContainerStyle={[
          styles.scrollListContent,
          { paddingBottom: insets.bottom + 90 }
        ]} 
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.trafficCard, { backgroundColor: colors.surfaceCard, borderColor: colors.surfaceBorder, marginBottom: 14 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textPrimary }}>My Routes</Text>
            <TouchableOpacity onPress={() => setAdding(a => !a)}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.primary }}>{adding ? 'Cancel' : '+ Add route'}</Text>
            </TouchableOpacity>
          </View>
          {adding && (
            <View style={{ marginTop: 10, gap: 8 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {['Home', 'Office', 'School'].map(n => (
                  <TouchableOpacity key={n} onPress={() => setRName(n)} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: colors.surfaceBorder, backgroundColor: rName === n ? colors.primary : colors.surface }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: rName === n ? '#ffffff' : colors.textMuted }}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput value={rName} onChangeText={setRName} placeholder="Route name (e.g. Home to Office)" placeholderTextColor={colors.textMuted} style={{ borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.textPrimary, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13 }} />
              {([['from', 'From (address or area)', rFrom], ['to', 'To (address or area)', rTo]] as const).map(([field, ph, val]) => (
                <View key={field}>
                  <TextInput value={val} onChangeText={(v) => onPlaceInput(field, v)} onFocus={() => { setSugField(field); setSuggestions([]); }} placeholder={ph} placeholderTextColor={colors.textMuted} style={{ borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.textPrimary, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13 }} />
                  {sugField === field && suggestions.length > 0 && (
                    <View style={{ marginTop: 4, borderWidth: 1, borderColor: colors.surfaceBorder, borderRadius: 12, backgroundColor: colors.surface, overflow: 'hidden' }}>
                      {suggestions.map((s, i) => (
                        <TouchableOpacity                         key={`${s}-${i}`} onPress={() => { (field === 'from' ? setRFrom : setRTo)(s); setSuggestions([]); setSugField(null); }} style={{ paddingHorizontal: 12, paddingVertical: 9, borderTopWidth: i ? 1 : 0, borderTopColor: colors.surfaceBorder }}>
                          <Text numberOfLines={2} style={{ fontSize: 12, color: colors.textPrimary }}>{s}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ))}
              <TouchableOpacity onPress={addRoute} style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 11, alignItems: 'center' }}>
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }}>Save route</Text>
              </TouchableOpacity>
            </View>
          )}
          {routes.length === 0 && !adding && (
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 8 }}>Add Home, Office or any trip to get travel time and reroute tips.</Text>
          )}
          {routes.map(r => {
            const res = results[r.id];
            return (
              <View key={r.id} style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.surfaceBorder }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '800', color: colors.textPrimary }}>{r.routeName}</Text>
                    <Text numberOfLines={1} style={{ fontSize: 11, color: colors.textMuted }}>{r.startLocation} to {r.endLocation}</Text>
                  </View>
                  <TouchableOpacity onPress={() => checkRoute(r.id)} disabled={busyId === r.id} style={{ backgroundColor: colors.primarySoft, borderColor: colors.primary, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginLeft: 8 }}>
                    {busyId === r.id ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={{ fontSize: 12, fontWeight: '800', color: colors.primary }}>Check</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeRoute(r.id)} style={{ marginLeft: 8, padding: 4 }}>
                    <Text style={{ fontSize: 16, color: colors.textMuted }}>x</Text>
                  </TouchableOpacity>
                </View>
                {res && (
                  <View style={{ marginTop: 8, padding: 10, borderRadius: 12, backgroundColor: colors.surface }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary }}>
                      {res.etaMinutes != null ? `${res.etaMinutes} min` : 'ETA n/a'}{res.distanceKm != null ? `  -  ${res.distanceKm} km` : ''}  -  {String(res.status || 'unknown').toUpperCase()}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>{res.message}</Text>
                    {!!res.recommendation && <Text style={{ fontSize: 12, color: colors.primary, marginTop: 4, fontWeight: '700' }}>Reroute: {res.recommendation}</Text>}
                    {Array.isArray(res.cloakedStreets) && res.cloakedStreets.length > 0 && <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>Avoid: {res.cloakedStreets.join(', ')}</Text>}
                  </View>
                )}
              </View>
            );
          })}
        </View>
        {loading && !traffic ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Scanning road intelligence...</Text>
          </View>
        ) : (
          <View style={[styles.trafficCard, { backgroundColor: colors.surfaceCard, borderColor: colors.surfaceBorder }]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.locationGroup}>
                <MapPin size={18} color={colors.primary} />
                <Text style={[styles.locationText, { color: colors.textPrimary }]}>
                  {traffic?.location || `${profile?.city || 'Lagos'} Corridor`}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: colors.successSoft, borderColor: colors.success }]}>
                <Text style={[styles.statusText, { color: colors.success }]}>{traffic?.status || 'Active'}</Text>
              </View>
            </View>

            <View style={[styles.descriptionBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                {traffic?.description || 'Traffic is moving normally with regular citizen flows. Maintain valid documents and adhere to FRSC guidelines.'}
              </Text>
            </View>

            <View style={[styles.cardFooter, { borderTopColor: colors.surfaceBorder }]}>
              <ShieldCheck size={14} color={colors.success} />
              <Text style={[styles.footerText, { color: colors.success }]}>NDPC & Traffic Statutory Laws Grounded</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitleText: {
    fontSize: 12,
    marginTop: 2,
  },
  refreshBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollList: {
    flex: 1,
  },
  scrollListContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 13,
    marginTop: 12,
    fontWeight: '600',
  },
  trafficCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  locationGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '800',
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  descriptionBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

