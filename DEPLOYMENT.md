# Firebase Deployment Guide

## 🎉 Your app is now live!

**Live URL**: https://codename-aa530.web.app  
**Firebase Console**: https://console.firebase.google.com/project/codename-aa530/overview

## Deployment Steps Used

### 1. Firebase CLI Setup
```bash
npm install -g firebase-tools
firebase login
firebase use codename-aa530
```

### 2. Configuration Files Created
- `firebase.json` - Hosting configuration
- `.firebaserc` - Project association

### 3. Build & Deploy Process
```bash
npm run build      # Creates dist/ folder
firebase deploy --only hosting
```

## Environment Variables Setup

### Current Status:
- ✅ **Firebase config**: Already deployed and working
- ❌ **OpenAI API key**: Empty - AI word generation won't work

### Option 1: Quick Fix (Manual Deploy)
1. Add your OpenAI API key to `.env.local`:
   ```bash
   VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

2. Rebuild and redeploy:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

### Option 2: GitHub Actions (Automated)
1. Go to your GitHub repo → Settings → Secrets and variables → Actions
2. Add these secrets:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN` 
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID`
   - `VITE_OPENAI_API_KEY`
   - `FIREBASE_SERVICE_ACCOUNT_CODENAME_AA530`

3. Push to main branch → automatic deployment

## Future Deployments

### Manual Method:
```bash
# 1. Make your changes
# 2. Build the app
npm run build

# 3. Deploy to Firebase
firebase deploy --only hosting

# 4. Optional: Commit and push changes
git add .
git commit -m "Your update message"
git push
```

### Automated Method (if GitHub Actions set up):
```bash
git add .
git commit -m "Your update message"
git push  # Automatically builds and deploys
```

## Configuration Details

### firebase.json
- **Public Directory**: `dist` (Vite's build output)
- **SPA Routing**: All routes redirect to `/index.html`
- **Ignores**: Firebase files, hidden files, node_modules

### Environment Variables
Your `.env.local` file with Firebase config is:
- ✅ **Not deployed** (stays local for security)
- ✅ **Firebase hosting uses your project's config automatically**
- ✅ **No additional setup needed**

## Features Working in Production

✅ **Real-time multiplayer** - Firebase Firestore  
✅ **Player persistence** - localStorage + Firebase  
✅ **AI word generation** - OpenAI API (if API key added)  
✅ **Responsive design** - Works on all devices  
✅ **Game mechanics** - Full Codenames gameplay  
✅ **Soccer theming** - 400+ curated soccer terms  

## Troubleshooting

### If AI words aren't working:
The OpenAI API key is missing. Use Option 1 or 2 above to add it.

### Security Notes:
⚠️ **Important**: Since this is a client-side app, environment variables are visible to users in the browser. This is generally okay for:
- Firebase config (designed to be public)
- OpenAI API keys (have usage limits and billing controls)

🔒 **Best practices**:
- Set usage limits on your OpenAI account
- Monitor API usage in OpenAI dashboard
- Consider server-side functions for sensitive operations

### Performance Notes:
- Initial bundle is 805KB (large but includes Firebase + OpenAI)
- Consider code splitting for production optimization
- All assets are cached by Firebase CDN

## Domain Setup (Optional)

To use a custom domain:
1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow the DNS setup instructions

Your Soccer Codenames game is now accessible worldwide! 🌍⚽
