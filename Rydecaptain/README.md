# RYDE Captain - React Native Mobile App

A complete, responsive native mobile application for **RYDE Drivers & Captains**, built with **React Native** and **Expo**. Recreated with high fidelity based on the attached Figma UI design reference.

---

## 📱 How to Run as a Native App on your Android Mobile Phone

### Method 1: React Native CLI via USB (Recommended for Development)
No Expo Go app required. This installs the native **RYDE Captain** app directly onto your phone:

1. Connect your Android phone to your PC with a USB cable.
2. Enable **USB Debugging** on your phone:
   - Go to **Settings > About Phone > Tap 'Build Number' 7 times** to enable Developer Options.
   - Go to **Settings > Developer Options > Enable 'USB Debugging'**.
3. In your terminal inside `Rydecaptain`, run:
   ```bash
   npm run android
   ```
   *(or `npx expo run:android` / `npx react-native run-android`)*

This compiles the native Android app using Gradle and automatically installs it on your phone!

---

### Method 2: Build a Standalone APK (Install directly on any phone)
You can build the APK file directly on your computer:

```bash
npm run build:apk
```
Once the build completes, your APK file will be ready at:
```
Rydecaptain/android/app/build/outputs/apk/debug/app-debug.apk
```
Send `app-debug.apk` to your phone (via WhatsApp, USB, or Google Drive), tap it, and install!

---

### Method 3: Run with Expo Go (If you prefer wireless testing)
Now that 4.5 GB of disk space has been cleaned on your system drive:

```bash
npm start
```
Scan the QR code with the **Expo Go** app on your phone.

---

## 🎨 Visual Design Reference & Color Tokens

- **Primary Teal:** `#6FA5A5`
- **Light Aqua Background:** `#DDF0F0`
- **Dark Teal Text & Buttons:** `#075B64`
- **Accent Amber Buttons:** `#F5B83D`
- **Card Teal:** `#7EAFA8` / `#8CB8B8`
- **Native SVGs:** Concentric circular corner decorations on top-left and bottom-right matching the reference image.

---

## 📋 Implemented Screens & Workflows

### 6 Core Reference Screens (Figma Match)
1. **Screen 1: Splash / Welcome Screen** (`src/screens/Screen1Splash.tsx`)
   - RYDE logo, tagline *"your vehicle , our driver"*.
   - 3 badges: *Safe & Trusted Drivers*, *Live Tracking*, *On Time Every Time*.
   - Dotted curve path with directional arrow.
   - Amber **Get Started →** button and 3-dot pagination indicators.

2. **Screen 2: Driver Registration** (`src/screens/Screen2Registration.tsx`)
   - Header with back arrow and RYDE logo.
   - Full name input, Indian flag `🇮🇳 +91 |` mobile input with 10-digit validation.
   - Profile Image upload container with cloud icon and sample preview.
   - Amber **Continue →** button.

3. **Screen 3: OTP Verification** (`src/screens/Screen3OtpVerification.tsx`)
   - 6-digit OTP slot container matching the reference mockup.
   - Auto-focus, demo OTP auto-fill button (`444489`), and countdown **Resend** link.
   - Amber **Proceed** button.

4. **Screen 4: Driver Verification** (`src/screens/Screen4DriverVerification.tsx`)
   - Aadhar Verification with 12-digit formatting.
   - OTP Verification field with inline Resend trigger.
   - Driving License document selector with verified PDF badge.
   - Confirmation checkbox (*"I confirm these details are correct"*).
   - Amber **Proceed** button.

5. **Screen 5: Driver Home Dashboard** (`src/screens/Screen5HomeDashboard.tsx`)
   - Header with back arrow, RYDE logo, unread notification bell, and driver avatar.
   - *"Welcome Back Arun"* greeting.
   - Large Online/Offline status card with pulse indicator and toggle (**Go Online →** / **Go Offline ⏸**).
   - 2-column metrics: **20 Trips Today** and **₹1,240 Today Earning**.
   - **★ 4.5 Rating** card.
   - Recent Trip card (*Anna Nagar → T.Nagar, ₹340 Done*).
   - Fixed Bottom Navigation: **Home**, **Bookings** (with counter badge), and **Trips**.

6. **Screen 6: New Booking Screen** (`src/screens/Screen6NewBookings.tsx`)
   - 2-column cards matching the reference:
     - Customer (*👤 Venkat*) & Pick Up (*📍 T.Nagar*)
     - Vehicle (*🚗 Bike*) & Drop (*🏁 puzhal*)
   - Amber **ACCEPT** button and dark teal **REJECT** button.
   - Multiple booking requests queue.

### Complete 12-Stage Driver Journey (`src/workflow/WorkflowSteps.tsx`)
1. **Booking Accepted Confirmation**
2. **Customer Pickup Map & Direct Calling**
3. **Arrived At Pickup with Waiting Timer**
4. **Customer Ride OTP Verification**
5. **Vehicle Handover Checklist** (Fuel gauge, starting odometer, 3-angle photos, scratch check)
6. **Start Trip Confirmation**
7. **Active Trip Screen** (Live simulated road map, speedometer in km/h, upcoming turn banner)
8. **Destination Reached**
9. **Final Handover & Return Check** (Belongings check, end odometer)
10. **End Trip Invoice & Receipt**
11. **Driver Earnings & Wallet Credit** (15% platform commission calculation)
12. **Customer 5-Star Rating & Praise Tags**
