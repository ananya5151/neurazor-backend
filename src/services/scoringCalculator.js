const formulaEvaluator = require('./formulaEvaluator');
const variableExtractor = require('./variableExtractor');

class ScoringCalculator {
  /**
   * Calculate scores using dynamic formulas
   * @param {string} gameType - Game type identifier
   * @param {object} config - Scoring configuration with formulas and weights
   * @param {*} rawData - Raw game data
   * @returns {object} - Calculated scores
   */
  calculateScores(gameType, config, rawData) {
    console.log(`\n=== Calculating Scores for ${gameType} ===`);
    
    // Step 1: Extract variables from raw data
    const variables = variableExtractor.extractVariables(gameType, rawData, config);
    console.log('Extracted Variables:', variables);

    // Step 2: Calculate each competency using formulas
    const competencyScores = {};
    
    for (const [competencyName, formula] of Object.entries(config.competency_formulas || {})) {
      try {
        console.log(`\nCalculating ${competencyName}:`);
        console.log(`Formula: ${formula}`);
        
        // Evaluate formula
        const rawScore = formulaEvaluator.evaluate(formula, variables);
        
        // Clamp between 0-100
        const clampedScore = Math.max(0, Math.min(100, rawScore));
        
        console.log(`Result: ${rawScore} → Clamped: ${clampedScore}`);
        
        competencyScores[competencyName] = {
          raw: clampedScore,
          formula: formula,
          variables_used: formulaEvaluator.getFormulaVariables(formula)
        };
        
      } catch (error) {
        console.error(`Error calculating ${competencyName}:`, error);
        competencyScores[competencyName] = {
          raw: 0,
          formula: formula,
          error: error.message
        };
      }
    }

    // Step 3: Apply weights and calculate final score
    const finalScores = this.applyWeights(competencyScores, config.final_weights || {});
    
    // Step 4: Add raw statistics
    finalScores.raw_stats = this.extractRawStats(rawData);
    
    console.log('\n=== Final Scores ===');
    console.log(JSON.stringify(finalScores, null, 2));
    
    return finalScores;
  }

  /**
   * Apply weights to competency scores
   */
  applyWeights(competencyScores, weights) {
    const result = {
      final_score: 0,
      competencies: {}
    };

    let totalWeighted = 0;

    for (const [name, data] of Object.entries(competencyScores)) {
      const weight = weights[name] || 0;
      const weighted = data.raw * weight;

      result.competencies[name] = {
        raw: data.raw,
        weight: weight,
        weighted: weighted
      };

      totalWeighted += weighted;
    }

    result.final_score = Math.round(totalWeighted * 100) / 100; // Round to 2 decimals

    return result;
  }

  /**
   * Extract raw statistics from game data
   */
  extractRawStats(rawData) {
    const stats = {};

    if (Array.isArray(rawData)) {
      stats.total_attempts = rawData.length;
      stats.correct_answers = rawData.filter(item => item.is_correct).length;
      const times = rawData.map(item => item.time_taken || 0);
      stats.total_time = times.reduce((sum, t) => sum + t, 0);
      stats.avg_time_per_response = stats.total_attempts > 0
        ? stats.total_time / stats.total_attempts
        : 0;
    } else if (typeof rawData === 'object') {
      // For object-based games like sudoku
      stats.correct_entries = rawData.correct_entries || 0;
      stats.incorrect_entries = rawData.incorrect_entries || 0;
      stats.time_taken = rawData.time_taken || 0;
    }

    return stats;
  }
}

module.exports = new ScoringCalculator();