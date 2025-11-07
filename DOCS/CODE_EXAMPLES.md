# Code Examples

## Example 1: Complete Mental Math Integration

```javascript
// 1. Load game configuration when component mounts
async function loadGameConfig() {
  try {
    const response = await fetch('http://localhost:3000/api/scoring/active/mental_math_sprint');
    const result = await response.json();
    
    if (result.success) {
      const config = result.data.config;
      console.log('Current version:', result.data.version_name);
      console.log('Weights:', config.final_weights);
      return config;
    }
  } catch (error) {
    console.error('Failed to load config:', error);
  }
}

// 2. Play game and collect results
function playGame() {
  const gameResults = [];
  
  // For each problem...
  problems.forEach(problem => {
    const userAnswer = getUserAnswer();
    const timeTaken = getTimeTaken();
    
    gameResults.push({
      problem: problem.text,
      user_answer: userAnswer,
      correct_answer: problem.answer,
      is_correct: userAnswer === problem.answer,
      time_taken: timeTaken
    });
  });
  
  return gameResults;
}

// 3. Submit and get scores
async function submitGame(gameResults) {
  try {
    const response = await fetch('http://localhost:3000/api/games/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_type: 'mental_math_sprint',
        user_id: currentUserId,
        raw_data: gameResults
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      const scores = result.data.scores;
      displayScores(scores);
      return scores;
    } else {
      console.error('Submission failed:', result.error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}

// 4. Display scores
function displayScores(scores) {
  console.log(`Final Score: ${scores.final_score}`);
  
  Object.entries(scores.competencies).forEach(([name, data]) => {
    console.log(`${name}: ${data.raw} (weight: ${data.weight * 100}%) = ${data.weighted}`);
  });
}
```

---

## Example 2: AI Game Integration (Scenario Challenge)

```javascript
async function submitScenarioChallenge(scenario, question, userResponse) {
  try {
    const response = await fetch('http://localhost:3000/api/ai/submit-game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_type: 'scenario_challenge',
        user_id: currentUserId,
        response_data: {
          scenario_text: scenario,
          question_text: question,
          response_text: userResponse,
          response_length: userResponse.length
        }
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('AI Scores:', result.data.ai_scores);
      console.log('Final Score:', result.data.final_scores.final_score);
      
      // Show AI feedback to user
      alert(result.data.ai_scores.feedback);
      
      return result.data;
    }
  } catch (error) {
    console.error('AI submission failed:', error);
  }
}
```

---

## Example 3: Results History / Comparison View

```javascript
async function loadResultsHistory(gameType) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/games/results/${gameType}?userId=${currentUserId}`
    );
    const result = await response.json();
    
    if (result.success) {
      const results = result.data;
      
      // Display in table
      results.forEach(session => {
        console.log(`
          Date: ${new Date(session.created_at).toLocaleDateString()}
          Version: ${session.scoring_version.version_name}
          Score: ${session.final_scores.final_score}
        `);
      });
      
      // Compare V1 vs V2
      const v1Results = results.filter(r => r.scoring_version.version_name === 'V1');
      const v2Results = results.filter(r => r.scoring_version.version_name === 'V2');
      
      console.log('Average V1 score:', calculateAverage(v1Results));
      console.log('Average V2 score:', calculateAverage(v2Results));
    }
  } catch (error) {
    console.error('Failed to load history:', error);
  }
}

function calculateAverage(results) {
  const sum = results.reduce((acc, r) => acc + r.final_scores.final_score, 0);
  return sum / results.length;
}
```

---

## Example 4: Admin Scoring Controls

```javascript
// Complete flow for editing scoring weights

// 1. Load current config
async function loadCurrentConfig(gameType) {
  const response = await fetch(`http://localhost:3000/api/scoring/active/${gameType}`);
  const result = await response.json();
  return result.data.config;
}

// 2. Show editable form
function showScoringModal(config) {
  // Create form with editable weights
  const form = {
    accuracy: config.final_weights.accuracy,
    speed: config.final_weights.speed,
    // ... other weights
  };
  
  // User edits in UI
  return form;
}

// 3. Save new configuration
async function saveNewConfig(gameType, newWeights) {
  // Get full current config
  const currentConfig = await loadCurrentConfig(gameType);
  
  // Update weights
  currentConfig.final_weights = newWeights;
  
  // Submit (backend auto-creates V2, V3, etc.)
  const response = await fetch('http://localhost:3000/api/scoring/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      game_type: gameType,
      user_id: currentUserId,
      description: "User adjusted weights", // Optional
      config: currentConfig
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    alert(`✅ Saved as ${result.data.version_name}`);
    // V2, V3, etc. is auto-generated!
  }
}

// 4. Complete workflow
async function editScoring(gameType) {
  const currentConfig = await loadCurrentConfig(gameType);
  const newWeights = await showScoringModal(currentConfig);
  await saveNewConfig(gameType, newWeights);
}
```

---

## Example 5: Error Handling Pattern

```javascript
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`http://localhost:3000${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      // Backend returned error
      throw new Error(result.error);
    }
  } catch (error) {
    // Network error or backend error
    console.error('API Error:', error.message);
    
    // Show user-friendly message
    showErrorToast('Something went wrong. Please try again.');
    
    return null;
  }
}

// Usage
const scores = await apiCall('/api/games/submit', {
  method: 'POST',
  body: JSON.stringify({ ... })
});

if (scores) {
  displayScores(scores);
}
```

---

## Example 6: React Hook for Game Submission

```javascript
import { useState } from 'react';

function useGameSubmission(gameType) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scores, setScores] = useState(null);
  
  const submitGame = async (rawData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3000/api/games/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_type: gameType,
          user_id: getCurrentUserId(),
          raw_data: rawData
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setScores(result.data.scores);
        return result.data.scores;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return { submitGame, loading, error, scores };
}

// Usage in component
function MentalMathGame() {
  const { submitGame, loading, scores } = useGameSubmission('mental_math_sprint');
  
  const handleGameComplete = async (gameResults) => {
    const finalScores = await submitGame(gameResults);
    if (finalScores) {
      // Show score screen
    }
  };
  
  return ...;
}
```
