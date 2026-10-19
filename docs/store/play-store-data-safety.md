# Google Play Store: Data Safety Form & Store Listing Draft

## 1. Background Location Access Justification

> **Google Play Declaration Requirement**: Transport driver applications must justify why background location (`ACCESS_BACKGROUND_LOCATION`) is essential when the user is not actively interacting with the foreground UI.

### Official Submission Text:
```
Ryde Capital is an on-demand commercial driver partner application.

Why Background Location Is Essential:
1. Real-time Offer Dispatch: Approved drivers who have toggled their availability status to "Online" must receive nearby ride offers based on proximity, even while the driver app is minimized, the screen is locked, or another navigation application is in the foreground.
2. Safety & Incident Response: While executing an active customer trip, continuous background telemetry is required to track the vehicle route, verify customer pickup and drop geofences, compute accurate fares, and ensure passenger and driver safety via our 24/7 Safety Response Center (SRC).
3. Foreground Service & User Control: Location access is strictly bound to driver availability. When the driver toggles "Offline", location tracking immediately ceases. While Online or on a trip, a persistent Android Foreground Service notification is visible at all times ("Ryde Capital is active - Tracking your route").
```

---

## 2. Google Play Data Safety Questionnaire Declarations

| Data Category | Data Type | Collected? | Shared? | Processing Purpose | Ephemeral? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Location** | Approximate location | Yes | Yes (Customer) | App functionality, ride matching | No |
| **Location** | Precise location | Yes | Yes (Customer) | Navigation, fare calculation, safety | Pruned after 30 days |
| **Personal Info** | Name | Yes | Yes (Customer) | Account management, driver profile | No |
| **Personal Info** | Phone number | Yes | No (Masked) | Auth, safety contact | No |
| **Personal Info** | User IDs | Yes | No | Account management | No |
| **Financial Info** | Bank account / UPI | Yes | No | Earnings disbursement | No |
| **Photos & Videos** | Photos (License/Vehicle) | Yes | No | KYC verification, handover condition | No |
| **Device Identifiers** | Device ID | Yes | No | Fraud prevention, push tokens | No |

---

## 3. Store Listing Draft

### App Title (Max 30 Characters):
`Ryde Capital - Driver Partner`

### Short Description (Max 80 Characters):
`Drive with Ryde Capital. Earn transparent fares with daily & weekly payouts.`

### Full Description:
```
Welcome to Ryde Capital, the premier driver partner platform engineered for transparent earnings, reliable dispatch, and driver safety.

Why Drive with Ryde Capital?
• Guaranteed Transparent Fares: Upfront fare breakdown with predictable platform fees. What you see is what you earn.
• Swift Payouts: Automated weekly settlements directly to your UPI ID or bank account.
• Smart Dispatch: Real-time intelligent matching engine connects you to nearby ride bookings without dead mileage.
• Safety First: Built-in 24/7 Emergency SOS, real-time trip route sharing with loved ones, and instant law enforcement escalation.
• In-App & External Navigation: Seamless one-tap handoff to Google Maps for turn-by-turn directions while keeping your ride active.
• Dedicated Driver Support: Fast grievance redressal and transparent customer rating dispute resolution.

Getting Started Is Simple:
1. Download Ryde Capital and register with your mobile number.
2. Upload your Commercial Driving License and identity documents.
3. Complete quick admin verification.
4. Go Online, accept ride offers, and start earning!

Note: Continuous background location tracking is active only when you choose to go Online or during customer trips to ensure accurate ride matching and passenger safety.
```
