# NeuRazor Backend API Documentation

## 🚀 Quick Start

**Base URL (Local Development):** `http://localhost:3000`

**Base URL (Production - TBD):** `https://api.neurazor.com`

---

## 📋 What This Backend Does

The NeuRazor backend is a **scoring engine** that:

- Takes raw game data from frontend
- Applies secret scoring formulas (not exposed to users)
- Calculates final scores and competency breakdowns
- Saves results to database with version tracking
- Provides AI-powered evaluation for text-based games

---

## 🔑 Authentication

**Test User Credentials:**

```
User ID: 53f77b43-d71a-4edf-8b80-c70b975264d8
Email: test@neurazor.com
Password: Test123456!
```

**Note:** All API endpoints currently accept user_id directly in request body. Production will use JWT tokens.

---

## 📦 Installation for Local Testing

```bash
# Install dependencies
npm install @supabase/supabase-js

# No backend setup needed - just use the API endpoints!
```

---

## 🎮 Supported Games

All 11 games have full backend support:

**Action-Based (Calculated):**

1. Mental Math Sprint
2. Face-Name Match
3. Sign Sudoku
4. Stroop Test
5. Card Flip Challenge
6. Lucky Flip
7. Vocab Challenge

**AI-Scored (Evaluated):**
8. Scenario Challenge
9. AI Debate (Debate Mode)
10. Statement Reasoning
11. Creative Uses

---

## 🔄 Versioning System

The backend automatically manages scoring versions:

- Each game has independent versions (V1, V2, V3...)
- When admin edits scoring weights → new version auto-created
- Only ONE version per game is active at a time
- All game results remember which version was used
- Can compare scores across versions

**Example Flow:**

```
User plays Mental Math → Uses V1 → Score: 65
Admin edits weights → V2 created automatically
User plays again → Uses V2 → Score: 72
Compare: V1 vs V2 results side-by-side
```

---

## 📊 Response Format

All responses follow this structure:

**Success:**

```json
{
  "success": true,
  "message": "Optional message",
  "data": { ... }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## 🚨 Error Handling

Always check `response.success` before using data:

```javascript
const response = await fetch('/api/games/submit', { ... });
const result = await response.json();

if (result.success) {
  // Use result.data
  console.log('Score:', result.data.scores.final_score);
} else {
  // Handle error
  console.error('Error:', result.error);
}
```

---

## 📖 Next Steps

Read these files in order:

1. `API_ENDPOINTS.md` - All available endpoints
2. `DATA_STRUCTURES.md` - Request/response formats
3. `GAME_INTEGRATION.md` - How to integrate each game type
4. `CODE_EXAMPLES.md` - Copy-paste ready code
