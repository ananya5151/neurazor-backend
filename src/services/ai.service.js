/**
 * AI Scoring Service
 * Handles AI-based evaluation for text-based games
 * Uses Google Gemini API
 */

class AIService {
  
  /**
   * Score text-based game responses using AI
   */
  async scoreResponse(gameType, responseData, config) {
    const aiPrompts = config.ai_prompts || {};
    const competencies = Object.keys(config.final_weights);
    
    // Build the AI prompt based on game type
    const prompt = this.buildPrompt(gameType, responseData, aiPrompts, competencies);
    
    // Call Gemini API
    const aiScores = await this.callGeminiAPI(prompt);
    
    return aiScores;
  }

  /**
   * Build AI prompt based on game type
   */
  buildPrompt(gameType, responseData, aiPrompts, competencies) {
    let prompt = `You are an expert evaluator for cognitive assessments. Score the following response across multiple competencies.\n\n`;
    
    switch(gameType) {
      case 'scenario_challenge':
        prompt += `SCENARIO:\n${responseData.scenario_text}\n\n`;
        prompt += `QUESTION:\n${responseData.question_text}\n\n`;
        prompt += `USER'S RESPONSE:\n${responseData.response_text}\n\n`;
        break;
        
      case 'ai_debate':
        prompt += `DEBATE TOPIC:\n${responseData.debate_statement}\n\n`;
        prompt += `PROS ARGUMENT:\n${responseData.pros_text}\n\n`;
        prompt += `CONS ARGUMENT:\n${responseData.cons_text}\n\n`;
        break;
        
      case 'statement_reasoning':
        prompt += `STATEMENTS:\n${responseData.statements.join('\n')}\n\n`;
        prompt += `USER'S EXPLANATION:\n${responseData.response_text}\n\n`;
        break;
        
      case 'creative_uses':
        prompt += `OBJECT: ${responseData.object_name}\n\n`;
        prompt += `USES PROVIDED:\n${responseData.uses.join('\n')}\n\n`;
        break;
    }
    
    prompt += `\nEVALUATE THE FOLLOWING COMPETENCIES (score each 0-100):\n\n`;
    
    for (const competency of competencies) {
      const competencyPrompt = aiPrompts[competency] || `Evaluate ${competency}`;
      prompt += `${competency.toUpperCase()}:\n${competencyPrompt}\n\n`;
    }
    
    prompt += `\nRESPOND IN THIS EXACT JSON FORMAT:\n`;
    prompt += `{\n`;
    for (const competency of competencies) {
      prompt += `  "${competency}": <score 0-100>,\n`;
    }
    prompt += `  "feedback": "<brief explanation of scores>"\n`;
    prompt += `}\n`;
    
    return prompt;
  }

  /**
   * Call Google Gemini API
   */
  async callGeminiAPI(prompt) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.candidates[0]?.content?.parts[0]?.text;

      if (!aiResponse) {
        throw new Error('No response from Gemini API');
      }

      // Parse JSON response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse AI response as JSON');
      }

      const scores = JSON.parse(jsonMatch[0]);
      return scores;

    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error(`AI scoring failed: ${error.message}`);
    }
  }

  /**
   * Fallback: Mock AI scores for testing without API key
   */
  getMockScores(competencies) {
    const scores = {};
    for (const competency of competencies) {
      scores[competency] = Math.floor(Math.random() * 30) + 60; // Random 60-90
    }
    scores.feedback = "Mock scores - configure GEMINI_API_KEY for real AI evaluation";
    return scores;
  }
}

module.exports = new AIService();