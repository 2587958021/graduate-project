import axios from './api';

/**
 * 获取课程列表
 * @param {Object} params - 查询参数
 * @param {string} [params.category] - 课程分类
 * @param {string} [params.level] - 难度等级
 * @param {string} [params.tag] - 标签筛选
 * @param {string} [params.search] - 搜索关键词
 * @param {number} [params.page=1] - 页码
 * @param {number} [params.limit=10] - 每页数量
 * @returns {Promise<Object>} 课程列表数据
 */
export const getCourses = async (params = {}) => {
  try {
    console.log('调用获取课程列表API，参数:', params);
    const response = await axios.get('/courses', { params });
    console.log('获取课程列表成功，响应:', response.data);
    return response;
  } catch (error) {
    console.error('获取课程列表失败:', error);
    if (error.response) {
      console.error('错误响应:', error.response.data);
    }
    throw error;
  }
};

/**
 * 获取推荐课程
 * @param {number} [limit=3] - 获取数量
 * @returns {Promise<Object>} 推荐课程列表数据
 */
export const getRecommendedCourses = async (limit = 3) => {
  try {
    console.log('获取推荐课程，数量:', limit);
    const response = await axios.get('/courses', { 
      params: { 
        limit: limit,
        sort: 'newest'
      } 
    });
    console.log('获取推荐课程成功:', response.data);
    return response;
  } catch (error) {
    console.error('获取推荐课程失败:', error);
    throw error;
  }
};

/**
 * 获取课程详情
 * @param {string} id - 课程ID
 * @returns {Promise<Object>} 课程详情数据
 */
export const getCourseDetails = async (id) => {
  try {
    console.log(`调用获取课程详情API，ID: ${id}`);
    const response = await axios.get(`/courses/${id}`);
    console.log(`获取课程详情成功，ID: ${id}`);
    return response;
  } catch (error) {
    console.error(`获取课程详情失败，ID: ${id}`, error);
    if (error.response) {
      console.error('错误响应:', error.response.data);
    }
    throw error;
  }
};

/**
 * 获取课程章节
 * @param {string} courseId - 课程ID
 * @returns {Promise<Object>} 课程章节数据
 */
export const getCourseChapters = async (courseId) => {
  try {
    console.log(`调用获取课程章节API，课程ID: ${courseId}`);
    const response = await axios.get(`/courses/${courseId}/chapters`);
    console.log(`获取课程章节成功，课程ID: ${courseId}`);
    return response;
  } catch (error) {
    console.error(`获取课程章节失败，课程ID: ${courseId}`, error);
    if (error.response) {
      console.error('错误响应:', error.response.data);
    }
    throw error;
  }
};

/**
 * 获取课时详情
 * @param {string} courseId - 课程ID
 * @param {string} chapterId - 章节ID
 * @param {string} lessonId - 课时ID
 * @returns {Promise<Object>} 课时详情数据
 */
export const getLessonDetails = (courseId, chapterId, lessonId) => {
  return axios.get(`/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`);
};

/**
 * 获取课程分类
 * @returns {Promise<Object>} 课程分类数据
 */
export const getCourseCategories = () => {
  return axios.get('/courses/categories');
};

// 管理员接口

/**
 * 获取所有课程（包括未发布的）
 * @param {Object} params - 查询参数
 * @param {number} [params.page=1] - 页码
 * @param {number} [params.limit=10] - 每页数量
 * @returns {Promise<Object>} 课程列表数据
 */
export const getAllCourses = (params = {}) => {
  return axios.get('/courses/admin/all', { params });
};

/**
 * 创建新课程
 * @param {Object} courseData - 课程数据
 * @returns {Promise<Object>} 创建结果
 */
export const createCourse = (courseData) => {
  return axios.post('/courses', courseData);
};

/**
 * 更新课程
 * @param {string} id - 课程ID
 * @param {Object} courseData - 课程数据
 * @returns {Promise<Object>} 更新结果
 */
export const updateCourse = (id, courseData) => {
  return axios.put(`/courses/${id}`, courseData);
};

/**
 * 删除课程
 * @param {string} id - 课程ID
 * @returns {Promise<Object>} 删除结果
 */
export const deleteCourse = (id) => {
  return axios.delete(`/courses/${id}`);
};

/**
 * 添加章节
 * @param {string} courseId - 课程ID
 * @param {Object} chapterData - 章节数据
 * @returns {Promise<Object>} 添加结果
 */
export const addChapter = (courseId, chapterData) => {
  return axios.post(`/courses/${courseId}/chapters`, chapterData);
};

/**
 * 添加课时
 * @param {string} courseId - 课程ID
 * @param {string} chapterId - 章节ID
 * @param {Object} lessonData - 课时数据
 * @returns {Promise<Object>} 添加结果
 */
export const addLesson = (courseId, chapterId, lessonData) => {
  return axios.post(`/courses/${courseId}/chapters/${chapterId}/lessons`, lessonData);
};

/**
 * 通过B站视频链接快速创建课程
 * @param {Object} data - 课程数据
 * @param {string} data.videoUrl - B站视频链接
 * @param {string} [data.coverImage] - 课程封面图片URL
 * @param {string} [data.category='其他'] - 课程分类
 * @param {string} [data.level='初级'] - 难度等级
 * @param {boolean} [data.isPublished=false] - 是否直接发布课程
 * @returns {Promise<Object>} 创建结果
 */
export const quickCreateCourse = (data) => {
  return axios.post('/courses/quick-create', data);
};

/**
 * 批量导入B站视频创建多个课程
 * @param {Object} data - 批量创建数据
 * @param {Array<string>} data.videoUrls - B站视频链接数组
 * @param {string} [data.category='其他'] - 课程分类
 * @param {string} [data.level='初级'] - 难度等级
 * @param {boolean} [data.isPublished=false] - 是否直接发布课程
 * @returns {Promise<Object>} 批量创建结果
 */
export const batchCreateCourses = (data) => {
  return axios.post('/courses/batch-create', data);
};

/**
 * 清理重复课程（根据课程标题去重）
 * @returns {Promise<Object>} 清理结果
 */
export const cleanDuplicateCourses = () => {
  return axios.post('/courses/admin/clean-duplicates');
};

/**
 * 获取B站视频信息（标题、封面等）
 * @param {string} videoUrl - B站视频链接
 * @returns {Promise<Object>} 视频信息
 */
export const getVideoInfo = async (videoUrl) => {
  try {
    console.log('获取视频信息，URL:', videoUrl);
    const response = await axios.get('/courses/video-info', { params: { videoUrl } });
    console.log('获取视频信息成功:', response.data);
    return response;
  } catch (error) {
    console.error('获取视频信息失败:', error);
    throw error;
  }
}; 