import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  updateDoc, 
  onSnapshot, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config.js';
import { createNewGame, addPlayerToGame, assignPlayerToTeam, revealCard, giveClue, endTurn, startGame, restartGame } from '../utils/gameLogic.js';

// Collection names
const COLLECTIONS = {
  GAMES: 'games',
  PLAYERS: 'players'
};

/**
 * Creates a new game in Firestore
 * @param {string} creatorId - ID of the player creating the game
 * @param {string} creatorName - Name of the creator
 * @returns {Promise<string>} Game ID
 */
export const createGame = async (creatorId, creatorName, useAI = true) => {
  try {
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`Creating game with ${useAI ? 'AI' : 'hardcoded'} words...`);
    
    // Create new game (now async due to AI word generation)
    const newGame = await createNewGame(gameId, creatorId, useAI);
    
    // Add creator as a player
    const gameWithCreator = addPlayerToGame(newGame, creatorId, creatorName);
    
    // Save to Firestore
    await setDoc(doc(db, COLLECTIONS.GAMES, gameId), {
      ...gameWithCreator,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log(`✅ Game created successfully: ${gameId} (${gameWithCreator.settings.wordsGeneratedBy} words)`);
    
    return gameId;
  } catch (error) {
    console.error('Error creating game:', error);
    throw new Error('Failed to create game');
  }
};

/**
 * Joins an existing game
 * @param {string} gameId - Game ID to join
 * @param {string} playerId - Player ID
 * @param {string} playerName - Player name
 * @returns {Promise<Object>} Updated game state
 */
export const joinGame = async (gameId, playerId, playerName) => {
  try {
    const gameRef = doc(db, COLLECTIONS.GAMES, gameId);
    const gameSnap = await getDoc(gameRef);
    
    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }
    
    const currentGame = gameSnap.data();
    
    // Check if game is full
    const playerCount = Object.keys(currentGame.players).length;
    if (playerCount >= currentGame.settings.maxPlayers) {
      throw new Error('Game is full');
    }
    
    // Check for player ID collision
    if (currentGame.players[playerId] && currentGame.players[playerId].name !== playerName) {
      console.warn(`Player ID collision detected: ${playerId}. Existing: ${currentGame.players[playerId].name}, New: ${playerName}`);
      throw new Error('Player ID collision - please refresh and try again');
    }
    
    // Add player to game (this will overwrite if same player rejoins with same ID)
    const updatedGame = addPlayerToGame(currentGame, playerId, playerName);
    
    console.log(`Player joining game: ${playerName} (${playerId}) -> Game: ${gameId}`);
    
    // Update in Firestore with atomic update to prevent race conditions
    await updateDoc(gameRef, {
      [`players.${playerId}`]: {
        id: playerId,
        name: playerName,
        team: null,
        role: null,
        joinedAt: new Date().toISOString(),
        isOnline: true
      },
      updatedAt: serverTimestamp()
    });
    
    console.log(`Player successfully joined: ${playerName} (${playerId})`);
    
    // Fetch the updated game state to return
    const updatedGameSnap = await getDoc(gameRef);
    const finalGame = updatedGameSnap.data();
    
    console.log(`Current players in game:`, Object.values(finalGame.players).map(p => `${p.name} (${p.id})`));
    
    return finalGame;
  } catch (error) {
    console.error('Error joining game:', error);
    throw error;
  }
};

/**
 * Assigns a player to a team and role
 * @param {string} gameId - Game ID
 * @param {string} playerId - Player ID
 * @param {string} team - Team color
 * @param {string} role - Player role
 * @returns {Promise<void>}
 */
export const assignPlayer = async (gameId, playerId, team, role) => {
  try {
    const gameRef = doc(db, COLLECTIONS.GAMES, gameId);
    const gameSnap = await getDoc(gameRef);
    
    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }
    
    const currentGame = gameSnap.data();
    const updatedGame = assignPlayerToTeam(currentGame, playerId, team, role);
    
    await updateDoc(gameRef, {
      players: updatedGame.players,
      teams: updatedGame.teams,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error assigning player:', error);
    throw error;
  }
};

/**
 * Starts a game
 * @param {string} gameId - Game ID
 * @returns {Promise<void>}
 */
export const startGameSession = async (gameId) => {
  try {
    const gameRef = doc(db, COLLECTIONS.GAMES, gameId);
    const gameSnap = await getDoc(gameRef);
    
    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }
    
    const currentGame = gameSnap.data();
    const updatedGame = startGame(currentGame);
    
    await updateDoc(gameRef, {
      phase: updatedGame.phase,
      startedAt: serverTimestamp(),
      gameHistory: updatedGame.gameHistory,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error starting game:', error);
    throw error;
  }
};

/**
 * Reveals a card
 * @param {string} gameId - Game ID
 * @param {string} cardId - Card ID
 * @param {string} playerId - Player ID
 * @returns {Promise<Object>} Action result
 */
export const revealCardInGame = async (gameId, cardId, playerId) => {
  try {
    const gameRef = doc(db, COLLECTIONS.GAMES, gameId);
    const gameSnap = await getDoc(gameRef);
    
    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }
    
    const currentGame = gameSnap.data();
    const { game: updatedGame, result } = revealCard(currentGame, cardId, playerId);
    
    await updateDoc(gameRef, {
      cards: updatedGame.cards,
      teams: updatedGame.teams,
      currentTeam: updatedGame.currentTeam,
      phase: updatedGame.phase,
      winner: updatedGame.winner,
      gameHistory: updatedGame.gameHistory,
      updatedAt: serverTimestamp()
    });
    
    return result;
  } catch (error) {
    console.error('Error revealing card:', error);
    throw error;
  }
};

/**
 * Gives a clue as spymaster
 * @param {string} gameId - Game ID
 * @param {string} playerId - Spymaster ID
 * @param {string} clue - Clue word
 * @param {number} count - Number count
 * @returns {Promise<void>}
 */
export const giveClueInGame = async (gameId, playerId, clue, count) => {
  try {
    const gameRef = doc(db, COLLECTIONS.GAMES, gameId);
    const gameSnap = await getDoc(gameRef);
    
    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }
    
    const currentGame = gameSnap.data();
    const updatedGame = giveClue(currentGame, playerId, clue, count);
    
    await updateDoc(gameRef, {
      cluesGiven: updatedGame.cluesGiven,
      gameHistory: updatedGame.gameHistory,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error giving clue:', error);
    throw error;
  }
};

/**
 * Ends the current turn
 * @param {string} gameId - Game ID
 * @param {string} playerId - Player ID
 * @returns {Promise<void>}
 */
export const endTurnInGame = async (gameId, playerId) => {
  try {
    const gameRef = doc(db, COLLECTIONS.GAMES, gameId);
    const gameSnap = await getDoc(gameRef);
    
    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }
    
    const currentGame = gameSnap.data();
    const updatedGame = endTurn(currentGame, playerId);
    
    await updateDoc(gameRef, {
      currentTeam: updatedGame.currentTeam,
      gameHistory: updatedGame.gameHistory,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error ending turn:', error);
    throw error;
  }
};

/**
 * Subscribes to game updates
 * @param {string} gameId - Game ID
 * @param {Function} callback - Callback function for updates
 * @returns {Function} Unsubscribe function
 */
export const subscribeToGame = (gameId, callback) => {
  const gameRef = doc(db, COLLECTIONS.GAMES, gameId);
  
  return onSnapshot(gameRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error subscribing to game:', error);
    callback(null, error);
  });
};

/**
 * Gets a list of active games
 * @param {number} limitCount - Number of games to fetch
 * @returns {Promise<Array>} List of games
 */
export const getActiveGames = async (limitCount = 10) => {
  try {
    const gamesQuery = query(
      collection(db, COLLECTIONS.GAMES),
      where('phase', 'in', ['waiting', 'in_progress']),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(gamesQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching active games:', error);
    return [];
  }
};

/**
 * Deletes a game (only creator can do this)
 * @param {string} gameId - Game ID
 * @param {string} playerId - Player ID (must be creator)
 * @returns {Promise<void>}
 */
export const deleteGame = async (gameId, playerId) => {
  try {
    const gameRef = doc(db, COLLECTIONS.GAMES, gameId);
    const gameSnap = await getDoc(gameRef);
    
    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }
    
    const game = gameSnap.data();
    if (game.createdBy !== playerId) {
      throw new Error('Only the creator can delete the game');
    }
    
    await deleteDoc(gameRef);
  } catch (error) {
    console.error('Error deleting game:', error);
    throw error;
  }
};

/**
 * Removes a player from the game completely
 * @param {string} gameId - Game ID
 * @param {string} playerId - Player ID
 * @returns {Promise<void>}
 */
export const leaveGame = async (gameId, playerId) => {
  try {
    const gameRef = doc(db, COLLECTIONS.GAMES, gameId);
    const gameSnap = await getDoc(gameRef);
    
    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }
    
    const currentGame = gameSnap.data();
    const player = currentGame.players[playerId];
    
    if (!player) {
      return; // Player not in game
    }
    
    // Remove player from team assignments
    if (player.team && player.role) {
      const teamData = currentGame.teams[player.team];
      
      if (player.role === 'spymaster' && teamData.spymaster === playerId) {
        currentGame.teams[player.team].spymaster = null;
      } else if (player.role === 'operative') {
        const operativeIndex = teamData.operatives.indexOf(playerId);
        if (operativeIndex > -1) {
          currentGame.teams[player.team].operatives.splice(operativeIndex, 1);
        }
      }
    }
    
    // Remove player from players list
    delete currentGame.players[playerId];
    
    // Update the game in Firestore
    await updateDoc(gameRef, {
      players: currentGame.players,
      teams: currentGame.teams,
      updatedAt: serverTimestamp()
    });
    
    console.log(`Player ${playerId} left game ${gameId}`);
  } catch (error) {
    console.error('Error leaving game:', error);
    throw error;
  }
};

/**
 * Clears all players from a game (useful for testing/development)
 * @param {string} gameId - Game ID
 * @param {string} requesterId - ID of player requesting the reset (must be creator)
 * @returns {Promise<void>}
 */
export const resetGamePlayers = async (gameId, requesterId) => {
  try {
    const gameRef = doc(db, COLLECTIONS.GAMES, gameId);
    const gameSnap = await getDoc(gameRef);
    
    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }
    
    const game = gameSnap.data();
    
    // Only allow creator to reset the game
    if (game.createdBy !== requesterId) {
      throw new Error('Only the game creator can reset players');
    }
    
    // Reset players and teams
    const resetGame = {
      players: {},
      teams: {
        red: {
          spymaster: null,
          operatives: [],
          cardsRevealed: 0,
          cardsTotal: game.teams.red.cardsTotal
        },
        blue: {
          spymaster: null,
          operatives: [],
          cardsRevealed: 0,
          cardsTotal: game.teams.blue.cardsTotal
        }
      },
      phase: 'waiting'
    };
    
    await updateDoc(gameRef, {
      ...resetGame,
      updatedAt: serverTimestamp()
    });
    
    console.log(`Game ${gameId} players reset by ${requesterId}`);
  } catch (error) {
    console.error('Error resetting game players:', error);
    throw error;
  }
};

/**
 * Updates player online status
 * @param {string} gameId - Game ID
 * @param {string} playerId - Player ID
 * @param {boolean} isOnline - Online status
 * @returns {Promise<void>}
 */
export const updatePlayerStatus = async (gameId, playerId, isOnline) => {
  try {
    const gameRef = doc(db, COLLECTIONS.GAMES, gameId);
    const gameSnap = await getDoc(gameRef);
    
    if (!gameSnap.exists()) {
      return;
    }
    
    const game = gameSnap.data();
    if (game.players[playerId]) {
      await updateDoc(gameRef, {
        [`players.${playerId}.isOnline`]: isOnline,
        [`players.${playerId}.lastSeen`]: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating player status:', error);
  }
};

/**
 * Restarts a finished game with new words and resets teams
 * @param {string} gameId - Game ID
 * @param {string} playerId - ID of player requesting restart (usually game creator)
 * @param {boolean} useAI - Whether to use AI to generate new words
 * @returns {Promise<void>}
 */
export const restartGameSession = async (gameId, playerId, useAI = true) => {
  try {
    const gameRef = doc(db, COLLECTIONS.GAMES, gameId);
    const gameSnap = await getDoc(gameRef);
    
    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }
    
    const currentGame = gameSnap.data();
    
    // Verify game is finished and player has permission to restart
    if (currentGame.phase !== 'finished') {
      throw new Error('Can only restart finished games');
    }
    
    // Only game creator can restart (or we can allow anyone)
    if (currentGame.createdBy && currentGame.createdBy !== playerId) {
      console.warn('Non-creator attempted to restart game, allowing anyway...');
      // We'll allow anyone to restart for better UX
    }
    
    console.log(`🔄 Restarting game ${gameId}...`);
    
    // Generate new game state
    const restartedGame = await restartGame(currentGame, useAI);
    
    // Update the game in Firestore
    await updateDoc(gameRef, {
      ...restartedGame,
      updatedAt: serverTimestamp()
    });
    
    console.log(`✅ Game ${gameId} restarted successfully`);
    
  } catch (error) {
    console.error('Error restarting game:', error);
    throw error;
  }
};
