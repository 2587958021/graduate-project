const express = require('express');
const router = express.Router();
const mistakeController = require('../controllers/mistakeController');
const { verifyToken } = require('../middlewares/auth');

// 注释掉认证中间件，允许未登录用户访问
// router.use(verifyToken);

// 添加题目到错题本
router.post('/', mistakeController.addToMistakes);

// 获取用户的错题本列表
router.get('/', mistakeController.getUserMistakes);

// 获取错题统计信息
router.get('/stats', mistakeController.getMistakeStats);

// 清空错题集 - 具体路径需要放在参数路径之前
router.delete('/clear', mistakeController.clearMistakes);

// 从错题本中移除题目
router.delete('/:mistakeId', mistakeController.removeFromMistakes);

// 更新错题状态（标记为已掌握/未掌握）
router.patch('/:mistakeId', mistakeController.updateMistakeStatus);

module.exports = router; 