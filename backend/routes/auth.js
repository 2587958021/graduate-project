const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/auth');

// 注册新用户
router.post('/register', authController.register);

// 用户登录
router.post('/login', authController.login);

// 获取当前用户信息
router.get('/me', verifyToken, authController.getCurrentUser);

// 更新用户信息
router.put('/update', verifyToken, authController.updateUser);

// 更改密码
router.put('/change-password', verifyToken, authController.changePassword);

// 管理员：获取所有用户
router.get('/users', verifyToken, authController.getAllUsers);

// 管理员：设置用户角色
router.put('/users/:id/role', verifyToken, authController.setUserRole);

module.exports = router; 