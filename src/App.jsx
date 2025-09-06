import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import GameLobby from './components/GameLobby';
import GameBoard from './components/GameBoard';
import { subscribeToGame, leaveGame } from './firebase/gameService';
import { GAME_PHASES } from './utils/gameLogic';
import { preloadWords } from './services/aiWordGenerator';
import './App.css';
import './components.css';

function App() {
  const [currentGameId, setCurrentGameId] = useState(() => {
    // Try to restore game ID from localStorage
    return localStorage.getItem('codenames_gameId') || null;
  });
  const [gameState, setGameState] = useState(null);
  const [playerId] = useState(() => {
    // Try to restore player ID from localStorage, or create new one
    const stored = localStorage.getItem('codenames_playerId');
    if (stored) return stored;
    
    // Generate a more robust unique ID with higher entropy
    const timestamp = Date.now();
    const randomPart1 = Math.random().toString(36).substr(2, 9);
    const randomPart2 = Math.random().toString(36).substr(2, 9);
    const performanceNow = performance.now().toString().replace('.', '');
    const newId = `player_${timestamp}_${randomPart1}_${randomPart2}_${performanceNow}`;
    
    localStorage.setItem('codenames_playerId', newId);
    return newId;
  });
  const [playerName, setPlayerName] = useState(() => {
    // Try to restore player name from localStorage
    return localStorage.getItem('codenames_playerName') || '';
  });
  const [isRejoining, setIsRejoining] = useState(false);

  // Utility function to clear all localStorage data
  const clearStoredData = () => {
    localStorage.removeItem('codenames_gameId');
    localStorage.removeItem('codenames_playerId');
    localStorage.removeItem('codenames_playerName');
    console.log('Cleared all stored game data');
  };

  // Preload AI words on app start for better performance
  useEffect(() => {
    preloadWords();
  }, []);

  // Check if player should rejoin game on app load
  useEffect(() => {
    const checkStoredGame = async () => {
      const storedGameId = localStorage.getItem('codenames_gameId');
      const storedPlayerId = localStorage.getItem('codenames_playerId');
      const storedPlayerName = localStorage.getItem('codenames_playerName');
      
      if (storedGameId && storedPlayerId && storedPlayerName && !currentGameId) {
        setIsRejoining(true);
        console.log('Attempting to rejoin game:', storedGameId);
        
        // Set a timeout to prevent infinite loading
        const timeout = setTimeout(() => {
          setIsRejoining(false);
          toast.error('Failed to rejoin game - connection timeout');
          localStorage.removeItem('codenames_gameId');
          localStorage.removeItem('codenames_playerName');
        }, 10000); // 10 second timeout
        
        // Store timeout ID to clear it if we successfully reconnect
        window.rejoiningTimeout = timeout;
        
        try {
          // We'll let the subscription effect handle the actual reconnection
          setCurrentGameId(storedGameId);
          setPlayerName(storedPlayerName);
        } catch (error) {
          console.error('Failed to rejoin game:', error);
          clearTimeout(timeout);
          // Clear invalid stored data
          localStorage.removeItem('codenames_gameId');
          localStorage.removeItem('codenames_playerName');
          setIsRejoining(false);
        }
      }
    };
    
    checkStoredGame();
  }, []); // Only run once on mount

  // Subscribe to game updates
  useEffect(() => {
    if (!currentGameId) {
      setIsRejoining(false);
      return;
    }

    const unsubscribe = subscribeToGame(currentGameId, (game, error) => {
      if (error) {
        console.error('Game subscription error:', error);
        // Clear stored data if game can't be accessed
        localStorage.removeItem('codenames_gameId');
        localStorage.removeItem('codenames_playerName');
        setCurrentGameId(null);
        setGameState(null);
        setIsRejoining(false);
        toast.error('Could not rejoin game. It may have been deleted.');
        return;
      }
      
      if (game) {
        // Check if player is still in the game
        if (game.players[playerId]) {
          setGameState(game);
          // Clear timeout and rejoining state on successful connection
          if (window.rejoiningTimeout) {
            clearTimeout(window.rejoiningTimeout);
            window.rejoiningTimeout = null;
          }
          setIsRejoining(false);
        } else {
          // Player was removed from the game
          console.log('Player no longer in game, returning to lobby');
          localStorage.removeItem('codenames_gameId');
          localStorage.removeItem('codenames_playerName');
          setCurrentGameId(null);
          setGameState(null);
          setIsRejoining(false);
          toast('You were removed from the game');
        }
      } else {
        // Game was deleted
        localStorage.removeItem('codenames_gameId');
        localStorage.removeItem('codenames_playerName');
        setCurrentGameId(null);
        setGameState(null);
        setIsRejoining(false);
        toast('Game no longer exists');
      }
    });

    return unsubscribe;
  }, [currentGameId, playerId]);

  const handleJoinGame = (gameId, name) => {
    // Update state
    setCurrentGameId(gameId);
    setPlayerName(name);
    
    // Store in localStorage for persistence across reloads
    localStorage.setItem('codenames_gameId', gameId);
    localStorage.setItem('codenames_playerName', name);
  };

  const handleLeaveGame = async () => {
    if (currentGameId) {
      try {
        // Remove player from Firebase game
        await leaveGame(currentGameId, playerId);
        toast.success('Left game successfully');
      } catch (error) {
        console.error('Error leaving game:', error);
        toast.error('Error leaving game, but continuing anyway');
      }
    }
    
    // Clear localStorage
    localStorage.removeItem('codenames_gameId');
    localStorage.removeItem('codenames_playerName');
    
    // Reset local state
    setCurrentGameId(null);
    setGameState(null);
    setPlayerName('');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          ⚽ Soccer Codenames
        </h1>
        <p className="app-subtitle">
          The classic word game with a football twist
        </p>
      </header>

      <main className="app-main">
        {isRejoining ? (
          <div className="rejoining-state">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <h2>Rejoining Game...</h2>
              <p>Connecting you back to your game</p>
              <button 
                onClick={() => {
                  // Cancel rejoining process
                  if (window.rejoiningTimeout) {
                    clearTimeout(window.rejoiningTimeout);
                    window.rejoiningTimeout = null;
                  }
                  localStorage.removeItem('codenames_gameId');
                  localStorage.removeItem('codenames_playerName');
                  setCurrentGameId(null);
                  setGameState(null);
                  setIsRejoining(false);
                  toast('Cancelled rejoining game');
                }}
                className="cancel-rejoin-button"
              >
                Cancel & Go to Lobby
              </button>
            </div>
          </div>
        ) : !currentGameId ? (
          <GameLobby 
            playerId={playerId}
            onJoinGame={handleJoinGame}
          />
        ) : (
          <GameBoard
            gameState={gameState}
            playerId={playerId}
            playerName={playerName}
            onLeaveGame={handleLeaveGame}
          />
        )}
      </main>

      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid #333',
          },
        }}
      />
    </div>
  );
}

export default App;
