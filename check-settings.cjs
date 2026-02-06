
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

async function checkAdminSettings() {
  const filePath = path.join(process.cwd(), 'legal-13d13-firebase-adminsdk-fbsvc-e736182a52.json');
  const serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  const db = admin.firestore();
  const appId = 'legal-13d13';

  console.log(`Checking adminSettings in AppID: ${appId}`);

  const snapshot = await db.collection('artifacts').doc(appId).collection('adminSettings').get();
  
  if (snapshot.empty) {
    console.log('No admin settings found.');
  } else {
    console.log(`Found ${snapshot.size} admin settings:`);
    snapshot.docs.forEach(doc => {
      console.log(`ID: ${doc.id}`, doc.data());
    });
  }

  process.exit(0);
}

checkAdminSettings().catch(err => {
  console.error(err);
  process.exit(1);
});
