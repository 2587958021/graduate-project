const express = require('express');
const router = express.Router();
const learningAnalysisController = require('../controllers/learningAnalysisController');
const { verifyToken } = require('../middlewares/auth');

// 获取薄弱点分析
router.get('/weak-points', learningAnalysisController.analyzeWeakPoints);

module.exports = router; 