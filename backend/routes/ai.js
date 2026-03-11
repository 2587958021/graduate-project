const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const aiController = require('../controllers/aiController');

// 创建一个可选的身份验证中间件
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 没有提供令牌，继续但不设置req.user
      console.log('未提供认证令牌，继续处理请求');
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    // 尝试验证令牌
    try {
      const jwt = require('jsonwebtoken');
      const config = require('../config/config');
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // 查找用户
      const path = require('path');
      const fs = require('fs');
      const USER_DATA_FILE = path.join(__dirname, '../data/users/users.json');
      
      // 加载用户数据
      if (fs.existsSync(USER_DATA_FILE)) {
        const users = JSON.parse(fs.readFileSync(USER_DATA_FILE, 'utf8'));
        const user = users.find(user => user._id === decoded.userId);
        
        if (user) {
          // 排除密码字段
          const { password, ...userWithoutPassword } = user;
          // 将用户信息添加到请求对象
          req.user = userWithoutPassword;
          console.log('成功验证用户令牌，用户ID:', req.user.id);
        }
      }
    } catch (error) {
      console.warn('令牌验证失败，继续处理请求:', error.message);
      // 令牌验证失败，继续但不设置req.user
    }
    
    next();
  } catch (error) {
    console.error('可选身份验证中间件错误:', error);
    next();
  }
};

/**
 * @route   GET /api/ai/weakness-analysis
 * @desc    获取用户的学习薄弱点分析
 * @access  Public (with optional auth)
 */
router.get('/weakness-analysis', optionalAuth, aiController.getWeaknessAnalysis);

/**
 * @route   GET /api/ai/learning-recommendations
 * @desc    获取基于薄弱点的学习建议
 * @access  Public (with optional auth)
 */
router.get('/learning-recommendations', optionalAuth, aiController.getLearningRecommendations);

/**
 * @route   GET /api/ai/resource-recommendations
 * @desc    获取学习资源推荐
 * @access  Public (with optional auth)
 */
router.get('/resource-recommendations', optionalAuth, aiController.getResourceRecommendations);

module.exports = router; 