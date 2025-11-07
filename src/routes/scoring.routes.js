const express = require('express');
const router = express.Router();
const scoringController = require('../controllers/scoring.controller');

// Get active scoring config
router.get('/active/:gameType', scoringController.getActive);

// Get all versions for a game
router.get('/versions/:gameType', scoringController.getAllVersions);

// Save new version
router.post('/save', scoringController.saveNewVersion);

// Set version as active
router.post('/set-active', scoringController.setActive);

module.exports = router;