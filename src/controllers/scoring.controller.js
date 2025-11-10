const formulaEvaluator = require('../services/formulaEvaluator');
const scoringCalculator = require('../services/scoringCalculator');
const variableExtractor = require('../services/variableExtractor');
const supabase = require('../config/supabase');

// Validate formula
exports.validateFormula = async (req, res) => {
  try {
    const { formula, test_variables } = req.body;

    if (!formula) {
      return res.status(400).json({
        success: false,
        error: 'Formula is required'
      });
    }

    const validation = formulaEvaluator.validateFormula(formula);

    if (!validation.valid) {
      return res.json({
        success: true,
        valid: false,
        error: validation.error
      });
    }

    let testResult = null;
    if (test_variables) {
      const testResponse = formulaEvaluator.testFormula(formula, test_variables);
      if (!testResponse.success) {
        return res.json({
          success: true,
          valid: false,
          error: testResponse.error
        });
      }
      testResult = testResponse.result;
    }

    const variables = formulaEvaluator.getFormulaVariables(formula);

    res.json({
      success: true,
      valid: true,
      variables: variables,
      test_result: testResult
    });

  } catch (error) {
    console.error('Error validating formula:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Preview scores
exports.previewScores = async (req, res) => {
  try {
    const { game_type, formulas, weights, test_variables } = req.body;

    if (!game_type || !formulas || !weights || !test_variables) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const scores = {};
    let totalWeighted = 0;

    for (const [name, formula] of Object.entries(formulas)) {
      const testResponse = formulaEvaluator.testFormula(formula, test_variables);
      
      if (!testResponse.success) {
        return res.json({
          success: false,
          error: `Formula error in ${name}: ${testResponse.error}`
        });
      }

      const rawScore = Math.max(0, Math.min(100, testResponse.result));
      const weight = weights[name] || 0;
      const weighted = rawScore * weight;

      scores[name] = {
        raw: rawScore,
        weight: weight,
        weighted: weighted
      };

      totalWeighted += weighted;
    }

    res.json({
      success: true,
      data: {
        scores: {
          final_score: Math.round(totalWeighted * 100) / 100,
          competencies: scores
        },
        test_variables: test_variables
      }
    });

  } catch (error) {
    console.error('Error previewing scores:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Compare versions
exports.compareVersions = async (req, res) => {
  try {
    const { game_type, version_ids, test_data } = req.body;

    if (!game_type || !version_ids || !Array.isArray(version_ids) || version_ids.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Need at least 2 version IDs to compare'
      });
    }

    const { data: versions, error: fetchError } = await supabase
      .from('scoring_versions')
      .select('*')
      .eq('game_type', game_type)
      .in('id', version_ids);

    if (fetchError) throw fetchError;

    if (!versions || versions.length < 2) {
      return res.status(404).json({
        success: false,
        error: 'Could not find all specified versions'
      });
    }

    const comparisons = [];

    for (const version of versions) {
      const scores = {};
      let totalWeighted = 0;

      for (const [name, formula] of Object.entries(version.config.competency_formulas || {})) {
        const result = formulaEvaluator.evaluate(formula, test_data);
        const rawScore = Math.max(0, Math.min(100, result));
        const weight = version.config.final_weights[name] || 0;
        const weighted = rawScore * weight;

        scores[name] = {
          raw: rawScore,
          weight: weight,
          weighted: weighted,
          formula: formula
        };

        totalWeighted += weighted;
      }

      comparisons.push({
        version_name: version.version_name,
        version_id: version.id,
        description: version.description,
        final_score: Math.round(totalWeighted * 100) / 100,
        competencies: scores,
        formulas: version.config.competency_formulas,
        weights: version.config.final_weights
      });
    }

    res.json({
      success: true,
      data: {
        comparisons: comparisons,
        test_data: test_data
      }
    });

  } catch (error) {
    console.error('Error comparing versions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get available variables
exports.getAvailableVariables = async (req, res) => {
  try {
    const { gameType } = req.params;
    const variables = variableExtractor.getAvailableVariables(gameType);

    res.json({
      success: true,
      data: variables
    });

  } catch (error) {
    console.error('Error getting variables:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};