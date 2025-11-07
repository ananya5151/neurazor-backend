const aiService = require('../services/ai.service');
const scoringService = require('../services/scoring.service');

class AIController {
  
  /**
   * POST /api/ai/score
   * Get AI scores for text-based games
   */
  async scoreResponse(req, res) {
    try {
      const { game_type, response_data } = req.body;

      if (!game_type || !response_data) {
        return res.status(400).json({
          success: false,
          error: 'game_type and response_data are required'
        });
      }

      // Validate it's an AI-scored game
      const aiGames = ['scenario_challenge', 'ai_debate', 'statement_reasoning', 'creative_uses', 'lucky_flip'];
      if (!aiGames.includes(game_type)) {
        return res.status(400).json({
          success: false,
          error: `${game_type} does not require AI scoring`
        });
      }

      // Get active config to get AI prompts
      const version = await scoringService.getActiveVersion(game_type);

      // Get AI scores
      let aiScores;
      if (process.env.GEMINI_API_KEY) {
        aiScores = await aiService.scoreResponse(game_type, response_data, version.config);
      } else {
        // Fallback to mock scores if no API key
        const competencies = Object.keys(version.config.final_weights);
        aiScores = aiService.getMockScores(competencies);
        console.warn('⚠️  Using mock AI scores - configure GEMINI_API_KEY for real evaluation');
      }

      res.json({
        success: true,
        data: {
          ai_scores: aiScores,
          version_used: version.version_name
        }
      });

    } catch (error) {
      console.error('AI scoring error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/ai/submit-game
   * Complete flow: AI score + calculate final score + save
   */
  async submitAIGame(req, res) {
    try {
      const { game_type, response_data, user_id } = req.body;

      if (!game_type || !response_data || !user_id) {
        return res.status(400).json({
          success: false,
          error: 'game_type, response_data, and user_id are required'
        });
      }

      // Step 1: Get active config
      const version = await scoringService.getActiveVersion(game_type);

      // Step 2: Get AI scores
      let aiScores;
      if (process.env.GEMINI_API_KEY) {
        aiScores = await aiService.scoreResponse(game_type, response_data, version.config);
      } else {
        const competencies = Object.keys(version.config.final_weights);
        aiScores = aiService.getMockScores(competencies);
      }

      // Step 3: Calculate final scores using calculator service
      const calculatorService = require('../services/calculator.service');
      const finalScores = calculatorService.calculateScores(
        game_type,
        response_data,
        version.config,
        aiScores
      );

      // Step 4: Save to database
      const supabase = require('../config/supabase');

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

      // Save text receipt
      const { error: receiptError } = await supabase
        .from('text_receipts')
        .insert({
          session_id: session.id,
          response_data: response_data
        });

      if (receiptError) throw receiptError;

      // Update with final scores
      const { error: updateError } = await supabase
        .from('test_sessions')
        .update({
          final_scores: {
            ...finalScores,
            ai_scores: aiScores
          },
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (updateError) throw updateError;

      res.json({
        success: true,
        message: 'AI game submitted successfully',
        data: {
          session_id: session.id,
          version_used: version.version_name,
          ai_scores: aiScores,
          final_scores: finalScores
        }
      });

    } catch (error) {
      console.error('AI game submission error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new AIController();