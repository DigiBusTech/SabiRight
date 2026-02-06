
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

async function checkUser() {
  const filePath = path.join(process.cwd(), 'legal-13d13-firebase-adminsdk-fbsvc-e736182a52.json');
  const serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  const db = admin.firestore();
  const userId = 'iDKMsmz4u1Nf7nv09JdyyHadbUW2';
  const appId = 'legal-13d13';

  console.log(`Checking UID: ${userId} in AppID: ${appId}`);

  const profileDoc = await db.collection('artifacts').doc(appId).collection('profiles').doc(userId).get();
  const userDoc = await db.collection('artifacts').doc(appId).collection('users').doc(userId).get();

  console.log('Profile exists:', profileDoc.exists);
  if (profileDoc.exists) console.log('Profile data:', profileDoc.data());

  console.log('User exists:', userDoc.exists);
  if (userDoc.exists) console.log('User data:', userDoc.data());

  process.exit(0);
}

checkUser().catch(err => {
  console.error(err);
  process.exit(1);
});
