const scoringService = require('../services/scoring.service');

class ScoringController {
  
  /**
   * GET /api/scoring/active/:gameType
   * Get active scoring configuration
   */
  async getActive(req, res) {
    try {
      const { gameType } = req.params;
      const version = await scoringService.getActiveVersion(gameType);
      
      res.json({
        success: true,
        data: version
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/scoring/versions/:gameType
   * Get all versions for a game
   */
  async getAllVersions(req, res) {
    try {
      const { gameType } = req.params;
      const versions = await scoringService.getAllVersions(gameType);
      
      res.json({
        success: true,
        data: versions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/scoring/save
   * Save new scoring version
   */
  async saveNewVersion(req, res) {
    try {
      const { game_type, config, user_id, description } = req.body;
      
      if (!game_type || !config) {
        return res.status(400).json({
          success: false,
          error: 'game_type and config are required'
        });
      }

      const newVersion = await scoringService.saveNewVersion(
        game_type,
        config,
        user_id,
        description
      );
      
      res.json({
        success: true,
        message: `Saved as ${newVersion.version_name}`,
        data: newVersion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/scoring/set-active
   * Set a version as active
   */
  async setActive(req, res) {
    try {
      const { game_type, version_name } = req.body;
      
      if (!game_type || !version_name) {
        return res.status(400).json({
          success: false,
          error: 'game_type and version_name are required'
        });
      }

      const version = await scoringService.setActiveVersion(game_type, version_name);
      
      res.json({
        success: true,
        message: `${version_name} is now active`,
        data: version
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new ScoringController();