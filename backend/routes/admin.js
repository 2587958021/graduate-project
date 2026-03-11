const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middlewares/auth');

/**
 * @route   GET /api/admin/stats
 * @desc    获取系统统计数据
 * @access  Private (只有管理员可访问)
 */
router.get('/stats', verifyToken, isAdmin, adminController.getSystemStats);

module.exports = router; 