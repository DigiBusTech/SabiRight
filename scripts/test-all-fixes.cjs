const { supabaseStorage: storage } = require('../server/supabaseStorage.ts');

async function testAll() {
  console.log('=== TEST 1: Storage Route & Alert Methods ===');
  const route = await storage.createRoute({
    userId: 'unit-test-user',
    routeName: 'Office Commute',
    startLocation: 'Ikpe Ikot Akpan, Uyo',
    endLocation: 'Ikot Ekpene Plaza, Uyo',
    startLat: 5.133,
    startLng: 7.778,
    endLat: 5.109,
    endLng: 7.807,
    status: 'cleared'
  });
  console.log('Created route:', route.id, route.routeName);

  const routes = await storage.getUserRoutes('unit-test-user');
  console.log('User routes found:', routes.length);
  if (routes.length === 0) throw new Error('getUserRoutes failed');

  await storage.updateRouteStatus(route.id, 'active', 'Avoid Ikot Ekpene road, take Abak road instead.', ['Aka Road']);
  const updated = await storage.getRoute(route.id);
  console.log('Updated status:', updated.status, 'Recommendation:', updated.recommendation);

  const alert = await storage.createAlert({
    routeId: route.id,
    userId: 'unit-test-user',
    alertType: 'active_checkpoint',
    message: 'Police checkpoint active on Ikot Ekpene road',
    severity: 'high'
  });
  console.log('Created alert:', alert.id);

  const alerts = await storage.getRouteAlerts(route.id);
  console.log('Route alerts found:', alerts.length);

  await storage.deleteRoute(route.id);
  console.log('Deleted test route successfully');

  console.log('\n=== TEST 2: Modern Google Places API Autocomplete ===');
  const mapsKeySetting = await storage.getAdminSetting('google_maps_api_key');
  const mapsKey = mapsKeySetting ? mapsKeySetting.value : process.env.GOOGLE_MAPS_API_KEY;
  const autoRes = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': mapsKey
    },
    body: JSON.stringify({ input: 'Abak Road', includedRegionCodes: ['ng'] })
  });
  console.log('Places API status:', autoRes.status);
  const autoData = await autoRes.json();
  console.log('Found suggestions:', autoData.suggestions ? autoData.suggestions.length : 0);
  if (autoData.suggestions && autoData.suggestions[0]) {
    console.log('Suggestion 1:', autoData.suggestions[0].placePrediction?.text?.text);
  }

  console.log('\n=== TEST 3: Modern Google Routes API (computeRoutes) ===');
  const routeRes = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': mapsKey,
      'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.description'
    },
    body: JSON.stringify({
      origin: { address: 'Ikpe Ikot Akpan, Akwa Ibom, Nigeria' },
      destination: { address: 'Ikot Ekpene Plaza, Akwa Ibom, Nigeria' },
      travelMode: 'DRIVE'
    })
  });
  console.log('Routes API status:', routeRes.status);
  const routeData = await routeRes.json();
  if (routeData.routes && routeData.routes[0]) {
    console.log('Calculated distance:', routeData.routes[0].distanceMeters, 'meters, duration:', routeData.routes[0].duration);
  }

  console.log('\n=== TEST 4: Groq AI Live Legal Chat Generation ===');
  const groqSetting = await storage.getAdminSetting('groq_api_key');
  const groqKey = groqSetting ? groqSetting.value : process.env.GROQ_API_KEY;
  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${groqKey}`
    },
    body: JSON.stringify({
      model: 'qwen/qwen3.8-27b',
      messages: [
        { role: 'system', content: 'You are the SabiRight AI Agent. Provide concise Nigerian law guidance.' },
        { role: 'user', content: 'What are my rights if a police officer stops me in Uyo?' }
      ],
      temperature: 0.6
    })
  });
  console.log('Groq AI status:', groqRes.status);
  const groqData = await groqRes.json();
  console.log('AI response snippet:', (groqData.choices?.[0]?.message?.content || '').slice(0, 160) + '...');

  console.log('\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
}

testAll().catch(e => {
  console.error('Test failed:', e);
  process.exit(1);
});
