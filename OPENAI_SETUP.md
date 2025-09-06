# 🤖 OpenAI Integration Setup

Your Soccer Codenames app now supports AI-generated words! Here's how to set it up:

## 🔑 Get OpenAI API Key

1. **Go to OpenAI**: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. **Create account** or sign in
3. **Create new API key** 
4. **Copy the key** (starts with `sk-proj-...`)

## ⚙️ Configure Your App

### Option 1: Environment Variable (Recommended)

1. **Create `.env.local`** file in your project root:
```bash
# In /Users/youssef/Desktop/codename/.env.local
VITE_OPENAI_API_KEY=sk-proj-your-actual-api-key-here
```

2. **Restart your dev server**:
```bash
npm run dev
```

### Option 2: Direct Configuration

Edit `src/services/aiWordGenerator.js` and replace:
```javascript
apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
```
with:
```javascript
apiKey: 'sk-proj-your-actual-api-key-here',
```

## 🎮 How It Works

- **AI Toggle**: In the game lobby, you'll see a toggle switch
- **AI Generated**: Fresh soccer words for every game
- **Fallback**: If AI fails, uses hardcoded words
- **Cost**: About $0.01-0.02 per game (very cheap!)

## 🔥 Features

✅ **Dynamic Words**: Every game has unique soccer terms  
✅ **Smart Fallback**: Never fails, always playable  
✅ **Cost Efficient**: Uses GPT-3.5-turbo (cheapest model)  
✅ **Caching**: Avoids repeated API calls  
✅ **User Choice**: Toggle between AI and standard words

## 💡 Without API Key

The game works perfectly without an API key:
- Uses the curated list of 400+ soccer terms
- Still fully functional and fun
- No AI toggle (automatically disabled)

## 🚨 Keep Your API Key Secret

- ❌ Never commit API keys to git
- ✅ Use `.env.local` (automatically ignored)
- ✅ Keep keys secure and private

Enjoy your AI-powered Soccer Codenames! ⚽🤖
