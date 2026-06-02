# Node.js Shared Hosting Deployment Guide (SabiRight)

This guide explains how to deploy the SabiRight application to a shared hosting environment and the necessary Firestore settings.

## 1. Prerequisites
- Shared hosting with Node.js support (e.g., cPanel with "Setup Node.js App").
- A Firebase project with Firestore enabled.
- The service account JSON file for your Firestore project.

## 2. Setting up the Node.js App on Shared Hosting
1. **Upload Files**: Upload your project files (excluding `node_modules`, `client/node_modules`, and `.git`) to your hosting account via FTP or File Manager.
2. **Create Node.js App**:
   - In cPanel, find "Setup Node.js App".
   - Create a new application.
   - **Node.js version**: Choose 18 or 20 (LTS).
   - **Application mode**: `production`.
   - **Application root**: The folder where you uploaded the files (e.g., `public_html/sabiright`).
   - **Application URL**: Your domain (e.g., `https://example.com`).
   - **Application startup file**: `server/index.ts` (or the compiled version `dist/server/index.js` if you build locally).
3. **Environment Variables**: Add the following variables in the Node.js app setup:
   - `NODE_ENV`: `production`
   - `FIREBASE_APP_ID`: `legal-13d13`
   - `FIREBASE_SERVICE_ACCOUNT`: (Paste the content of your service account JSON file here)
   - `PAYSTACK_SECRET_KEY`: (Your Paystack secret key)
   - `ADMIN_SETUP_KEY`: (A secure key for admin setup)
4. **Install Dependencies**: Click "Run NPM Install" in the Node.js app setup.

## 3. Firestore Settings
To ensure the application works correctly with Firestore, perform the following steps in the Firebase Console:

### A. Security Rules
Deploy the following rules in the **Firestore > Rules** tab:

```rules
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isSignedIn() && (
        get(/databases/$(database)/documents/artifacts/legal-13d13/profiles/$(request.auth.uid)).data.isAdmin == true ||
        get(/databases/$(database)/documents/artifacts/legal-13d13/users/$(request.auth.uid)).data.isAdmin == true
      );
    }

    match /artifacts/legal-13d13/{collection}/{document=**} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
      
      match /profiles/{userId} {
        allow write: if isOwner(userId);
      }
      match /users/{userId} {
        allow write: if isOwner(userId);
      }
      
      match /vendorApplications/{appId} {
        allow create: if isSignedIn();
        allow read, update: if isAdmin() || resource.data.userId == request.auth.uid;
      }
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### B. Indexing
If you encounter errors like "The query requires an index," Firestore will provide a link in the server logs. Click that link to create the required index automatically.

### C. Authentication
Ensure you have enabled the required Sign-in methods (Email/Password, etc.) in the **Authentication > Sign-in method** tab.

## 4. Troubleshooting
- **Logs**: Check the logs in the "Setup Node.js App" interface if the application fails to start.
- **Ports**: Shared hosting usually handles the port automatically. Ensure your server code listens on `process.env.PORT`.
