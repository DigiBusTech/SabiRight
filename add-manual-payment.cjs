
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

async function addManualPaymentMethod() {
  const filePath = path.join(process.cwd(), 'legal-13d13-firebase-adminsdk-fbsvc-e736182a52.json');
  const serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  const db = admin.firestore();
  const appId = 'legal-13d13';

  console.log(`Adding manual payment method in AppID: ${appId}`);

  const manualMethod = {
    id: 'manual-bank-transfer',
    name: 'Bank Transfer (Manual)',
    type: 'manual',
    active: true,
    icon: 'building-2',
    description: 'Transfer funds to our account and upload proof of payment.',
    fields: [
      { name: 'account_name', label: 'Account Name', type: 'text', required: true },
      { name: 'transaction_ref', label: 'Transaction Reference', type: 'text', required: true },
      { name: 'proof', label: 'Proof of Payment', type: 'file', required: true }
    ],
    instructions: 'Please transfer the exact amount to:<br/>Bank: Zenith Bank<br/>Account: 1234567890<br/>Name: DigiZen AI Limited',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await db.collection('artifacts').doc(appId).collection('paymentMethods').doc(manualMethod.id).set(manualMethod);
  
  console.log('Manual payment method added successfully.');
  process.exit(0);
}

addManualPaymentMethod().catch(err => {
  console.error(err);
  process.exit(1);
});
