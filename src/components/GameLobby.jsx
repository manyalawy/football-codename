import { useState } from 'react';
import { Plus, Users, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { createGame, joinGame } from '../firebase/gameService';

const GameLobby = ({ playerId, onJoinGame }) => {
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [hasApiKey] = useState(() => {
    return !!import.meta.env.VITE_OPENAI_API_KEY;
  });

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsCreating(true);
    
    // Show appropriate loading message
    const loadingMessage = useAI && hasApiKey 
      ? '🤖 Creating game with AI-generated words...' 
      : 'Creating game...';
    
    const loadingToast = toast.loading(loadingMessage);
    
    try {
      console.log(`Creating game with ${useAI && hasApiKey ? 'AI' : 'hardcoded'} words...`);
      const gameId = await createGame(playerId, playerName.trim(), useAI && hasApiKey);
      toast.dismiss(loadingToast);
      
      const successMessage = useAI && hasApiKey 
        ? '🎉 Game created with fresh AI words!' 
        : '🎉 Game created successfully!';
        
      toast.success(successMessage);
      onJoinGame(gameId, playerName.trim());
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Failed to create game');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGame = async () => {
    if (!playerName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (!gameCode.trim()) {
      toast.error('Please enter a game code');
      return;
    }

    setIsJoining(true);
    try {
      await joinGame(gameCode.trim(), playerId, playerName.trim());
      toast.success('Joined game successfully!');
      onJoinGame(gameCode.trim(), playerName.trim());
    } catch (error) {
      if (error.message.includes('Player ID collision')) {
        toast.error('Connection issue detected. Please refresh the page and try again.');
        // Clear localStorage to force new player ID generation on refresh
        localStorage.removeItem('codenames_playerId');
      } else {
        toast.error(error.message || 'Failed to join game');
      }
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="game-lobby">
      <div className="lobby-container">
        <div className="welcome-section">
          <div className="soccer-icon">⚽</div>
          <h2>Welcome to Soccer Codenames!</h2>
          <p>
            Experience the classic Codenames game with soccer-themed words including 
            famous players, stadiums, leagues, and more!
          </p>
        </div>

        <div className="player-setup">
          <div className="input-group">
            <label htmlFor="playerName">Your Name</label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              className="name-input"
            />
          </div>
          
          {/* AI Word Generation Toggle */}
          <div className="ai-toggle-section">
            <div className="toggle-container">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  disabled={!hasApiKey}
                  className="toggle-input"
                />
                <span className="toggle-slider"></span>
                <span className="toggle-text">
                  {useAI ? '🤖 AI Generated Words' : '📋 Standard Words'}
                </span>
              </label>
              
              {!hasApiKey && (
                <div className="api-key-warning">
                  <small>⚠️ OpenAI API key required for AI words</small>
                </div>
              )}
              
              {hasApiKey && (
                <div className="ai-description">
                  <small>
                    {useAI 
                      ? 'AI will generate fresh soccer words for each game' 
                      : 'Use curated list of soccer terms'
                    }
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="game-actions">
          <div className="action-card">
            <div className="action-icon">
              <Plus size={32} />
            </div>
            <h3>Create New Game</h3>
            <p>Start a new game and invite your friends to join</p>
            <button
              onClick={handleCreateGame}
              disabled={isCreating || !playerName.trim()}
              className="action-button create-button"
            >
              {isCreating ? 'Creating...' : 'Create Game'}
            </button>
          </div>

          <div className="divider">
            <span>OR</span>
          </div>

          <div className="action-card">
            <div className="action-icon">
              <Users size={32} />
            </div>
            <h3>Join Existing Game</h3>
            <p>Enter a game code to join an existing game</p>
            <div className="join-inputs">
              <input
                type="text"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value)}
                placeholder="Enter game code"
                className="game-code-input"
              />
              <button
                onClick={handleJoinGame}
                disabled={isJoining || !playerName.trim() || !gameCode.trim()}
                className="action-button join-button"
              >
                {isJoining ? 'Joining...' : 'Join Game'}
              </button>
            </div>
          </div>
        </div>

        <div className="game-rules">
          <h3>How to Play</h3>
          <div className="rules-grid">
            <div className="rule-item">
              <div className="rule-number">1</div>
              <div className="rule-text">
                <strong>Teams:</strong> Split into two teams (Red & Blue), each with a Spymaster and Operatives
              </div>
            </div>
            <div className="rule-item">
              <div className="rule-number">2</div>
              <div className="rule-text">
                <strong>Clues:</strong> Spymasters give one-word clues and a number to help their team find words
              </div>
            </div>
            <div className="rule-item">
              <div className="rule-number">3</div>
              <div className="rule-text">
                <strong>Goal:</strong> Be the first team to find all your words, but avoid the assassin!
              </div>
            </div>
            <div className="rule-item">
              <div className="rule-number">4</div>
              <div className="rule-text">
                <strong>Soccer Theme:</strong> All words are soccer-related: players, stadiums, leagues, and more!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;
