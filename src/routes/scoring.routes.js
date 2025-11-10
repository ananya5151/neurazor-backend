const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const formulaEvaluator = require('../services/formulaEvaluator');
const scoringCalculator = require('../services/scoringCalculator');
const variableExtractor = require('../services/variableExtractor');

/**
 * POST /api/scoring/validate-formula
 * Validate a formula before saving
 */
router.post('/validate-formula', async (req, res) => {
  try {
    const { formula, test_variables } = req.body;

    if (!formula) {
      return res.status(400).json({
        success: false,
        error: 'Formula is required'
      });
    }

    // Validate syntax
    const validation = formulaEvaluator.validateFormula(formula);

    if (!validation.valid) {
      return res.json({
        success: true,
        valid: false,
        error: validation.error
      });
    }

    // Test with sample variables if provided
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

    // Get variables used in formula
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
});

/**
 * POST /api/scoring/preview
 * Preview scores with custom formulas (doesn't save to database)
 */
router.post('/preview', async (req, res) => {
  try {
    const { game_type, formulas, weights, test_variables } = req.body;

    if (!game_type || !formulas || !weights || !test_variables) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: game_type, formulas, weights, test_variables'
      });
    }

    // Create a temporary config
    const tempConfig = {
      competency_formulas: formulas,
      final_weights: weights,
      settings: {}
    };

    // Calculate scores with test data
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
});

/**
 * POST /api/scoring/compare
 * Compare multiple scoring versions
 */
router.post('/compare', async (req, res) => {
  try {
    const { game_type, version_ids, test_data } = req.body;

    if (!game_type || !version_ids || !Array.isArray(version_ids) || version_ids.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Need at least 2 version IDs to compare'
      });
    }

    // Fetch all versions
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

    // Calculate scores for each version
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

    // Calculate differences
    const differences = this.calculateDifferences(comparisons);

    res.json({
      success: true,
      data: {
        comparisons: comparisons,
        differences: differences,
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
});

/**
 * Calculate differences between versions
 */
function calculateDifferences(comparisons) {
  const differences = [];
  
  for (let i = 1; i < comparisons.length; i++) {
    const v1 = comparisons[i - 1];
    const v2 = comparisons[i];

    const diff = {
      from: v1.version_name,
      to: v2.version_name,
      score_change: v2.final_score - v1.final_score,
      weight_changes: [],
      formula_changes: []
    };

    // Compare weights
    for (const key in v1.weights) {
      if (v1.weights[key] !== v2.weights[key]) {
        diff.weight_changes.push({
          competency: key,
          old_weight: v1.weights[key],
          new_weight: v2.weights[key],
          change: v2.weights[key] - v1.weights[key]
        });
      }
    }

    // Compare formulas
    for (const key in v1.formulas) {
      if (v1.formulas[key] !== v2.formulas[key]) {
        diff.formula_changes.push({
          competency: key,
          old_formula: v1.formulas[key],
          new_formula: v2.formulas[key]
        });
      }
    }

    differences.push(diff);
  }

  return differences;
}

/**
 * GET /api/scoring/variables/:gameType
 * Get available variables for a game type
 */
router.get('/variables/:gameType', async (req, res) => {
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
});

/**
 * GET /api/scoring/active/:gameType
 * Get active scoring configuration
 */
router.get('/active/:gameType', async (req, res) => {
  try {
    const { gameType } = req.params;

    const { data, error } = await supabase
      .from('scoring_versions')
      .select('*')
      .eq('game_type', gameType)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: `No active configuration found for ${gameType}`
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error getting active config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/scoring/versions/:gameType
 * Get all versions for a game type
 */
router.get('/versions/:gameType', async (req, res) => {
  try {
    const { gameType } = req.params;

    const { data, error } = await supabase
      .from('scoring_versions')
      .select('*')
      .eq('game_type', gameType)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Error getting versions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/scoring/save
 * Save new scoring version
 */
router.post('/save', async (req, res) => {
  try {
    const { game_type, user_id, description, config } = req.body;

    if (!game_type || !config) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: game_type, config'
      });
    }

    // Validate all formulas
    for (const [name, formula] of Object.entries(config.competency_formulas || {})) {
      const validation = formulaEvaluator.validateFormula(formula);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: `Invalid formula for ${name}: ${validation.error}`
        });
      }
    }

    // Get next version name
    const { data: nextVersionData, error: versionError } = await supabase
      .rpc('get_next_version_name', { p_game_type: game_type });

    if (versionError) throw versionError;

    const versionName = nextVersionData;

    // Deactivate current active version
    await supabase
      .from('scoring_versions')
      .update({ is_active: false })
      .eq('game_type', game_type)
      .eq('is_active', true);

    // Insert new version
    const { data: newVersion, error: insertError } = await supabase
      .from('scoring_versions')
      .insert({
        game_type: game_type,
        version_name: versionName,
        description: description || `Version ${versionName}`,
        is_active: true,
        config: config,
        created_by: user_id
      })
      .select()
      .single();

    if (insertError) throw insertError;

    res.json({
      success: true,
      message: `Saved as ${versionName}`,
      data: newVersion
    });

  } catch (error) {
    console.error('Error saving version:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/scoring/set-active
 * Set a version as active
 */
router.post('/set-active', async (req, res) => {
  try {
    const { game_type, version_name } = req.body;

    if (!game_type || !version_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: game_type, version_name'
      });
    }

    // Deactivate all versions for this game
    await supabase
      .from('scoring_versions')
      .update({ is_active: false })
      .eq('game_type', game_type);

    // Activate specified version
    const { data, error } = await supabase
      .from('scoring_versions')
      .update({ is_active: true })
      .eq('game_type', game_type)
      .eq('version_name', version_name)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: `${version_name} is now active`,
      data: data
    });

  } catch (error) {
    console.error('Error setting active version:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;