# SabiRight Native Mobile App (Expo / React Native)

A fully native mobile application for SabiRight built using **Expo SDK 57**, **React Native 0.86**, **NativeWind (Tailwind CSS)**, and **Supabase**.

---

## 🚀 Key Mobile Features

1. **Offline Checkpoint Mode (Zero Internet)**:
   - When stopped at remote police checkpoints or areas with poor cellular data, the app automatically switches to **Offline Emergency Mode**.
   - Serves cached statutory rights from the **1999 Constitution (Section 34, 35, 37)** and **Police Act 2020 (Sections 37, 38, 66 - Free Bail)** directly from local storage.
   - Provides instant de-escalation scripts in **English, Nigerian Pidgin, Hausa, Yoruba, and Igbo**.

2. **Native SabiRight AI Chat**:
   - Connected directly to the **Google ADK Legal Agent**.
   - Allows citizens to synthesize an **AI Pre-Case File Brief** directly from their phone with one tap.

3. **Advocate Proximity Directory & Direct Handoff**:
   - Proximity search of verified legal advocates by Nigerian city.
   - One-tap direct **WhatsApp Chat** (`https://wa.me/...`) or **Phone Call**.
   - Real-time consultation chat room with pinned Pre-Case Brief.

4. **Bookings, Plans & Payments**:
   - Review professional bookings, subscription plans, credit allocations, and storage benefits in the mobile app.
   - Pay through active hosted gateways or submit admin-configured manual payment details and receipts for approval.

5. **Biometric & Secure Session Persistence**:
   - Supabase session management powered by **`expo-secure-store`**.

---

## 📱 How to Run the Mobile App

### 1. Navigate to the mobile directory:
```bash
cd mobile
```

### 2. Install mobile dependencies:
```bash
npm install
```

### 3. Start the Expo development server:
```bash
npx expo start
```

- Press `a` to open on an Android emulator or connected device via USB.
- Press `i` to open on an iOS simulator (macOS required).
- Scan the QR code using the **Expo Go** app on your physical Android or iPhone.

### Build an Android APK for internal testing

The EAS `preview` profile builds an installable APK for direct testing:

```bash
npx eas-cli login
npx eas-cli init
npx eas-cli build --platform android --profile preview
```

Before building, add `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL`, and `EXPO_PUBLIC_EAS_PROJECT_ID` to the EAS `preview` environment. The EAS project ID must belong to this app; create/link the EAS project with `npx eas-cli init` before configuring it. Add the same ID as the `EXPO_PUBLIC_EAS_PROJECT_ID` GitHub Actions secret for APK builds. Do not commit local `.env` values. Install the resulting APK on an Android device to test native features such as microphone access and notifications.

---

## ⚙️ Environment Variables (Optional)

Create a `mobile/.env` file if you want to override defaults:
```env
EXPO_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[YOUR-SUPABASE-ANON-KEY]
EXPO_PUBLIC_API_URL=https://www.sabiright.ng
EXPO_PUBLIC_EAS_PROJECT_ID=[YOUR-EAS-PROJECT-UUID]
```

The app defaults to the production API at `https://www.sabiright.ng`. For local development against your computer, set `EXPO_PUBLIC_API_URL` to the computer's LAN IP and port 5000 (for example, `http://192.168.1.10:5000`).
Set `EXPO_PUBLIC_EAS_PROJECT_ID` to the UUID of this app's EAS project to register native push tokens. Native push notifications require a physical device and an EAS development or production build; Expo Go/simulators may not support the full push workflow.
