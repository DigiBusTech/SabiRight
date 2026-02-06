
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

async function checkPaymentMethods() {
  const filePath = path.join(process.cwd(), 'legal-13d13-firebase-adminsdk-fbsvc-e736182a52.json');
  const serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  const db = admin.firestore();
  const appId = 'legal-13d13';

  console.log(`Checking paymentMethods in AppID: ${appId}`);

  const snapshot = await db.collection('artifacts').doc(appId).collection('paymentMethods').get();
  
  if (snapshot.empty) {
    console.log('No payment methods found.');
  } else {
    console.log(`Found ${snapshot.size} payment methods:`);
    snapshot.docs.forEach(doc => {
      console.log(`ID: ${doc.id}`, doc.data());
    });
  }

  console.log(`\nChecking plans in AppID: ${appId}`);
  const plansSnapshot = await db.collection('artifacts').doc(appId).collection('plans').get();
  if (plansSnapshot.empty) {
    console.log('No plans found.');
  } else {
    console.log(`Found ${plansSnapshot.size} plans:`);
    plansSnapshot.docs.forEach(doc => {
      console.log(`ID: ${doc.id}`, doc.data());
    });
  }

  process.exit(0);
}

checkPaymentMethods().catch(err => {
  console.error(err);
  process.exit(1);
});
