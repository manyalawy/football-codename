# ⚽ Soccer Codenames

A soccer-themed version of the classic Codenames word game built with React, Vite, and Firebase. Experience the beloved party game with football terminology including famous players, stadiums, leagues, nations, and more!

## 🎮 Game Features

- **Soccer-themed Words**: Over 400+ soccer-related terms including:
  - Famous players (Messi, Ronaldo, Mbappe, etc.)
  - Iconic stadiums (Wembley, Camp Nou, Old Trafford, etc.)
  - Major leagues and competitions (Premier League, Champions League, World Cup, etc.)
  - National teams from around the world
  - Trophies and awards
  - Soccer positions and terminology

- **Real-time Multiplayer**: Built with Firebase for instant game updates
- **Team Management**: Automatic team assignment with spymaster and operative roles
- **Modern UI**: Beautiful, responsive design with soccer-inspired theming
- **Game Logic**: Complete Codenames ruleset with win conditions and scoring

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase account (for multiplayer functionality)

### Installation

1. **Clone or download the project**:
   ```bash
   # The project is already set up in your current directory
   cd /Users/youssef/Desktop/codename
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Firebase** (see Firebase Setup section below)

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to `http://localhost:5173`

## 🔥 Firebase Setup

To enable multiplayer functionality, you'll need to set up Firebase:

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Enable Google Analytics (optional)

### 2. Enable Firestore Database

1. In the Firebase console, go to "Firestore Database"
2. Click "Create database"
3. Start in test mode (for development)
4. Choose your preferred region

### 3. Get Firebase Configuration

1. In your Firebase project, click the gear icon → "Project settings"
2. Scroll down to "Your apps" and click the web icon (`</>`)
3. Register your app with a name (e.g., "Soccer Codenames")
4. Copy the Firebase configuration object

### 4. Update Firebase Config

Replace the placeholder config in `src/firebase/config.js`:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 5. Set Security Rules (Optional)

For production, update Firestore security rules in the Firebase console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /games/{gameId} {
      allow read, write: if true; // Adjust as needed for your security requirements
    }
  }
}
```

## 📖 How to Play

### Game Setup

1. **Create a Game**: Enter your name and click "Create New Game"
2. **Share Game Code**: Give the generated game code to your friends
3. **Join Teams**: Each team needs:
   - 1 Spymaster (gives clues)
   - 1-3 Operatives (guess words)
4. **Start Game**: Once teams are ready, the creator can start the game

### Gameplay

1. **Spymaster Turn**: 
   - Give a one-word clue and a number
   - The number indicates how many words relate to your clue
   - You can see all card types (red, blue, neutral, assassin)

2. **Operative Turn**:
   - Discuss the clue with your team
   - Click cards to reveal them
   - Find your team's words while avoiding the assassin
   - You get one extra guess beyond the clue number

3. **Win Conditions**:
   - First team to find all their words wins
   - Hit the assassin = instant loss for that team

### Soccer Theme

All words are soccer-related, making it perfect for football fans:
- **Players**: Current stars and legends
- **Stadiums**: Famous venues worldwide  
- **Competitions**: Major leagues and tournaments
- **Nations**: International teams
- **Terms**: Soccer positions and actions

## 🛠️ Development

### Project Structure

```
src/
├── components/          # React components
│   ├── GameBoard.jsx   # Main game interface
│   ├── GameLobby.jsx   # Home screen and game creation
│   ├── GameCard.jsx    # Individual word cards
│   ├── TeamPanel.jsx   # Team management sidebar
│   ├── CluePanel.jsx   # Clue input and history
│   └── PlayerAssignment.jsx  # Team selection
├── data/
│   └── soccerWords.js  # Soccer terminology database
├── firebase/
│   ├── config.js       # Firebase configuration
│   └── gameService.js  # Database operations
├── utils/
│   └── gameLogic.js    # Core game mechanics
├── App.jsx             # Main app component
├── App.css             # Main styles
└── components.css      # Component-specific styles
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding New Words

To add more soccer terms, edit `src/data/soccerWords.js`:

```javascript
export const soccerWords = {
  players: ['NEW_PLAYER', ...],
  stadiums: ['NEW_STADIUM', ...],
  // ... other categories
};
```

## 🎨 Customization

### Styling

The app uses a modern soccer-themed design with:
- Green gradient backgrounds (soccer field inspired)
- Team colors (red/blue) for game elements
- Responsive design for mobile and desktop

Main style files:
- `src/App.css` - Global styles and layout
- `src/components.css` - Component-specific styles

### Game Rules

Modify game logic in `src/utils/gameLogic.js`:
- Grid size (currently 5x5)
- Team card distribution
- Win conditions
- Turn mechanics

## 📱 Mobile Support

The app is fully responsive and works great on:
- Desktop computers
- Tablets
- Mobile phones
- Any modern web browser

## 🔧 Troubleshooting

### Common Issues

1. **Firebase not working**: Check your config and ensure Firestore is enabled
2. **Cards not loading**: Verify the soccer words database is properly imported
3. **Styling issues**: Make sure both CSS files are imported in App.jsx
4. **Build errors**: Run `npm install` to ensure all dependencies are installed

### Development Mode

For local development without Firebase:
1. Comment out Firebase imports in components
2. Use local state management instead of Firebase
3. Enable Firebase emulators (optional)

## 📜 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Add new soccer words
- Improve the UI/UX
- Fix bugs
- Add new features

## 🎯 Future Enhancements

Potential improvements:
- Player authentication
- Game statistics and history
- Custom word sets
- Tournament mode
- Voice chat integration
- Mobile app versions

---

**Enjoy your soccer-themed Codenames experience! ⚽🎮**