// 引入axios实例
import axios from '../api/api';

/**
 * 课程相关服务
 */

/**
 * 获取课程列表
 * @param {Object} params - 查询参数
 * @returns {Promise} 课程列表
 */
export const getCourses = async (params = {}) => {
  try {
    const response = await axios.get('/api/courses', { params });
    return response.data;
  } catch (error) {
    console.error('获取课程列表失败', error);
    throw error;
  }
};

/**
 * 获取课程详情
 * @param {string} courseId - 课程ID
 * @returns {Promise} 课程详情
 */
export const getCourseDetail = async (courseId) => {
  try {
    const response = await axios.get(`/api/courses/${courseId}`);
    return response.data;
  } catch (error) {
    console.error('获取课程详情失败', error);
    throw error;
  }
};

/**
 * 获取课程章节列表
 * @param {string} courseId - 课程ID
 * @returns {Promise} 章节列表
 */
export const getCourseChapters = async (courseId) => {
  try {
    const response = await axios.get(`/api/courses/${courseId}/chapters`);
    return response.data;
  } catch (error) {
    console.error('获取课程章节失败', error);
    throw error;
  }
};

/**
 * 获取课时详情
 * @param {string} courseId - 课程ID
 * @param {string} chapterId - 章节ID
 * @param {string} lessonId - 课时ID
 * @returns {Promise} 课时详情
 */
export const getLessonDetail = async (courseId, chapterId, lessonId) => {
  try {
    const response = await axios.get(`/api/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`);
    return response.data;
  } catch (error) {
    console.error('获取课时详情失败', error);
    throw error;
  }
};

/**
 * 更新学习进度
 * @param {string} courseId - 课程ID
 * @param {string} chapterId - 章节ID
 * @param {string} lessonId - 课时ID
 * @param {Object} progressData - 进度数据
 * @returns {Promise} 更新结果
 */
export const updateLessonProgress = async (courseId, chapterId, lessonId, progressData) => {
  try {
    const response = await axios.post(
      `/api/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/progress`, 
      progressData
    );
    return response.data;
  } catch (error) {
    console.error('更新学习进度失败', error);
    throw error;
  }
};

/**
 * 标记课时完成状态
 * @param {string} courseId - 课程ID
 * @param {string} chapterId - 章节ID
 * @param {string} lessonId - 课时ID
 * @param {boolean} completed - 是否完成
 * @returns {Promise} 更新结果
 */
export const markLessonCompleted = async (courseId, chapterId, lessonId, completed = true) => {
  try {
    const response = await axios.post(
      `/api/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/progress`, 
      { completed }
    );
    return response.data;
  } catch (error) {
    console.error('标记课时完成状态失败', error);
    throw error;
  }
};

/**
 * 同步B站视频观看进度
 * @param {string} courseId - 课程ID
 * @param {string} chapterId - 章节ID
 * @param {string} lessonId - 课时ID
 * @param {string} bvid - B站视频ID
 * @param {number} page - 分P编号
 * @param {Object} progress - 进度数据
 * @returns {Promise} 同步结果
 */
export const syncBilibiliProgress = async (courseId, chapterId, lessonId, bvid, page, progress) => {
  try {
    const response = await axios.post(
      `/api/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/bilibili-progress`,
      {
        bvid,
        page,
        currentTime: progress.currentTime,
        duration: progress.duration,
        percentage: progress.percentage
      }
    );
    return response.data;
  } catch (error) {
    console.error('同步B站进度失败', error);
    // 静默失败，不抛出异常
    return { success: false, error: error.message };
  }
};

/**
 * 获取用户的B站观看记录
 * @param {string} courseId - 可选，课程ID
 * @returns {Promise} 观看记录列表
 */
export const getBilibiliWatchRecords = async (courseId = null) => {
  try {
    const url = courseId
      ? `/api/user/bilibili-watch-records?courseId=${courseId}`
      : '/api/user/bilibili-watch-records';
    
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('获取B站观看记录失败', error);
    return { success: false, data: [], error: error.message };
  }
};

/**
 * 获取课程学习统计数据
 * @param {string} courseId - 课程ID
 * @returns {Promise} 统计数据
 */
export const getCourseStats = async (courseId) => {
  try {
    const response = await axios.get(`/api/courses/${courseId}/stats`);
    return response.data;
  } catch (error) {
    console.error('获取课程统计数据失败', error);
    throw error;
  }
}; 