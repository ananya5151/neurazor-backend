# Quick Start - 5 Minutes

## 1. Backend is Running

```
URL: http://localhost:3000
Status: Check http://localhost:3000/health
```

## 2. Test User

```
ID: 53f77b43-d71a-4edf-8b80-c70b975264d8
Email: test@neurazor.com
Password: Test123456!
```

## 3. Main Endpoints

**Get scoring config:**

```
GET /api/scoring/active/mental_math_sprint
```

**Submit game:**

```
POST /api/games/submit
Body: { game_type, user_id, raw_data }
```

**Get history:**

```
GET /api/games/results/mental_math_sprint?userId=xxx
```

## 4. Example Code

```javascript
// Submit game
const response = await fetch('http://localhost:3000/api/games/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    game_type: 'mental_math_sprint',
    user_id: '53f77b43-d71a-4edf-8b80-c70b975264d8',
    raw_data: [
      {
        problem: "5 + 3",
        user_answer: 8,
        correct_answer: 8,
        is_correct: true,
        time_taken: 2.1
      }
    ]
  })
});

const result = await response.json();
console.log('Score:', result.data.scores.final_score);
```

## 5. All Game Types

```
mental_math_sprint, face_name_match, sign_sudoku, stroop_test,
card_flip_challenge, scenario_challenge, ai_debate, creative_uses,
statement_reasoning, vocab_challenge, lucky_flip
```

## 6. Need Help?

Read full docs: `API_ENDPOINTS.md`, `DATA_STRUCTURES.md`, `CODE_EXAMPLES.md`
