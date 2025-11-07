# Testing Guide

## Using PowerShell (Windows)

### Test 1: Health Check

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/health"
```

### Test 2: Get Active Config

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/scoring/active/mental_math_sprint"
```

### Test 3: Submit Game

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/games/submit" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{
    "game_type": "mental_math_sprint",
    "user_id": "53f77b43-d71a-4edf-8b80-c70b975264d8",
    "raw_data": [
      {"problem": "5+3", "user_answer": 8, "correct_answer": 8, "is_correct": true, "time_taken": 2.1}
    ]
  }'
```

---

## Using curl (Mac/Linux)

### Test 1: Health Check

```bash
curl http://localhost:3000/health
```

### Test 2: Submit Game

```bash
curl -X POST http://localhost:3000/api/games/submit \
  -H "Content-Type: application/json" \
  -d '{
    "game_type": "mental_math_sprint",
    "user_id": "53f77b43-d71a-4edf-8b80-c70b975264d8",
    "raw_data": [
      {"problem": "5+3", "user_answer": 8, "correct_answer": 8, "is_correct": true, "time_taken": 2.1}
    ]
  }'
```

---

## Using Postman

1. **Download:** <https://www.postman.com/downloads/>
2. **Import Collection:** (Ask backend dev for Postman collection file)
3. **Set Environment Variable:** `base_url = http://localhost:3000`
4. **Run Tests**

---

## Using Browser Console

```javascript
// Test in browser console (F12)
fetch('http://localhost:3000/api/scoring/active/mental_math_sprint')
  .then(r => r.json())
  .then(console.log);
```

---

## Common Test Scenarios

### Scenario 1: Complete Game Flow

```javascript
// 1. Load config
const config = await fetch('/api/scoring/active/mental_math_sprint').then(r => r.json());

// 2. Play game (simulate)
const results = [/* game data */];

// 3. Submit
const scores = await fetch('/api/games/submit', {
  method: 'POST',
  body: JSON.stringify({ game_type: 'mental_math_sprint', raw_data: results })
}).then(r => r.json());

// 4. Check scores saved
const history = await fetch('/api/games/results/mental_math_sprint').then(r => r.json());
console.log('History:', history);
```

### Scenario 2: Version Switching

```javascript
// 1. Check current version
const v1 = await fetch('/api/scoring/active/mental_math_sprint').then(r => r.json());
console.log('Current:', v1.data.version_name); // "V1"

// 2. Save new version
await fetch('/api/scoring/save', {
  method: 'POST',
  body: JSON.stringify({
    game_type: 'mental_math_sprint',
    config: { /* updated weights */ }
  })
}).then(r => r.json());

// 3. Verify it switched to V2
const v2 = await fetch('/api/scoring/active/mental_math_sprint').then(r => r.json());
console.log('Now:', v2.data.version_name); // "V2"
```
