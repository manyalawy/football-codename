import { useState } from 'react';
import { Send, SkipForward, MessageCircle, Clock } from 'lucide-react';
import { ROLES } from '../utils/gameLogic';

const CluePanel = ({ gameState, currentPlayer, gameStatus, onGiveClue, onEndTurn }) => {
  const [clueWord, setClueWord] = useState('');
  const [clueCount, setClueCount] = useState(1);

  const lastClue = gameStatus?.lastClue;
  const canGiveClue = gameStatus?.canGiveClues;
  const canEndTurn = gameStatus?.isYourTurn && currentPlayer?.role === ROLES.OPERATIVE;

  const handleSubmitClue = (e) => {
    e.preventDefault();
    
    if (!clueWord.trim() || clueCount < 0 || clueCount > 9) {
      return;
    }

    onGiveClue(clueWord.trim(), clueCount);
    setClueWord('');
    setClueCount(1);
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const clueTime = new Date(timestamp);
    const diffMs = now - clueTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  };

  return (
    <div className="clue-panel">
      <h2 className="panel-title">
        <MessageCircle size={20} />
        Clues & Actions
      </h2>

      {/* Current Clue Display */}
      {lastClue && (
        <div className="current-clue">
          <h3>Current Clue</h3>
          <div className={`clue-display ${lastClue.team}`}>
            <div className="clue-content">
              <span className="clue-word">{lastClue.clue}</span>
              <span className="clue-count">({lastClue.count})</span>
            </div>
            <div className="clue-meta">
              <span className={`team-indicator ${lastClue.team}`}>
                {lastClue.team.toUpperCase()} TEAM
              </span>
              <span className="clue-time">
                <Clock size={12} />
                {formatTimeAgo(lastClue.timestamp)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Spymaster Clue Input */}
      {canGiveClue && (
        <div className="clue-input-section">
          <h3>Give a Clue</h3>
          <form onSubmit={handleSubmitClue} className="clue-form">
            <div className="input-group">
              <label htmlFor="clueWord">Clue Word</label>
              <input
                id="clueWord"
                type="text"
                value={clueWord}
                onChange={(e) => setClueWord(e.target.value)}
                placeholder="Enter one word clue"
                maxLength={20}
                className="clue-word-input"
                required
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="clueCount">Number</label>
              <select
                id="clueCount"
                value={clueCount}
                onChange={(e) => setClueCount(parseInt(e.target.value))}
                className="clue-count-select"
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <option key={num} value={num}>
                    {num} {num === 0 ? '(unlimited)' : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              type="submit"
              disabled={!clueWord.trim()}
              className="submit-clue-button"
            >
              <Send size={16} />
              Give Clue
            </button>
          </form>
          
          <div className="clue-rules">
            <h4>Clue Rules:</h4>
            <ul>
              <li>Give exactly one word as your clue</li>
              <li>The number indicates how many words relate to your clue</li>
              <li>Your team gets one extra guess beyond the number</li>
              <li>Don't use words that appear on the board</li>
              <li>Avoid proper nouns of people on the board</li>
            </ul>
          </div>
        </div>
      )}

      {/* Operative Actions */}
      {canEndTurn && (
        <div className="operative-actions">
          <h3>Your Turn</h3>
          <p>Click on cards to reveal them, or end your turn when done.</p>
          
          <button
            onClick={onEndTurn}
            className="end-turn-button"
          >
            <SkipForward size={16} />
            End Turn
          </button>
          
          <div className="turn-info">
            <p><strong>Remember:</strong></p>
            <ul>
              <li>You can make multiple guesses</li>
              <li>Stop if you reveal a wrong card</li>
              <li>Avoid the assassin at all costs!</li>
            </ul>
          </div>
        </div>
      )}

      {/* Clue History */}
      {gameState.cluesGiven.length > 0 && (
        <div className="clue-history">
          <h3>Clue History</h3>
          <div className="history-list">
            {gameState.cluesGiven
              .slice()
              .reverse()
              .slice(0, 5)
              .map((clue, index) => (
                <div key={clue.id} className={`history-item ${clue.team}`}>
                  <div className="history-clue">
                    <span className="history-word">{clue.clue}</span>
                    <span className="history-count">({clue.count})</span>
                  </div>
                  <div className="history-team">
                    {clue.team.toUpperCase()}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Waiting State */}
      {!canGiveClue && !canEndTurn && gameStatus?.isYourTurn === false && (
        <div className="waiting-state">
          <h3>Waiting...</h3>
          <p>It's the other team's turn. Watch and learn from their moves!</p>
        </div>
      )}
    </div>
  );
};

export default CluePanel;
