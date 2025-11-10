const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const scoringRoutes = require('./routes/scoring.routes');
const gamesRoutes = require('./routes/games.routes');
const aiRoutes = require('./routes/ai.routes');

// Mount routes
app.use('/api/scoring', scoringRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'NeuRazor Backend with Dynamic Formulas is running 🚀',
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: error.message
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 NeuRazor Backend running on port ${PORT}`);
  console.log(`📊 Dynamic formula evaluation: ENABLED`);
  console.log(`🔗 API Base: http://localhost:${PORT}`);
});