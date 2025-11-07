const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');

// Get AI scores only
router.post('/score', aiController.scoreResponse);

// Complete AI game submission (score + calculate + save)
router.post('/submit-game', aiController.submitAIGame);

module.exports = router;