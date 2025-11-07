const supabase = require('../config/supabase');

class ScoringService {
  
  /**
   * Get active scoring version for a game
   */
  async getActiveVersion(gameType) {
    const { data, error } = await supabase
      .from('scoring_versions')
      .select('*')
      .eq('game_type', gameType)
      .eq('is_active', true)
      .single();

    if (error) throw new Error(`Failed to get active version: ${error.message}`);
    if (!data) throw new Error(`No active version found for ${gameType}`);

    return data;
  }

  /**
   * Get all versions for a game
   */
  async getAllVersions(gameType) {
    const { data, error } = await supabase
      .from('scoring_versions')
      .select('id, version_name, description, is_active, created_at')
      .eq('game_type', gameType)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to get versions: ${error.message}`);
    return data || [];
  }

  /**
   * Save new scoring version
   */
  async saveNewVersion(gameType, config, userId, description = null) {
    // Step 1: Get next version name
    const { data: nextVersionData } = await supabase
      .rpc('get_next_version_name', { p_game_type: gameType });

    const nextVersion = nextVersionData || 'V1';

    // Step 2: Deactivate current active version
    await supabase
      .from('scoring_versions')
      .update({ is_active: false })
      .eq('game_type', gameType)
      .eq('is_active', true);

    // Step 3: Insert new version
    const { data, error } = await supabase
      .from('scoring_versions')
      .insert({
        game_type: gameType,
        version_name: nextVersion,
        description: description,
        is_active: true,
        config: config,
        created_by: userId
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to save version: ${error.message}`);

    return data;
  }

  /**
   * Set a specific version as active
   */
  async setActiveVersion(gameType, versionName) {
    // Deactivate all versions for this game
    await supabase
      .from('scoring_versions')
      .update({ is_active: false })
      .eq('game_type', gameType);

    // Activate the specified version
    const { data, error } = await supabase
      .from('scoring_versions')
      .update({ is_active: true })
      .eq('game_type', gameType)
      .eq('version_name', versionName)
      .select()
      .single();

    if (error) throw new Error(`Failed to set active version: ${error.message}`);

    return data;
  }
}

module.exports = new ScoringService();