# Native Firebase Setup

## Required Files (download from Firebase Console)

### Android
1. Go to Firebase Console > Project Settings > Your apps > Android
2. If no Android app exists, add one with package name: `com.tradieconnect.android`
3. Download `google-services.json` and place it in the project root

### iOS
1. Go to Firebase Console > Project Settings > Your apps > iOS
2. If no iOS app exists, add one with bundle ID: `com.tradieconnect.ios`
3. Download `GoogleService-Info.plist` and place it in the project root

## Building for Native

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios

# Or use EAS Build
eas build -p android --profile preview
eas build -p ios --profile preview
```

## Notes
- The native Firebase SDK (`@react-native-firebase/*`) is auto-initialized from these config files
- No API keys needed in code — they're in the config files
- Web continues to use env vars from `.env.local`
