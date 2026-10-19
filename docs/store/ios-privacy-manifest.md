# iOS Privacy Manifest & App Store Review Readiness

## 1. PrivacyInfo.xcprivacy XML Structure

The iOS privacy manifest `PrivacyInfo.xcprivacy` declares data collection, tracking, and required-reason API usage in accordance with Apple App Store submission policies.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- 1. Tracking: Ryde Capital does NOT track users across third-party apps or websites -->
    <key>NSPrivacyTracking</key>
    <false/>
    <key>NSPrivacyTrackingDomains</key>
    <array/>

    <!-- 2. Collected Data Types -->
    <key>NSPrivacyCollectedDataTypes</key>
    <array>
        <!-- Precise Location -->
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypePreciseLocation</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
        <!-- Contact Info: Phone Number -->
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypePhoneNumber</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
        <!-- Financial Info: Payment Details -->
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypePaymentInfo</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
        <!-- Photos / User Content -->
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypePhotosOrVideos</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
    </array>

    <!-- 3. Required Reason APIs -->
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <!-- User Defaults (Local Preferences & Auth Session Cache) -->
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPITypeUserDefaults</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>CA92.1</string>
            </array>
        </dict>
        <!-- System Boot Time (High-Precision GPS Timestamping) -->
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPITypeSystemBootTime</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>35F9.1</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
```

---

## 2. iOS Permission Descriptions in Info.plist

| Key | Review Justification & English String |
| :--- | :--- |
| `NSLocationWhenInUseUsageDescription` | "Ryde Capital requires your location to navigate to pickup locations and track active customer trips." |
| `NSLocationAlwaysAndWhenInUseUsageDescription` | "Ryde Capital requires background location to match you with nearby customer ride offers even when the app is in background." |
| `NSCameraUsageDescription` | "Ryde Capital requires camera access to capture vehicle handover photos and verify driver documents." |
| `NSPhotoLibraryUsageDescription` | "Ryde Capital requires photo library access to upload driver license and identity documents." |
| `LSApplicationQueriesSchemes` | Contains `["comgooglemaps"]` to verify if the Google Maps app is installed before executing deep-link navigation handoff. |
