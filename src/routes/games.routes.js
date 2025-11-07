const express = require('express');
const router = express.Router();
const gamesController = require('../controllers/games.controller');

// Submit game and get scores
router.post('/submit', gamesController.submitGame);

// Get results for comparison
router.get('/results/:gameType', gamesController.getResults);

module.exports = router;