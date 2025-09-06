# Firebase Environment Setup

This project now uses environment variables for Firebase configuration to keep sensitive data secure.

## Setup Instructions

### 1. Create Environment File
The `.env.local` file should already be created for you with the Firebase configuration.

If you need to recreate it, create a `.env.local` file in your project root with:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# OpenAI Configuration (add your API key here)
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Important Notes

- ✅ **Required Variables**: All Firebase variables except `MEASUREMENT_ID` are required
- ✅ **VITE_ Prefix**: All variables must start with `VITE_` to work with Vite
- ✅ **Git Ignored**: `.env.local` is automatically ignored by Git for security
- ✅ **Validation**: The app will show an error if required variables are missing

### 3. Getting Firebase Config Values

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" section
5. Copy the config values from your web app

### 4. Restart Development Server

After creating or updating `.env.local`, restart your development server:

```bash
npm run dev
```

## Security Benefits

- 🔐 **No Hardcoded Secrets**: Configuration is not committed to git
- 🛡️ **Environment Isolation**: Different configs for dev/staging/production
- ✅ **Validation**: App validates all required variables are present
- 🚫 **Accident Prevention**: `.env.local` is automatically gitignored
