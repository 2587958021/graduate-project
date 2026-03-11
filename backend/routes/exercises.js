const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exerciseController');
const { verifyToken, isAdmin } = require('../middlewares/auth');

// 获取所有练习题（不需要登录）
router.get('/', exerciseController.getAllExercises);

// 获取所有练习题(不需要登录)
router.get('/all', exerciseController.getAllExercises);

// 按分类获取练习题
router.get('/category', exerciseController.getExercisesByCategory);

// 获取练习历史
router.get('/history', exerciseController.getExerciseHistory);

// 添加练习历史记录
router.post('/history', exerciseController.addExerciseHistory);

// 获取用户练习历史记录
router.get('/history/user', exerciseController.getUserExerciseHistory);

// 获取用户练习统计数据
router.get('/stats', exerciseController.getUserExerciseStats);

// 获取薄弱点分析
router.get('/weakness-analysis', exerciseController.getWeaknessAnalysis);

// 按知识点获取练习题
router.get('/knowledge-point/:knowledgePoint', exerciseController.getExercisesByKnowledgePoint);

// 按类型获取练习题
router.get('/type/:type', exerciseController.getExercisesByType);

// 管理员API - 创建新练习题
router.post('/', verifyToken, isAdmin, exerciseController.createExercise);

// 管理员API - 批量导入练习题
router.post('/bulk-import', verifyToken, isAdmin, exerciseController.bulkImportExercises);

// 获取练习题详情
router.get('/:id', exerciseController.getExercise);

// 提交练习题答案
router.post('/:id/submit', exerciseController.submitExercise);

// 管理员API - 更新练习题
router.put('/:id', verifyToken, isAdmin, exerciseController.updateExercise);

// 管理员API - 删除练习题
router.delete('/:id', verifyToken, isAdmin, exerciseController.deleteExercise);

// 提交练习记录
router.post('/history', exerciseController.submitExerciseRecord);

module.exports = router; 