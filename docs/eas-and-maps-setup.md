# EAS Build & Google Maps SDK Setup Guide

This guide details how to build and configure the Ryde Capital driver mobile application using **Expo Dev Client**, **EAS Build**, and **Google Maps Platform** with strict security and budget controls.

---

## 1. Google Maps Platform Configuration

Ryde requires **three separate, restricted API keys** to enforce least privilege, prevent key theft, and minimize billing costs:

| Key Name | Platform | Used By | Allowed APIs | Application Restrictions |
|---|---|---|---|---|
| `ANDROID_MAPS_SDK_KEY` | Android | Mobile Driver App | Maps SDK for Android | Package Name: `com.ryde.capital` + SHA-1 Fingerprint |
| `IOS_MAPS_SDK_KEY` | iOS | Mobile Driver App | Maps SDK for iOS | Bundle Identifier: `com.ryde.capital` |
| `SERVER_MAPS_KEY` | Backend | `ryde-capital-backend` | Directions API, Distance Matrix API, Geocoding API | Server IP / CIDR restriction. **NEVER bundled in mobile client.** |

### A. Android Key Setup
1. Open the [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/credentials).
2. Create an API Key named `Ryde Capital Android Maps SDK`.
3. Under **API restrictions**, select **Restrict key** and choose only **Maps SDK for Android**.
4. Under **Application restrictions**, select **Android apps**.
5. Add your package name: `com.ryde.capital`.
6. Add your SHA-1 fingerprint:
   - For local debug keystore: run `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`.
   - For EAS build credentials: run `eas credentials` and copy the SHA-1 fingerprint.
7. Place the key in `app.json` under `expo.android.config.googleMaps.apiKey` or pass via environment variable `EXPO_PUBLIC_ANDROID_GOOGLE_MAPS_KEY`.

### B. iOS Key Setup
1. In Google Cloud Console, create an API Key named `Ryde Capital iOS Maps SDK`.
2. Under **API restrictions**, choose only **Maps SDK for iOS**.
3. Under **Application restrictions**, select **iOS apps**.
4. Add your bundle ID: `com.ryde.capital`.
5. Place the key in `app.json` under `expo.ios.config.googleMapsApiKey` or pass via environment variable `EXPO_PUBLIC_IOS_GOOGLE_MAPS_KEY`.

### C. Server Backend Key Setup
1. Create an API key named `Ryde Server Maps Engine`.
2. Under **API restrictions**, select **Directions API**, **Distance Matrix API**, and **Geocoding API**.
3. Under **Application restrictions**, choose **IP addresses** and enter your production backend server static IP.
4. Place the key in `ryde-capital/backend/.env` as:
   ```env
   GOOGLE_MAPS_SERVER_API_KEY=AIzaSy...
   ```

---

## 2. Zero-Cost Telemetry Policy
- **Driver GPS telemetry (`POST /drivers/me/location`) is streamed directly to PostgreSQL (PostGIS) on Supabase, NOT Google Maps.**
- Google APIs are only invoked by the backend matching worker for distance matrices and route polylines.
- In-memory LRU caching is applied to all route queries with a 15-minute TTL, reducing API billable events by > 80%.

---

## 3. Expo Dev Client & EAS Build Profiles

`ryde-capital/mobile/eas.json` defines three build profiles:

### A. Development Build (with Native Map & Background Services)
To build a custom development client containing native `react-native-maps` and background location binaries:
```bash
# Build Android APK locally with dev client
npx expo run:android

# Or build via EAS cloud
eas build --profile development --platform android
```

### B. Preview Build (Internal Testing APK)
```bash
eas build --profile preview --platform android
```

### C. Production Build (AAB for Google Play / App Store)
```bash
eas build --profile production --platform all
```

---

## 4. Background Location Permissions Matrix

The driver app configures the following permissions in `app.json`:
- **Android**: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `ACCESS_BACKGROUND_LOCATION`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_LOCATION`
- **iOS**: `NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription`, `UIBackgroundModes: ["location", "fetch"]`

Adaptive frequency:
- **Idle Online**: GPS updates recorded every ~25 seconds.
- **Active Trip**: Telemetry recorded every ~5 seconds.
- **Offline Mode**: Updates queued up to 20 points and synced via batch upon reconnect.
