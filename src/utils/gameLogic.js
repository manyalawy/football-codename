import { v4 as uuidv4 } from 'uuid';
import { getBalancedSoccerWords } from '../data/soccerWords.js';
import { getSoccerWordsWithAI } from '../services/aiWordGenerator.js';

// Card types for Codenames
export const CARD_TYPES = {
  RED_TEAM: 'red',
  BLUE_TEAM: 'blue',
  NEUTRAL: 'neutral',
  ASSASSIN: 'assassin'
};

// Team types
export const TEAMS = {
  RED: 'red',
  BLUE: 'blue'
};

// Game phases
export const GAME_PHASES = {
  WAITING: 'waiting',
  IN_PROGRESS: 'in_progress',
  FINISHED: 'finished'
};

// Player roles
export const ROLES = {
  SPYMASTER: 'spymaster',
  OPERATIVE: 'operative'
};

/**
 * Creates a new game with soccer-themed words
 * @param {string} gameId - Unique game identifier
 * @param {string} creatorId - ID of the player who created the game
 * @param {boolean} useAI - Whether to use AI to generate words
 * @returns {Promise<Object>} New game object
 */
export const createNewGame = async (gameId = null, creatorId = null, useAI = true) => {
  let words;
  
  try {
    if (useAI) {
      console.log('🤖 Generating game with AI words...');
      words = await getSoccerWordsWithAI(25);
    } else {
      console.log('📋 Generating game with hardcoded words...');
      words = getBalancedSoccerWords(25);
    }
  } catch (error) {
    console.error('Failed to generate words with AI, falling back to hardcoded:', error);
    words = getBalancedSoccerWords(25);
  }
  
  const startingTeam = Math.random() < 0.5 ? TEAMS.RED : TEAMS.BLUE;
  const cards = generateCards(words, startingTeam);
  
  // Validate card distribution for debugging
  const validation = validateCardDistribution(cards, startingTeam);
  console.log('🎲 Game created with starting team:', startingTeam);
  console.log('📊 Card distribution:', validation.counts);
  if (!validation.isValid) {
    console.error('❌ Invalid card distribution detected!', validation);
  }
  
  return {
    id: gameId || uuidv4(),
    createdAt: new Date().toISOString(),
    createdBy: creatorId,
    phase: GAME_PHASES.WAITING,
    currentTeam: startingTeam,
    startingTeam,
    cards,
    players: {},
    teams: {
      [TEAMS.RED]: {
        spymaster: null,
        operatives: [],
        cardsRevealed: 0,
        cardsTotal: startingTeam === TEAMS.RED ? 9 : 8
      },
      [TEAMS.BLUE]: {
        spymaster: null,
        operatives: [],
        cardsRevealed: 0,
        cardsTotal: startingTeam === TEAMS.BLUE ? 9 : 8
      }
    },
    winner: null,
    cluesGiven: [],
    gameHistory: [],
    settings: {
      maxPlayers: 8,
      allowSpectators: true,
      timeLimit: null, // in seconds, null for no limit
      wordsGeneratedBy: useAI ? 'ai' : 'hardcoded' // Track how words were generated
    }
  };
};

/**
 * Generates cards for the game board
 * @param {Array} words - Array of 25 words
 * @param {string} startingTeam - The team that starts first (gets 9 cards)
 * @returns {Array} Array of card objects
 */
export const generateCards = (words, startingTeam) => {
  if (words.length !== 25) {
    throw new Error('Exactly 25 words are required for the game');
  }

  const otherTeam = startingTeam === TEAMS.RED ? TEAMS.BLUE : TEAMS.RED;

  // Create card type distribution - starting team gets 9 cards, other team gets 8
  const cardTypes = [
    ...Array(9).fill(startingTeam),
    ...Array(8).fill(otherTeam),
    ...Array(7).fill(CARD_TYPES.NEUTRAL),
    CARD_TYPES.ASSASSIN
  ];

  // Shuffle the card types
  const shuffledTypes = cardTypes.sort(() => Math.random() - 0.5);

  // Create cards with words and types
  return words.map((word, index) => ({
    id: uuidv4(),
    word: word.toUpperCase(),
    type: shuffledTypes[index],
    revealed: false,
    revealedBy: null,
    revealedAt: null,
    position: index
  }));
};

/**
 * Adds a player to the game
 * @param {Object} game - Current game state
 * @param {string} playerId - Player ID
 * @param {string} playerName - Player name
 * @param {string} team - Team color (red/blue)
 * @param {string} role - Player role (spymaster/operative)
 * @returns {Object} Updated game state
 */
export const addPlayerToGame = (game, playerId, playerName, team = null, role = null) => {
  const updatedGame = { ...game };
  
  // Add player to players list
  updatedGame.players[playerId] = {
    id: playerId,
    name: playerName,
    team,
    role,
    joinedAt: new Date().toISOString(),
    isOnline: true
  };

  // If team and role are specified, assign them
  if (team && role) {
    assignPlayerToTeam(updatedGame, playerId, team, role);
  }

  return updatedGame;
};

/**
 * Assigns a player to a team and role
 * @param {Object} game - Current game state
 * @param {string} playerId - Player ID
 * @param {string} team - Team color
 * @param {string} role - Player role
 * @returns {Object} Updated game state
 */
export const assignPlayerToTeam = (game, playerId, team, role) => {
  const updatedGame = { ...game };
  const player = updatedGame.players[playerId];
  
  if (!player) {
    throw new Error('Player not found');
  }

  // Remove player from previous team/role if assigned
  if (player.team && player.role) {
    removePlayerFromTeam(updatedGame, playerId);
  }

  // Assign to new team and role
  player.team = team;
  player.role = role;

  if (role === ROLES.SPYMASTER) {
    updatedGame.teams[team].spymaster = playerId;
  } else if (role === ROLES.OPERATIVE) {
    if (!updatedGame.teams[team].operatives.includes(playerId)) {
      updatedGame.teams[team].operatives.push(playerId);
    }
  }

  return updatedGame;
};

/**
 * Removes a player from their current team
 * @param {Object} game - Current game state
 * @param {string} playerId - Player ID
 */
export const removePlayerFromTeam = (game, playerId) => {
  const player = game.players[playerId];
  if (!player || !player.team) return;

  const team = game.teams[player.team];
  
  if (player.role === ROLES.SPYMASTER && team.spymaster === playerId) {
    team.spymaster = null;
  } else if (player.role === ROLES.OPERATIVE) {
    const index = team.operatives.indexOf(playerId);
    if (index > -1) {
      team.operatives.splice(index, 1);
    }
  }

  player.team = null;
  player.role = null;
};

/**
 * Reveals a card on the board
 * @param {Object} game - Current game state
 * @param {string} cardId - Card ID to reveal
 * @param {string} playerId - ID of player revealing the card
 * @returns {Object} Updated game state and action result
 */
export const revealCard = (game, cardId, playerId) => {
  const updatedGame = { ...game };
  const card = updatedGame.cards.find(c => c.id === cardId);
  const player = updatedGame.players[playerId];

  if (!card || !player) {
    throw new Error('Card or player not found');
  }

  if (card.revealed) {
    throw new Error('Card already revealed');
  }

  if (updatedGame.phase !== GAME_PHASES.IN_PROGRESS) {
    throw new Error('Game is not in progress');
  }

  if (player.team !== updatedGame.currentTeam) {
    throw new Error('Not your team\'s turn');
  }

  if (player.role !== ROLES.OPERATIVE) {
    throw new Error('Only operatives can reveal cards');
  }

  // Reveal the card
  card.revealed = true;
  card.revealedBy = playerId;
  card.revealedAt = new Date().toISOString();

  // Add to game history
  updatedGame.gameHistory.push({
    type: 'card_revealed',
    cardId,
    playerId,
    team: player.team,
    cardType: card.type,
    timestamp: new Date().toISOString()
  });

  let continuesTurn = false;
  let gameEnded = false;

  // Handle card type effects
  switch (card.type) {
    case CARD_TYPES.RED_TEAM:
      updatedGame.teams[TEAMS.RED].cardsRevealed++;
      continuesTurn = player.team === TEAMS.RED;
      break;
    
    case CARD_TYPES.BLUE_TEAM:
      updatedGame.teams[TEAMS.BLUE].cardsRevealed++;
      continuesTurn = player.team === TEAMS.BLUE;
      break;
    
    case CARD_TYPES.NEUTRAL:
      continuesTurn = false;
      break;
    
    case CARD_TYPES.ASSASSIN:
      // Game ends immediately, other team wins
      updatedGame.phase = GAME_PHASES.FINISHED;
      updatedGame.winner = player.team === TEAMS.RED ? TEAMS.BLUE : TEAMS.RED;
      gameEnded = true;
      break;
  }

  // Check for team victory (all team cards revealed)
  if (!gameEnded) {
    const redTeam = updatedGame.teams[TEAMS.RED];
    const blueTeam = updatedGame.teams[TEAMS.BLUE];

    if (redTeam.cardsRevealed >= redTeam.cardsTotal) {
      updatedGame.phase = GAME_PHASES.FINISHED;
      updatedGame.winner = TEAMS.RED;
      gameEnded = true;
    } else if (blueTeam.cardsRevealed >= blueTeam.cardsTotal) {
      updatedGame.phase = GAME_PHASES.FINISHED;
      updatedGame.winner = TEAMS.BLUE;
      gameEnded = true;
    }
  }

  // Switch turns if necessary
  if (!continuesTurn && !gameEnded) {
    updatedGame.currentTeam = updatedGame.currentTeam === TEAMS.RED ? TEAMS.BLUE : TEAMS.RED;
  }

  return {
    game: updatedGame,
    result: {
      cardType: card.type,
      continuesTurn,
      gameEnded,
      winner: updatedGame.winner
    }
  };
};

/**
 * Gives a clue as spymaster
 * @param {Object} game - Current game state
 * @param {string} playerId - Spymaster player ID
 * @param {string} clue - The clue word
 * @param {number} count - Number of cards the clue refers to
 * @returns {Object} Updated game state
 */
export const giveClue = (game, playerId, clue, count) => {
  const updatedGame = { ...game };
  const player = updatedGame.players[playerId];

  if (!player) {
    throw new Error('Player not found');
  }

  if (updatedGame.phase !== GAME_PHASES.IN_PROGRESS) {
    throw new Error('Game is not in progress');
  }

  if (player.team !== updatedGame.currentTeam) {
    throw new Error('Not your team\'s turn');
  }

  if (player.role !== ROLES.SPYMASTER) {
    throw new Error('Only spymasters can give clues');
  }

  if (!clue || clue.trim().length === 0) {
    throw new Error('Clue cannot be empty');
  }

  if (count < 0 || count > 9) {
    throw new Error('Count must be between 0 and 9');
  }

  const clueData = {
    id: uuidv4(),
    clue: clue.trim().toUpperCase(),
    count,
    team: player.team,
    spymaster: playerId,
    timestamp: new Date().toISOString(),
    guessesRemaining: count + 1 // Players get one extra guess
  };

  updatedGame.cluesGiven.push(clueData);

  // Add to game history
  updatedGame.gameHistory.push({
    type: 'clue_given',
    playerId,
    team: player.team,
    clue: clueData.clue,
    count,
    timestamp: new Date().toISOString()
  });

  return updatedGame;
};

/**
 * Ends the current team's turn
 * @param {Object} game - Current game state
 * @param {string} playerId - Player ending the turn
 * @returns {Object} Updated game state
 */
export const endTurn = (game, playerId) => {
  const updatedGame = { ...game };
  const player = updatedGame.players[playerId];

  if (!player) {
    throw new Error('Player not found');
  }

  if (updatedGame.phase !== GAME_PHASES.IN_PROGRESS) {
    throw new Error('Game is not in progress');
  }

  if (player.team !== updatedGame.currentTeam) {
    throw new Error('Not your team\'s turn');
  }

  // Switch to the other team
  updatedGame.currentTeam = updatedGame.currentTeam === TEAMS.RED ? TEAMS.BLUE : TEAMS.RED;

  // Add to game history
  updatedGame.gameHistory.push({
    type: 'turn_ended',
    playerId,
    team: player.team,
    timestamp: new Date().toISOString()
  });

  return updatedGame;
};

/**
 * Starts the game if conditions are met
 * @param {Object} game - Current game state
 * @returns {Object} Updated game state
 */
export const startGame = (game) => {
  const updatedGame = { ...game };

  // Check if both teams have at least one spymaster and one operative
  const redTeam = updatedGame.teams[TEAMS.RED];
  const blueTeam = updatedGame.teams[TEAMS.BLUE];

  if (!redTeam.spymaster || redTeam.operatives.length === 0) {
    throw new Error('Red team needs a spymaster and at least one operative');
  }

  if (!blueTeam.spymaster || blueTeam.operatives.length === 0) {
    throw new Error('Blue team needs a spymaster and at least one operative');
  }

  updatedGame.phase = GAME_PHASES.IN_PROGRESS;
  updatedGame.startedAt = new Date().toISOString();

  // Add to game history
  updatedGame.gameHistory.push({
    type: 'game_started',
    timestamp: new Date().toISOString(),
    startingTeam: updatedGame.startingTeam
  });

  return updatedGame;
};

/**
 * Validates card distribution and counts for debugging
 * @param {Array} cards - Array of game cards
 * @param {string} startingTeam - Expected starting team
 * @returns {Object} Card count summary
 */
export const validateCardDistribution = (cards, startingTeam) => {
  const counts = {
    [TEAMS.RED]: 0,
    [TEAMS.BLUE]: 0,
    [CARD_TYPES.NEUTRAL]: 0,
    [CARD_TYPES.ASSASSIN]: 0
  };

  cards.forEach(card => {
    counts[card.type]++;
  });

  const expectedStartingCount = 9;
  const expectedOtherCount = 8;
  const otherTeam = startingTeam === TEAMS.RED ? TEAMS.BLUE : TEAMS.RED;

  return {
    counts,
    isValid: 
      counts[startingTeam] === expectedStartingCount &&
      counts[otherTeam] === expectedOtherCount &&
      counts[CARD_TYPES.NEUTRAL] === 7 &&
      counts[CARD_TYPES.ASSASSIN] === 1,
    startingTeam,
    otherTeam,
    expectedCounts: {
      [startingTeam]: expectedStartingCount,
      [otherTeam]: expectedOtherCount,
      [CARD_TYPES.NEUTRAL]: 7,
      [CARD_TYPES.ASSASSIN]: 1
    }
  };
};

/**
 * Gets the current game status for a player
 * @param {Object} game - Current game state
 * @param {string} playerId - Player ID
 * @returns {Object} Game status from player's perspective
 */
export const getGameStatus = (game, playerId) => {
  const player = game.players[playerId];
  const isSpymaster = player && player.role === ROLES.SPYMASTER;

  return {
    phase: game.phase,
    currentTeam: game.currentTeam,
    isYourTurn: player && player.team === game.currentTeam,
    canRevealCards: player && player.role === ROLES.OPERATIVE && player.team === game.currentTeam,
    canGiveClues: player && player.role === ROLES.SPYMASTER && player.team === game.currentTeam,
    isSpymaster,
    winner: game.winner,
    teams: {
      [TEAMS.RED]: {
        cardsRevealed: game.teams[TEAMS.RED].cardsRevealed,
        cardsTotal: game.teams[TEAMS.RED].cardsTotal,
        progress: (game.teams[TEAMS.RED].cardsRevealed / game.teams[TEAMS.RED].cardsTotal) * 100
      },
      [TEAMS.BLUE]: {
        cardsRevealed: game.teams[TEAMS.BLUE].cardsRevealed,
        cardsTotal: game.teams[TEAMS.BLUE].cardsTotal,
        progress: (game.teams[TEAMS.BLUE].cardsRevealed / game.teams[TEAMS.BLUE].cardsTotal) * 100
      }
    },
    lastClue: game.cluesGiven.length > 0 ? game.cluesGiven[game.cluesGiven.length - 1] : null
  };
};
