# Data Structures Reference

## Raw Data Formats by Game

Each game sends different `raw_data` format. Here are all formats:

---

### 1. Mental Math Sprint

```javascript
{
  game_type: "mental_math_sprint",
  user_id: "uuid",
  raw_data: [
    {
      problem: "5 + 3",           // String: the question
      user_answer: 8,             // Number: what user entered
      correct_answer: 8,          // Number: the right answer
      is_correct: true,           // Boolean: calculated by frontend
      time_taken: 2.1             // Number: seconds taken
    },
    // ... repeat for all 10 problems
  ]
}
```

---

### 2. Stroop Test

```javascript
{
  game_type: "stroop_test",
  user_id: "uuid",
  raw_data: [
    {
      word: "RED",                // Text shown
      color: "blue",              // Color of the text
      user_response: "blue",      // What user clicked
      is_correct: true,           // Did they click the color?
      is_interference: true,      // Does word != color?
      time_taken: 1.8             // Seconds
    },
    // ... repeat for all items
  ]
}
```

---

### 3. Face-Name Match

```javascript
{
  game_type: "face_name_match",
  user_id: "uuid",
  raw_data: [
    {
      face_id: "uuid",            // Which face was shown
      presented_name: "John Doe", // Name shown with face
      user_response: "John Doe",  // What user selected/typed
      is_correct: true,           // Match correct?
      time_taken: 3.2,            // Seconds
      phase: "learning"           // "learning" or "recall"
    },
    // ... repeat for all attempts
  ]
}
```

---

### 4. Sign Sudoku

```javascript
{
  game_type: "sign_sudoku",
  user_id: "uuid",
  raw_data: {
    correct_entries: 12,          // How many cells filled correctly
    incorrect_entries: 2,         // How many wrong
    total_empty_cells: 16,        // Total cells to fill
    time_left_sec: 45,            // Seconds remaining
    total_time_allowed: 180,      // Total time limit
    total_attempts: 18,           // Total entries tried
    avg_time_per_correct_entry: 8.5,
    completion_status: "partial", // "completed" or "partial"
    grid_size: 4,                 // 4x4 grid
    difficulty_multiplier: 1.2,   // Based on difficulty
    correct_first_attempts: 10    // Cells correct on first try
  }
}
```

---

### 5. Card Flip Challenge

```javascript
{
  game_type: "card_flip_challenge",
  user_id: "uuid",
  raw_data: {
    correct_pairs: 8,             // Pairs matched
    total_pairs: 10,              // Total pairs in game
    total_flips: 25,              // Total card flips
    minimum_flips: 20,            // Optimal flips needed
    time_taken: 45.3,             // Seconds
    time_limit: 60,               // Time allowed
    pattern_discovered: true      // Did user find the pattern?
  }
}
```

---

### 6. Vocab Challenge

```javascript
{
  game_type: "vocab_challenge",
  user_id: "uuid",
  raw_data: {
    unique_valid_words: 25,       // Valid unique words entered
    total_words_entered: 30,      // Including duplicates/invalid
    time_taken: 58,               // Seconds
    time_limit: 60                // Time allowed
  }
}
```

---

### 7. Lucky Flip

```javascript
{
  game_type: "lucky_flip",
  user_id: "uuid",
  raw_data: {
    rounds_completed: 8,          // Rounds finished
    total_rounds: 10,             // Total available
    times_went_bust: 2,           // How many busts
    voluntary_stops_at_optimal_points: 3,
    final_credits: 250,           // Credits at end
    starting_credits: 100,        // Credits at start
    decision_history: [...]       // For AI scoring
  }
}
```

---

### 8. Scenario Challenge (AI)

```javascript
{
  game_type: "scenario_challenge",
  user_id: "uuid",
  response_data: {
    scenario_text: "Full scenario text here...",
    question_text: "What should you do?",
    response_text: "User's written response here...",
    response_length: 250          // Character count
  }
}
```

---

### 9. AI Debate

```javascript
{
  game_type: "ai_debate",
  user_id: "uuid",
  response_data: {
    debate_statement: "Social media does more harm than good",
    pros_text: "User's pros argument...",
    cons_text: "User's cons argument...",
    num_points_pros: 5,
    num_points_cons: 5
  }
}
```

---

### 10. Statement Reasoning (AI)

```javascript
{
  game_type: "statement_reasoning",
  user_id: "uuid",
  response_data: {
    statements: [
      "Statement 1 here",
      "Statement 2 here",
      "Statement 3 here"
    ],
    response_text: "User's explanation of connection...",
    response_length: 180
  }
}
```

---

### 11. Creative Uses (AI)

```javascript
{
  game_type: "creative_uses",
  user_id: "uuid",
  response_data: {
    object_name: "Paperclip",
    uses: [
      "Use as bookmark",
      "Unlock small locks",
      "Reset electronics",
      // ... user's creative uses
    ],
    time_taken: 55,
    time_limit: 60
  }
}
```

---

## Score Response Structure

All games return scores in this format:

```javascript
{
  success: true,
  data: {
    session_id: "uuid",
    version_used: "V2",
    scores: {
      final_score: 85.23,         // 0-100 scale
      competencies: {
        competency_name: {
          raw: 90.0,              // Raw score before weighting
          weighted: 36.0,         // After applying weight
          weight: 0.4,            // Weight used (0-1)
          scored_by_ai: false     // Only true for AI games
        },
        // ... more competencies
      },
      raw_stats: {
        // Game-specific stats
        total_questions: 10,
        correct_answers: 9,
        // etc.
      }
    }
  }
}
```

---

## Config Structure

When you fetch active scoring config:

```javascript
{
  final_weights: {
    competency_name: 0.4,         // Weight (must sum to 1.0)
    // ...
  },
  competency_formulas: {
    competency_name: "formula string (for display only)"
  },
  settings: {
    // Game-specific settings
    accuracy_mode: "binary",
    time_limit: 5
  },
  ai_prompts: {                   // Only for AI games
    competency_name: "Prompt for AI evaluator..."
  }
}
```
