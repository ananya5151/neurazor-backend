const scoringCalculator = require('../services/scoringCalculator');
const supabase = require('../config/supabase');

exports.submitGame = async (req, res) => {
  try {
    const { game_type, user_id, raw_data } = req.body;

    if (!game_type || !user_id || !raw_data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: game_type, user_id, raw_data'
      });
    }

    console.log(`\n=== Submitting ${game_type} ===`);

    // Get active scoring configuration
    const { data: config, error: configError } = await supabase
      .from('scoring_versions')
      .select('*')
      .eq('game_type', game_type)
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      return res.status(404).json({
        success: false,
        error: `No active scoring configuration found for ${game_type}`
      });
    }

    console.log(`Using version: ${config.version_name}`);
    console.log('Formulas:', config.config.competency_formulas);

    // Calculate scores using dynamic formulas ⭐ KEY CHANGE
    const scores = scoringCalculator.calculateScores(
      game_type,
      config.config,
      raw_data
    );

    // Create test session
    const { data: session, error: sessionError } = await supabase
      .from('test_sessions')
      .insert({
        user_id: user_id,
        game_type: game_type,
        scoring_version_id: config.id,
        status: 'completed',
        final_scores: scores,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Store raw data
    const { error: receiptError } = await supabase
      .from('action_receipts')
      .insert({
        session_id: session.id,
        raw_data: raw_data
      });

    if (receiptError) throw receiptError;

    console.log(`✅ Game submitted. Session: ${session.id}`);

    res.json({
      success: true,
      message: 'Game submitted successfully',
      data: {
        session_id: session.id,
        version_used: config.version_name,
        scores: scores
      }
    });

  } catch (error) {
    console.error('Error submitting game:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};