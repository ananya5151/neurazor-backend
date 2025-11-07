# API Endpoints Reference

## Base URL

```
http://localhost:3000
```

---

## 1. Get Active Scoring Configuration

**Endpoint:** `GET /api/scoring/active/:gameType`

**Purpose:** Load current active scoring weights and formulas for a game

**Parameters:**

- `gameType` (path) - Game identifier (see Game Types below)

**Example Request:**

```javascript
const response = await fetch('http://localhost:3000/api/scoring/active/mental_math_sprint');
const data = await response.json();
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "game_type": "mental_math_sprint",
    "version_name": "V1",
    "description": "Original NeuRazor scoring formulas",
    "is_active": true,
    "config": {
      "final_weights": {
        "accuracy": 0.4,
        "speed": 0.3,
        "quantitative_aptitude": 0.2,
        "mental_stamina": 0.1
      },
      "competency_formulas": {
        "accuracy_binary": "correct ? 100 : 0",
        "speed": "(time_limit - time_taken) / time_limit * 100"
      },
      "settings": {
        "accuracy_mode": "binary",
        "time_limit": 5
      }
    },
    "created_at": "2025-01-15T10:00:00Z"
  }
}
```

**Use Case:** Call this when game loads to get current scoring configuration.

---

## 2. Submit Game Results (Action Games)

**Endpoint:** `POST /api/games/submit`

**Purpose:** Submit game results and get calculated scores

**Request Body:**

```json
{
  "game_type": "mental_math_sprint",
  "user_id": "53f77b43-d71a-4edf-8b80-c70b975264d8",
  "raw_data": [
    {
      "problem": "5 + 3",
      "user_answer": 8,
      "correct_answer": 8,
      "is_correct": true,
      "time_taken": 2.1
    }
  ]
}
```

**Example Request:**

```javascript
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
```

**Example Response:**

```json
{
  "success": true,
  "message": "Game submitted successfully",
  "data": {
    "session_id": "abc-123-def-456",
    "version_used": "V1",
    "scores": {
      "final_score": 85.23,
      "competencies": {
        "accuracy": {
          "raw": 90.0,
          "weighted": 36.0,
          "weight": 0.4
        },
        "speed": {
          "raw": 58.0,
          "weighted": 17.4,
          "weight": 0.3
        },
        "quantitative_aptitude": {
          "raw": 80.4,
          "weighted": 16.08,
          "weight": 0.2
        },
        "mental_stamina": {
          "raw": 76.5,
          "weighted": 7.65,
          "weight": 0.1
        }
      },
      "raw_stats": {
        "total_questions": 10,
        "correct_answers": 9,
        "total_time": 22.0,
        "avg_time_per_question": 2.2
      }
    }
  }
}
```

---

## 3. Submit AI Game

**Endpoint:** `POST /api/ai/submit-game`

**Purpose:** Submit text-based games that require AI evaluation

**Request Body:**

```json
{
  "game_type": "scenario_challenge",
  "user_id": "53f77b43-d71a-4edf-8b80-c70b975264d8",
  "response_data": {
    "scenario_text": "Raj interrupted Asha during her presentation...",
    "question_text": "What might Asha be feeling?",
    "response_text": "Asha is likely feeling frustrated, embarrassed, and undervalued."
  }
}
```

**Example Response:**

```json
{
  "success": true,
  "message": "AI game submitted successfully",
  "data": {
    "session_id": "xyz-789",
    "version_used": "V1",
    "ai_scores": {
      "reasoning": 82,
      "empathy": 88,
      "decision_making": 75,
      "creativity": 70,
      "communication": 85,
      "feedback": "Strong empathy shown..."
    },
    "final_scores": {
      "final_score": 81.5,
      "competencies": {
        "reasoning": {
          "raw": 82,
          "weighted": 24.6,
          "weight": 0.3,
          "scored_by_ai": true
        }
      }
    }
  }
}
```

---

## 4. Get Results History

**Endpoint:** `GET /api/games/results/:gameType?userId=xxx`

**Purpose:** Get all past results for a specific game (for comparison view)

**Parameters:**

- `gameType` (path) - Game identifier
- `userId` (query, optional) - Filter by user

**Example Request:**

```javascript
const response = await fetch(
  `http://localhost:3000/api/games/results/mental_math_sprint?userId=${currentUserId}`
);
const data = await response.json();
```

**Example Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "session-1",
      "final_scores": {
        "final_score": 65,
        "competencies": { ... }
      },
      "created_at": "2025-01-15T10:00:00Z",
      "completed_at": "2025-01-15T10:05:00Z",
      "scoring_version": {
        "version_name": "V1"
      }
    },
    {
      "id": "session-2",
      "final_scores": {
        "final_score": 72,
        "competencies": { ... }
      },
      "created_at": "2025-01-15T11:00:00Z",
      "completed_at": "2025-01-15T11:05:00Z",
      "scoring_version": {
        "version_name": "V2"
      }
    }
  ]
}
```

---

## 5. Save New Scoring Version (Admin Only)

**Endpoint:** `POST /api/scoring/save`

**Purpose:** Save new scoring configuration (auto-creates V2, V3, etc.)

**Request Body:**

```json
{
  "game_type": "mental_math_sprint",
  "user_id": "53f77b43-d71a-4edf-8b80-c70b975264d8",
  "description": "Increased speed importance",
  "config": {
    "final_weights": {
      "accuracy": 0.35,
      "speed": 0.40,
      "quantitative_aptitude": 0.15,
      "mental_stamina": 0.10
    },
    "competency_formulas": { ... },
    "settings": { ... }
  }
}
```

**Example Response:**

```json
{
  "success": true,
  "message": "Saved as V2",
  "data": {
    "id": "new-version-id",
    "version_name": "V2",
    "is_active": true
  }
}
```

**Important:** Version name (V2, V3, etc.) is AUTO-GENERATED. Don't ask user for version name!

---

## 6. Get All Versions

**Endpoint:** `GET /api/scoring/versions/:gameType`

**Purpose:** Get version history for a game

**Example Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "version-2",
      "version_name": "V2",
      "description": "Increased speed importance",
      "is_active": true,
      "created_at": "2025-01-15T11:00:00Z"
    },
    {
      "id": "version-1",
      "version_name": "V1",
      "description": "Original formulas",
      "is_active": false,
      "created_at": "2025-01-15T09:00:00Z"
    }
  ]
}
```

---

## 7. Set Active Version (Admin Only)

**Endpoint:** `POST /api/scoring/set-active`

**Purpose:** Switch back to a previous version

**Request Body:**

```json
{
  "game_type": "mental_math_sprint",
  "version_name": "V1"
}
```

**Example Response:**

```json
{
  "success": true,
  "message": "V1 is now active",
  "data": { ... }
}
```

---

## 8. Get AI Scores Only

**Endpoint:** `POST /api/ai/score`

**Purpose:** Get AI evaluation without saving to database (for preview)

**Request Body:**

```json
{
  "game_type": "scenario_challenge",
  "response_data": {
    "scenario_text": "...",
    "response_text": "..."
  }
}
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "ai_scores": {
      "reasoning": 82,
      "empathy": 88,
      "decision_making": 75,
      "creativity": 70,
      "communication": 85
    },
    "version_used": "V1"
  }
}
```

---

## 9. Health Check

**Endpoint:** `GET /health`

**Purpose:** Check if backend is running

**Example Response:**

```json
{
  "status": "ok",
  "message": "NeuRazor Backend is running"
}
```

---

## Valid Game Types

Use these exact strings for `game_type`:

```
mental_math_sprint
face_name_match
sign_sudoku
stroop_test
card_flip_challenge
scenario_challenge
ai_debate
creative_uses
statement_reasoning
vocab_challenge
lucky_flip
```
