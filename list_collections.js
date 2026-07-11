import admin from "firebase-admin";
import fs from "fs";
import path from "path";

const serviceAccountPath = path.join(process.cwd(), 'legal-13d13-firebase-adminsdk-fbsvc-e736182a52.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error("Error: Key file not found.");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'legal-13d13'
});

const db = admin.firestore();

async function main() {
  const appId = "legal-13d13";
  console.log(`Checking subcollections under artifacts/${appId}...`);
  try {
    const docRef = db.collection('artifacts').doc(appId);
    const subColls = await docRef.listCollections();
    console.log(`Subcollections under artifacts/${appId}:`);
    for (const sub of subColls) {
      console.log(` - ${sub.id}`);
      // Get some documents
      const docsSnap = await sub.limit(3).get();
      console.log(`   * Document count: ${docsSnap.size}`);
      docsSnap.forEach(d => {
        console.log(`     - [${d.id}]:`, d.data());
      });
    }
  } catch (err) {
    console.error("Failed to list collections:", err);
  }

  process.exit(0);
}

main();
