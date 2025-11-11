/**
 * Extract variables from raw game data for formula evaluation
 */
class VariableExtractor {
  /**
   * Extract variables for any game type
   * @param {string} gameType - Game type identifier
   * @param {*} rawData - Raw game data (array or object)
   * @param {object} config - Scoring configuration
   * @returns {object} - Variables for formula evaluation
   */
  extractVariables(gameType, rawData, config) {
    const variables = {};

    // Extract common variables for action-based games (array format)
    if (Array.isArray(rawData)) {
      this.extractArrayBasedVariables(variables, rawData, config);
    }

    // Extract game-specific variables
    switch (gameType) {
      case 'mental_math_sprint':
        this.extractMentalMathVariables(variables, rawData, config);
        break;

      case 'stroop_test':
        this.extractStroopVariables(variables, rawData, config);
        break;

      case 'sign_sudoku':
        this.extractSudokuVariables(variables, rawData, config);
        break;

      case 'face_name_match':
        this.extractFaceNameVariables(variables, rawData, config);
        break;

      case 'card_flip_challenge':
        this.extractCardFlipVariables(variables, rawData, config);
        break;
    }

    return variables;
  }

  /**
   * Extract common variables from array-based game data
   */
  extractArrayBasedVariables(variables, rawData, config) {
    if (!Array.isArray(rawData) || rawData.length === 0) return;

    // Basic counts
    variables.total = rawData.length;
    variables.correct = rawData.filter(item => item.is_correct).length;
    variables.incorrect = variables.total - variables.correct;
    variables.accuracy_percent = variables.total > 0
      ? (variables.correct / variables.total) * 100
      : 0;

    // Time statistics
    const times = rawData.map(item => item.time_taken || 0);
    variables.total_time = times.reduce((sum, t) => sum + t, 0);
    variables.avg_time = variables.total > 0
      ? variables.total_time / variables.total
      : 0;
    variables.min_time = times.length > 0 ? Math.min(...times) : 0;
    variables.max_time = times.length > 0 ? Math.max(...times) : 0;

    // Standard deviation for consistency
    if (times.length > 0) {
      const mean = variables.avg_time;
      const variance = times.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / times.length;
      variables.time_std_dev = Math.sqrt(variance);
    } else {
      variables.time_std_dev = 0;
    }

    // Configuration-based variables
    variables.time_limit = config.settings?.time_limit || 5;
    variables.time_left = Math.max(0, variables.time_limit - variables.avg_time);
  }

  /**
   * Extract Mental Math Sprint specific variables
   */
  extractMentalMathVariables(variables, rawData, config) {
    // All common variables are sufficient
    // Add any mental math specific calculations here if needed
  }

  /**
   * Extract Stroop Test specific variables
   */
  extractStroopVariables(variables, rawData, config) {
    if (!Array.isArray(rawData)) return;

    variables.interference_items = rawData.filter(item => item.is_interference).length;
    variables.interference_correct = rawData.filter(
      item => item.is_interference && item.is_correct
    ).length;
    variables.interference_errors = variables.interference_items - variables.interference_correct;
    variables.interference_accuracy = variables.interference_items > 0
      ? (variables.interference_correct / variables.interference_items) * 100
      : 0;
  }

  /**
   * Extract Sign Sudoku specific variables
   */
  extractSudokuVariables(variables, rawData, config) {
    // For sudoku, rawData is an object
    Object.assign(variables, {
      correct_entries: rawData.correct_entries || 0,
      incorrect_entries: rawData.incorrect_entries || 0,
      total_empty_cells: rawData.total_empty_cells || 0,
      time_left_sec: rawData.time_left_sec || 0,
      total_time_allowed: rawData.total_time_allowed || 60,
      total_attempts: rawData.total_attempts || 0,
      avg_time_per_correct_entry: rawData.avg_time_per_correct_entry || 0,
      difficulty_multiplier: rawData.difficulty_multiplier || 1.0,
      correct_first_attempts: rawData.correct_first_attempts || 0
    });

    // Calculate derived variables
    const safeTotal = Math.max(0, variables.total_empty_cells);
    if (safeTotal > 0) {
      const completion = (variables.correct_entries / safeTotal) * 100;
      const accuracy = ((variables.correct_entries - variables.incorrect_entries) / safeTotal) * 100;
      // Clamp to [0,100] to avoid negative or >100 values
      variables.completion_percent = Math.max(0, Math.min(100, completion));
      variables.accuracy_percent = Math.max(0, Math.min(100, accuracy));
    } else {
      variables.completion_percent = 0;
      variables.accuracy_percent = 0;
    }

    // If total_attempts not provided, infer from entries
    if (!variables.total_attempts) {
      const inferred = variables.correct_entries + variables.incorrect_entries;
      variables.total_attempts = inferred;
    }
  }

  /**
   * Extract Face-Name Match specific variables
   */
  extractFaceNameVariables(variables, rawData, config) {
    if (!Array.isArray(rawData)) return;

    variables.learning_phase_items = rawData.filter(item => item.phase === 'learning').length;
    variables.recall_phase_items = rawData.filter(item => item.phase === 'recall').length;
    variables.new_face_items = rawData.filter(item => item.is_new_face).length;
    variables.new_face_correct = rawData.filter(item => item.is_new_face && item.is_correct).length;
    variables.learned_face_items = rawData.filter(item => !item.is_new_face).length;
    variables.learned_face_correct = rawData.filter(item => !item.is_new_face && item.is_correct).length;
  }

  /**
   * Extract Card Flip Challenge specific variables
   */
  extractCardFlipVariables(variables, rawData, config) {
    Object.assign(variables, {
      correct_pairs: rawData.correct_pairs || 0,
      total_pairs: rawData.total_pairs || 0,
      total_flips: rawData.total_flips || 0,
      minimum_flips: rawData.minimum_flips || 0,
      time_taken: rawData.time_taken || 0,
      time_limit: rawData.time_limit || 60,
      efficiency: 0
    });

    // Calculate efficiency
    if (variables.minimum_flips > 0) {
      variables.efficiency = (variables.minimum_flips / variables.total_flips) * 100;
    }
  }

  /**
   * Get available variables for a specific game type
   * Returns variable names and descriptions
   */
  getAvailableVariables(gameType) {
    const commonVariables = {
      total: 'Total number of questions',
      correct: 'Number of correct answers',
      incorrect: 'Number of incorrect answers',
      accuracy_percent: 'Accuracy percentage (0-100)',
      total_time: 'Total time taken for all questions',
      avg_time: 'Average time per question',
      min_time: 'Fastest question time',
      max_time: 'Slowest question time',
      time_std_dev: 'Standard deviation of response times',
      time_limit: 'Time limit per question',
      time_left: 'Average time remaining per question'
    };

    const gameSpecificVariables = {
      stroop_test: {
        interference_items: 'Number of interference items',
        interference_correct: 'Correct interference answers',
        interference_errors: 'Incorrect interference answers',
        interference_accuracy: 'Interference accuracy percentage'
      },
      sign_sudoku: {
        correct_entries: 'Number of correct entries',
        incorrect_entries: 'Number of incorrect entries',
        total_empty_cells: 'Total empty cells to fill',
        time_left_sec: 'Time remaining in seconds',
        total_time_allowed: 'Total time allowed',
        total_attempts: 'Total number of attempts',
        avg_time_per_correct_entry: 'Average time per correct entry',
        difficulty_multiplier: 'Difficulty multiplier (1.0, 1.5, 2.0)',
        correct_first_attempts: 'Correct on first try',
        completion_percent: 'Completion percentage',
        accuracy_percent: 'Accuracy percentage'
      },
      face_name_match: {
        learning_phase_items: 'Items in learning phase',
        recall_phase_items: 'Items in recall phase',
        new_face_items: 'Number of new faces',
        new_face_correct: 'Correct new face identifications',
        learned_face_items: 'Number of learned faces',
        learned_face_correct: 'Correct learned face identifications'
      },
      card_flip_challenge: {
        correct_pairs: 'Number of correct pairs matched',
        total_pairs: 'Total pairs in game',
        total_flips: 'Total number of flips',
        minimum_flips: 'Minimum flips needed',
        time_taken: 'Total time taken',
        time_limit: 'Time limit',
        efficiency: 'Efficiency percentage'
      }
    };

    return {
      common: commonVariables,
      specific: gameSpecificVariables[gameType] || {}
    };
  }
}

module.exports = new VariableExtractor();