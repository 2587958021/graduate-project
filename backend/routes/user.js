const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, isAdmin, verifyAdmin } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const upload = require('../middlewares/upload');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../public/uploads/avatars');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('创建上传目录:', uploadDir);
}

// 简化Multer配置
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log('保存文件到目录:', uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const filename = 'avatar-' + uniqueSuffix + ext;
        console.log('生成文件名:', filename);
        cb(null, filename);
    }
});

// 简化文件过滤
const fileFilter = (req, file, cb) => {
    console.log('收到文件:', file.originalname, '类型:', file.mimetype);
    // 接受所有图片类型
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        console.log('拒绝文件:', file.originalname, '类型不是图片');
        cb(new Error('只支持图片文件'), false);
    }
};

// 创建multer实例
const uploadMulter = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 放宽限制到5MB
    },
    fileFilter: fileFilter
}).single('avatar');

// 获取用户信息
router.get('/profile', userController.getUserProfile);

// 更新用户信息
router.put('/profile', userController.updateUserProfile);

// 自定义处理上传头像的中间件
router.post('/avatar', uploadMulter, userController.uploadAvatar);

// 获取用户学习进度
router.get('/learning-progress', userController.getLearningProgress);

// === 管理员API路由 ===
// 获取所有用户
router.get('/admin/all', verifyToken, verifyAdmin, userController.getAllUsers);

// 获取单个用户详情
router.get('/admin/details/:userId', verifyToken, verifyAdmin, userController.getUserDetails);

// 更新用户角色和状态
router.put('/admin/users/:userId', verifyToken, isAdmin, userController.updateUserRole);

// 添加管理统计数据路由
router.get('/admin/statistics', verifyToken, verifyAdmin, userController.getAdminStatistics);

module.exports = router; 