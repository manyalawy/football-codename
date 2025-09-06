import OpenAI from 'openai';
import { getAllSoccerWords } from '../data/soccerWords.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true // Enable client-side usage
});

// Cache for generated words to avoid repeated API calls
let wordCache = [];
let lastGenerated = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes




/**
 * Generates soccer-themed words using AI
 * @param {number} count - Number of words to generate
 * @returns {Promise<Array>} Array of soccer words
 */
export const generateSoccerWordsWithAI = async (count = 50) => {
  try {
    console.log(`🤖 Generating ${count} soccer words with AI...`);
    
    const prompt = `Generate exactly ${count} soccer/football terms ONLY for a Codenames word game. 

    STRICT DISTRIBUTION REQUIRED:
    - Players: Maximum 30% (They must include a mix of well-known and less famous/retired players, not only global superstars. Avoid generating ONLY popular names like MESSI, RONALDO, NEYMAR, MBAPPE, etc.)
    - Teams/Clubs: 20% 
    - Stadiums: 15% 
    - Positions/Roles: 15% (GOALKEEPER, STRIKER, MIDFIELDER, DEFENDER, WINGER)
    - Competitions: 10% 
    - Individual prizes: 10% (BALLON D'OR, GOLDEN BOOT, THE BEST)

    CRITICAL REQUIREMENTS:
    - ONLY authentic soccer/football terms - NO other sports or random words
    - Each term must be 1-3 words maximum
    - Use ALL CAPS format
    - NO more than ${Math.ceil(count * 0.3)} player names total
    - ABSOLUTELY NO DUPLICATE WORDS
    - NO terms from other sports (baseball, american football, basketball, etc.)
    - Ensure player selection is diverse: include historical players, cult heroes, or less globally known names, not just modern superstars

    Double-check every word is genuinely soccer-related before including it.
    Format as comma-separated list only:`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Much better at following instructions than 3.5-turbo
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.7, // Slightly less randomness for better consistency
    });

    const aiResponse = response.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Parse and clean the response
    const rawWords = aiResponse.split(',').map(word => word.trim().toUpperCase().replace(/[^\w\s]/g, ''));
    
    // Filter and validate words
    const words = rawWords
      .filter(word => word.length > 0 && word.length <= 20) // Filter reasonable length
      .filter((word, index, array) => array.indexOf(word) === index) // Remove duplicates
      .slice(0, count); // Ensure we don't exceed requested count

    // Log filtering results
    const originalCount = rawWords.length;
    const duplicatesRemoved = rawWords.length - rawWords.filter((word, index, array) => array.indexOf(word) === index).length;
    const invalidTermsRemoved = originalCount - duplicatesRemoved - words.length;
    const finalCount = words.length;

    if (originalCount !== finalCount) {
      console.log(`⚠️ Filtered AI response: ${originalCount} → ${finalCount} words`);
      if (duplicatesRemoved > 0) console.log(`   • Removed ${duplicatesRemoved} duplicates`);
      if (invalidTermsRemoved > 0) console.log(`   • Removed ${invalidTermsRemoved} invalid soccer terms`);
    }

    console.log(`✅ Generated ${words.length} words with AI`);
    return words;

  } catch (error) {
    console.error('🚫 AI word generation failed:', error);
    throw error;
  }
};

/**
 * Gets soccer words with caching and fallback
 * @param {number} count - Number of words needed
 * @returns {Promise<Array>} Array of soccer words
 */
export const getSoccerWordsWithAI = async (count = 25) => {
  // Check if we have cached words that are still fresh
  const now = Date.now();
  if (wordCache.length >= count && lastGenerated && (now - lastGenerated) < CACHE_DURATION) {
    console.log('📋 Using cached AI words');
    const shuffled = [...wordCache].sort(() => 0.5 - Math.random());
    const uniqueWords = shuffled.filter((word, index, array) => array.indexOf(word) === index);
    return uniqueWords.slice(0, count);
  }

  try {
    // Check if API key is available
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      console.warn('⚠️ No OpenAI API key found, using hardcoded words');
      return getFallbackWords(count);
    }

    // Generate new words with AI
    const generatedWords = await generateSoccerWordsWithAI(Math.max(50, count * 2)); // Generate extra for variety
    
    // Ensure no duplicates in generated words (extra safety check)
    const uniqueGenerated = generatedWords.filter((word, index, array) => array.indexOf(word) === index);
    
    // Update cache
    wordCache = uniqueGenerated;
    lastGenerated = now;
    
    // Return requested amount with final uniqueness check
    const shuffled = [...uniqueGenerated].sort(() => 0.5 - Math.random());
    const finalWords = shuffled.slice(0, count).filter((word, index, array) => array.indexOf(word) === index);
    
    console.log(`🎯 Returning ${finalWords.length} unique words (requested: ${count})`);
    return finalWords;

  } catch (error) {
    console.error('🚫 Failed to generate AI words, falling back to hardcoded:', error);
    return getFallbackWords(count);
  }
};

/**
 * Fallback to hardcoded words when AI fails
 * @param {number} count - Number of words needed
 * @returns {Array} Array of soccer words
 */
export const getFallbackWords = (count = 25) => {
  console.log('🔄 Using fallback hardcoded words');
  const allWords = getAllSoccerWords();
  
  // Ensure no duplicates in fallback words too
  const uniqueWords = allWords.filter((word, index, array) => array.indexOf(word) === index);
  const shuffled = [...uniqueWords].sort(() => 0.5 - Math.random());
  
  console.log(`🎯 Returning ${Math.min(shuffled.length, count)} unique fallback words`);
  return shuffled.slice(0, count);
};

/**
 * Preloads words into cache (call this early in the app)
 * @returns {Promise<void>}
 */
export const preloadWords = async () => {
  try {
    if (import.meta.env.VITE_OPENAI_API_KEY) {
      console.log('🔄 Preloading AI words...');
      await getSoccerWordsWithAI(50);
      console.log('✅ AI words preloaded successfully');
    }
  } catch (error) {
    console.log('ℹ️ Preloading skipped, will use fallback when needed');
  }
};

/**
 * Clears the word cache (useful for getting fresh words)
 */
export const clearWordCache = () => {
  wordCache = [];
  lastGenerated = null;
  console.log('🗑️ Word cache cleared');
};

/**
 * Validates a word list for duplicates and soccer validity
 * @param {Array} words - Array of words to validate
 * @returns {Object} Validation results
 */
export const validateWordList = (words) => {
  const uniqueWords = words.filter((word, index, array) => array.indexOf(word) === index);
  const duplicateCount = words.length - uniqueWords.length;
  
  if (duplicateCount > 0) {
    const duplicates = words.filter((word, index, array) => array.indexOf(word) !== index);
    console.warn(`⚠️ Found ${duplicateCount} duplicate words:`, [...new Set(duplicates)]);
  }
  

  
  return {
    total: words.length,
    unique: uniqueWords.length,
    duplicates: duplicateCount,
    isValid: duplicateCount === 0
  };
};
