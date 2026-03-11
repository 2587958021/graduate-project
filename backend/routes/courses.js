const express = require('express');
const {
  getCourses,
  getCourseDetails,
  getAdminCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getCategories,
  getCategoryStats,
  quickCreateCourse,
  batchCreateCourses,
  cleanDuplicateCourses,
  getCourseChapters,
  getLessonDetails,
  getVideoInfo
} = require('../controllers/courseController');

const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// 获取视频信息 - 放在前面，防止被其他路由拦截
router.get('/video-info', getVideoInfo);

// 课程分类路由
router.route('/categories').get(getCategories);
router.route('/category-stats').get(getCategoryStats);

// 公共路由
router.get('/', getCourses);
router.get('/:id', getCourseDetails);
router.get('/:id/chapters', getCourseChapters);
router.get('/:courseId/chapters/:chapterId/lessons/:lessonId', getLessonDetails);

// 管理员路由
router.get('/admin/all', protect, authorize('admin'), getAdminCourses);
router.post('/', protect, authorize('admin'), createCourse);
router.put('/:id', protect, authorize('admin'), updateCourse);
router.delete('/:id', protect, authorize('admin'), deleteCourse);

// 快速创建课程路由
router.post('/quick-create', protect, authorize('admin'), quickCreateCourse);

// 批量创建课程路由
router.post('/batch-create', protect, authorize('admin'), batchCreateCourses);

// 清理重复课程
router.post('/admin/clean-duplicates', protect, authorize('admin'), cleanDuplicateCourses);

module.exports = router; 