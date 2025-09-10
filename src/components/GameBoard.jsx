import { useState, useEffect } from 'react';
import { LogOut, Users, Eye, EyeOff, Play, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import GameCard from './GameCard';
import TeamPanel from './TeamPanel';
import CluePanel from './CluePanel';
import PlayerAssignment from './PlayerAssignment';
import { 
  assignPlayer, 
  startGameSession, 
  revealCardInGame, 
  giveClueInGame, 
  endTurnInGame,
  resetGamePlayers,
  restartGameSession
} from '../firebase/gameService';
import { GAME_PHASES, TEAMS, ROLES, getGameStatus } from '../utils/gameLogic';

const GameBoard = ({ gameState, playerId, playerName, onLeaveGame }) => {
  const [showSpymasterView, setShowSpymasterView] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  const currentPlayer = gameState?.players[playerId];
  const gameStatus = gameState ? getGameStatus(gameState, playerId) : null;

  // Auto-show spymaster view for spymasters
  useEffect(() => {
    if (currentPlayer?.role === ROLES.SPYMASTER) {
      setShowSpymasterView(true);
    }
  }, [currentPlayer?.role]);

  const handleAssignPlayer = async (team, role) => {
    if (!gameState || isAssigning) return;

    setIsAssigning(true);
    try {
      await assignPlayer(gameState.id, playerId, team, role);
      toast.success(`Assigned to ${team} team as ${role}`);
    } catch (error) {
      toast.error(error.message || 'Failed to assign player');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleStartGame = async () => {
    if (!gameState) return;

    try {
      await startGameSession(gameState.id);
      toast.success('Game started!');
    } catch (error) {
      toast.error(error.message || 'Failed to start game');
    }
  };

  const handleRevealCard = async (cardId) => {
    if (!gameState || !gameStatus?.canRevealCards) return;

    try {
      const result = await revealCardInGame(gameState.id, cardId, playerId);
      
      if (result.gameEnded) {
        if (result.winner === currentPlayer.team) {
          toast.success('🎉 Your team won!');
        } else {
          toast.error('💀 Your team lost!');
        }
      } else if (result.cardType === 'assassin') {
        toast.error('💀 Assassin revealed! Game over!');
      } else if (result.continuesTurn) {
        toast.success('Good guess! Continue your turn.');
      } else {
        toast('Turn ended. Other team\'s turn now.');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to reveal card');
    }
  };

  const handleRestartGame = async () => {
    if (!gameState || isRestarting) return;

    setIsRestarting(true);
    try {
      // Check if we should use AI words (same as current game setting)
      const useAI = gameState.settings?.wordsGeneratedBy === 'ai';
      
      await restartGameSession(gameState.id, playerId, useAI);
      toast.success('🔄 Game restarted! Please select your teams again.');
    } catch (error) {
      toast.error(error.message || 'Failed to restart game');
      console.error('Restart game error:', error);
    } finally {
      setIsRestarting(false);
    }
  };

  const handleGiveClue = async (clue, count) => {
    if (!gameState || !gameStatus?.canGiveClues) return;

    try {
      await giveClueInGame(gameState.id, playerId, clue, count);
      toast.success(`Clue given: ${clue} (${count})`);
    } catch (error) {
      toast.error(error.message || 'Failed to give clue');
    }
  };

  const handleEndTurn = async () => {
    if (!gameState || !gameStatus?.isYourTurn) return;

    try {
      await endTurnInGame(gameState.id, playerId);
      toast('Turn ended');
    } catch (error) {
      toast.error(error.message || 'Failed to end turn');
    }
  };

  const handleResetPlayers = async () => {
    if (!gameState) return;

    try {
      await resetGamePlayers(gameState.id, playerId);
      toast.success('All players cleared from game');
    } catch (error) {
      toast.error(error.message || 'Failed to reset players');
    }
  };

  const toggleSpymasterView = () => {
    if (currentPlayer?.role === ROLES.SPYMASTER) {
      setShowSpymasterView(!showSpymasterView);
    }
  };

  if (!gameState) {
    return (
      <div className="game-board loading">
        <div className="loading-spinner">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="game-board">
      <header className="game-header">
        <div className="game-info">
          <h2>Game: {gameState.id}</h2>
          <div className="game-status">
            <span className={`status-badge ${gameState.phase}`}>
              {gameState.phase === GAME_PHASES.WAITING && 'Waiting for Players'}
              {gameState.phase === GAME_PHASES.IN_PROGRESS && 'In Progress'}
              {gameState.phase === GAME_PHASES.FINISHED && `Game Over - ${gameState.winner?.toUpperCase()} WINS!`}
            </span>
            {gameState.phase === GAME_PHASES.IN_PROGRESS && (
              <span className={`turn-indicator ${gameState.currentTeam}`}>
                {gameState.currentTeam.toUpperCase()} TEAM'S TURN
              </span>
            )}
          </div>
        </div>

        <div className="game-controls">
          {currentPlayer?.role === ROLES.SPYMASTER && (
            <button
              onClick={toggleSpymasterView}
              className={`view-toggle ${showSpymasterView ? 'active' : ''}`}
              title={showSpymasterView ? 'Hide card types' : 'Show card types'}
            >
              {showSpymasterView ? <EyeOff size={20} /> : <Eye size={20} />}
              Spymaster View
            </button>
          )}
          
          {/* Development only: Reset button for game creator */}
          {import.meta.env.DEV && gameState?.createdBy === playerId && gameState?.phase === GAME_PHASES.WAITING && (
            <button
              onClick={handleResetPlayers}
              className="reset-button"
              title="Clear all players (dev only)"
            >
              🔄 Reset Players
            </button>
          )}
          
          <button onClick={onLeaveGame} className="leave-button">
            <LogOut size={20} />
            Leave Game
          </button>
        </div>
      </header>

      <div className="game-content">
        <div className="game-sidebar">
          <TeamPanel
            gameState={gameState}
            currentPlayer={currentPlayer}
            gameStatus={gameStatus}
          />
          
          {gameState.phase === GAME_PHASES.IN_PROGRESS && (
            <CluePanel
              gameState={gameState}
              currentPlayer={currentPlayer}
              gameStatus={gameStatus}
              onGiveClue={handleGiveClue}
              onEndTurn={handleEndTurn}
            />
          )}
        </div>

        <div className="game-main">
          {gameState.phase === GAME_PHASES.WAITING && !currentPlayer?.team && (
            <PlayerAssignment
              gameState={gameState}
              currentPlayer={currentPlayer}
              onAssignPlayer={handleAssignPlayer}
              isAssigning={isAssigning}
            />
          )}

          {gameState.phase === GAME_PHASES.WAITING && currentPlayer?.team && (
            <div className="waiting-area">
              <div className="waiting-message">
                <Users size={48} />
                <h3>Waiting for all players to join teams...</h3>
                <p>Make sure both teams have a spymaster and at least one operative.</p>
                
                {gameState.createdBy === playerId && (
                  <button
                    onClick={handleStartGame}
                    className="start-game-button"
                    disabled={
                      !gameState.teams.red.spymaster || 
                      !gameState.teams.blue.spymaster ||
                      gameState.teams.red.operatives.length === 0 ||
                      gameState.teams.blue.operatives.length === 0
                    }
                  >
                    <Play size={20} />
                    Start Game
                  </button>
                )}
              </div>
            </div>
          )}

          {(gameState.phase === GAME_PHASES.IN_PROGRESS || gameState.phase === GAME_PHASES.FINISHED) && (
            <div className="cards-grid">
              {gameState.cards.map((card) => (
                <GameCard
                  key={card.id}
                  card={card}
                  showType={showSpymasterView || card.revealed}
                  canReveal={gameStatus?.canRevealCards && !card.revealed}
                  onReveal={() => handleRevealCard(card.id)}
                />
              ))}
            </div>
          )}

          {gameState.phase === GAME_PHASES.FINISHED && (
            <div className="game-over-overlay">
              <div className="game-over-content">
                <Crown size={64} />
                <h2>{gameState.winner?.toUpperCase()} TEAM WINS!</h2>
                <p>Congratulations to all the winners! 🎉</p>
                
                <div className="game-over-actions">
                  <button
                    onClick={handleRestartGame}
                    className="restart-game-button"
                    disabled={isRestarting}
                  >
                    {isRestarting ? 'Starting New Game...' : '🔄 Start New Game'}
                  </button>
                  <p className="restart-info">
                    This will generate new words and reset all teams. Everyone can choose new roles!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
