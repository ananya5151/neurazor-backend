const { Parser } = require('expr-eval');

class FormulaEvaluator {
  constructor() {
    this.parser = new Parser();
  }

  /**
   * Evaluate a formula string with given variables
   * @param {string} formula - Formula string like "(correct / total) * 100"
   * @param {object} variables - Variables to substitute like { correct: 9, total: 10 }
   * @returns {number} - Calculated result
   */
  evaluate(formula, variables) {
    try {
      // Handle null or undefined formulas
      if (!formula || typeof formula !== 'string') {
        console.warn('Invalid formula provided:', formula);
        return 0;
      }

      // Parse the formula
      const expr = this.parser.parse(formula);
      
      // Evaluate with variables
      const result = expr.evaluate(variables);
      
      // Ensure result is a number
      if (isNaN(result) || !isFinite(result)) {
        console.warn(`Formula "${formula}" produced invalid result: ${result}`);
        return 0;
      }
      
      return result;
    } catch (error) {
      console.error(`Error evaluating formula "${formula}":`, error.message);
      console.error('Variables:', variables);
      return 0;
    }
  }

  /**
   * Validate if a formula is syntactically correct
   * @param {string} formula - Formula string to validate
   * @returns {object} - { valid: boolean, error: string }
   */
  validateFormula(formula) {
    try {
      if (!formula || typeof formula !== 'string') {
        return { valid: false, error: 'Formula must be a non-empty string' };
      }

      // Try to parse the formula
      this.parser.parse(formula);
      
      return { valid: true, error: null };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Get all variables used in a formula
   * @param {string} formula - Formula string
   * @returns {array} - Array of variable names
   */
  getFormulaVariables(formula) {
    try {
      const expr = this.parser.parse(formula);
      return expr.variables();
    } catch (error) {
      return [];
    }
  }

  /**
   * Test a formula with sample data
   * @param {string} formula - Formula to test
   * @param {object} testVariables - Test data
   * @returns {object} - { success: boolean, result: number, error: string }
   */
  testFormula(formula, testVariables) {
    try {
      const validation = this.validateFormula(formula);
      if (!validation.valid) {
        return { success: false, result: null, error: validation.error };
      }

      const result = this.evaluate(formula, testVariables);
      return { success: true, result, error: null };
    } catch (error) {
      return { success: false, result: null, error: error.message };
    }
  }
}

module.exports = new FormulaEvaluator();