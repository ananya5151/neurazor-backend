const supabase = require('../config/supabase');
const scoringService = require('../services/scoring.service');
const calculatorService = require('../services/calculator.service');

class GamesController {
  
  /**
   * POST /api/games/submit
   * Submit game results and calculate scores
   */
  async submitGame(req, res) {
    try {
      const { game_type, raw_data, user_id } = req.body;

      if (!game_type || !raw_data || !user_id) {
        return res.status(400).json({
          success: false,
          error: 'game_type, raw_data, and user_id are required'
        });
      }

      // Step 1: Get active scoring version
      const version = await scoringService.getActiveVersion(game_type);

      // Step 2: Create test session
      const { data: session, error: sessionError } = await supabase
        .from('test_sessions')
        .insert({
          user_id: user_id,
          game_type: game_type,
          scoring_version_id: version.id,
          status: 'in_progress'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Step 3: Save raw receipt
      const { error: receiptError } = await supabase
        .from('action_receipts')
        .insert({
          session_id: session.id,
          raw_data: raw_data
        });

      if (receiptError) throw receiptError;

      // Step 4: Calculate scores using SECRET FORMULAS
      const finalScores = calculatorService.calculateScores(
        game_type,
        raw_data,
        version.config
      );

      // Step 5: Update session with final scores
      const { error: updateError } = await supabase
        .from('test_sessions')
        .update({
          final_scores: finalScores,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (updateError) throw updateError;

      res.json({
        success: true,
        message: 'Game submitted successfully',
        data: {
          session_id: session.id,
          version_used: version.version_name,
          scores: finalScores
        }
      });

    } catch (error) {
      console.error('Submit game error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/games/results/:gameType
   * Get all results for a game (for comparison)
   */
  async getResults(req, res) {
    try {
      const { gameType } = req.params;
      const { userId } = req.query;

      let query = supabase
        .from('test_sessions')
        .select(`
          id,
          final_scores,
          created_at,
          completed_at,
          scoring_version:scoring_versions(version_name)
        `)
        .eq('game_type', gameType)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      res.json({
        success: true,
        data: data || []
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new GamesController();