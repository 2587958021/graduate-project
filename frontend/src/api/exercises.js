import api from './api';
import axios from 'axios';

// 练习题相关的API服务
// 获取所有练习题
export const getExercises = async (params = {}) => {
  try {
    // 确保默认获取大数量的题目，足以显示所有后端数据
    const requestParams = { ...params, limit: params.limit || 1000 };
    console.log('调用获取所有练习题API，参数:', requestParams);
    const response = await api.get('/exercises', { params: requestParams });
    console.log('获取练习题原始响应:', response);
    console.log('响应类型:', typeof response);
    console.log('响应结构:', Object.keys(response));
    
    // 检查响应数据结构
    if (response && response.data && Array.isArray(response.data)) {
      console.log('获取练习题成功(数组形式)，数量:', response.data.length);
      return response;
    } else if (response && response.data && Array.isArray(response.data.data)) {
      // 如果响应格式是 { success: true, data: [...] }
      console.log('获取练习题成功(嵌套数据)，数量:', response.data.data.length);
      return response;
    } else if (response && Array.isArray(response)) {
      // 如果响应直接是数组
      console.log('获取练习题成功(直接数组)，数量:', response.length);
      return { data: response };
    } else if (response && response.success && Array.isArray(response.data)) {
      // 标准格式 { success: true, data: [...] }
      console.log('获取练习题成功(标准格式)，数量:', response.data.length);
      return { data: response.data };
    } else {
      console.warn('响应格式不符合预期:', response);
      console.warn('JSON字符串:', JSON.stringify(response));
      return { data: [] };
    }
  } catch (error) {
    console.error('获取所有练习题API错误:', error);
    console.error('错误详情:', error.response || error.message);
    throw error;
  }
};

// 获取单个练习题
export const getExercise = async (id) => {
  try {
    console.log(`正在请求练习题(ID: ${id})`);
    const response = await api.get(`/exercises/${id}`);
    console.log(`成功获取练习题(ID: ${id}):`, response.data);
    
    // 确保返回的数据格式正确
    if (response.data && response.data.success) {
      // 标准格式: { success: true, data: {...} }
      return response;
    } else if (response.data && typeof response.data === 'object') {
      // 直接返回对象作为数据
      console.log(`练习题(ID: ${id})格式不标准，进行转换`);
      return { data: response.data };
    } else {
      console.error(`练习题(ID: ${id})返回格式异常:`, response.data);
      throw new Error('返回数据格式不正确');
    }
  } catch (error) {
    console.error(`获取练习题(ID: ${id})错误:`, error);
    throw error;
  }
};

// 按分类获取练习题
export const getExercisesByCategory = async (category, limit = 0) => {
  try {
    const params = { category };
    if (limit > 0) {
      params.limit = limit;
    }
    const response = await api.get('/exercises/category', { params });
    return response;
  } catch (error) {
    console.error(`获取分类(${category})练习题错误:`, error);
    throw error;
  }
};

// 按知识点获取练习题
export const getExercisesByKnowledgePoint = async (knowledgePoint, params = {}) => {
  try {
    const response = await api.get(`/exercises/knowledge-point/${knowledgePoint}`, { params });
    return response;
  } catch (error) {
    console.error(`获取知识点(${knowledgePoint})练习题错误:`, error);
    throw error;
  }
};

// 按类型获取练习题
export const getExercisesByType = async (type, params = {}) => {
  try {
    const response = await api.get(`/exercises/type/${type}`, { params });
    return response;
  } catch (error) {
    console.error(`获取类型(${type})练习题错误:`, error);
    throw error;
  }
};

// 提交练习答案
export const submitExercise = async (exerciseId, answer, exerciseData = {}) => {
  try {
    console.log('提交练习答案:', { exerciseId, answer, exerciseData });
    
    // 添加时间戳参数，防止缓存
    const timestamp = new Date().getTime();
    
    // 提交答案到练习API
    const response = await api.post(`/exercises/${exerciseId}/submit?_t=${timestamp}`, { 
      answer,
      knowledgePoint: exerciseData.knowledgePoint || '',
      exerciseType: exerciseData.type || '',
      forceRefresh: true
    });
    
    // 如果提交成功并且返回了isCorrect信息
    if (response && response.success) {
      const result = response.data;
      
      // 确保有isCorrect字段
      if (result && typeof result.isCorrect === 'boolean') {
        // 直接提交练习记录到服务器，用于统计分析
        try {
          // 创建练习记录对象
          const exerciseRecord = {
            exerciseId,
            userAnswer: answer,
            correctAnswer: result.correctAnswer,
            isCorrect: result.isCorrect,
            exerciseType: exerciseData.type || 'unknown',
            knowledgePoint: exerciseData.knowledgePoint || 'unknown',
            title: exerciseData.title || '',
            content: exerciseData.content || '',
            options: exerciseData.options || [],
            timestamp: new Date().toISOString(),
            _t: timestamp
          };
          
          // 调用API保存练习记录
          await api.post('/exercises/history?_t=' + timestamp, exerciseRecord);
          
          // 强制刷新统计数据
          try {
            await api.get('/exercises/stats?_t=' + timestamp + '&forceRefresh=true');
            console.log('统计数据已强制刷新');
          } catch (err) {
            console.error('强制刷新统计数据失败', err);
          }
          
          // 发布自定义事件，通知其他组件更新数据
          const exerciseUpdateEvent = new CustomEvent('exercise-updated', {
            detail: {
              exerciseId,
              isCorrect: result.isCorrect,
              timestamp: new Date().toISOString(),
              forceRefresh: true
            }
          });
          window.dispatchEvent(exerciseUpdateEvent);
          
          console.log('练习记录已保存，并触发更新事件');
        } catch (err) {
          console.error('提交练习记录到服务器失败', err);
        }
      }
    }
    
    return response;
  } catch (error) {
    console.error('提交练习答案失败:', error);
    throw error;
  }
};

// 获取用户练习历史记录
export const getUserExerciseHistory = async (params = {}) => {
  try {
    console.log('调用获取用户练习历史API，参数:', params);
    const response = await api.get('/exercises/history/user', { params });
    console.log('API返回的历史记录原始数据:', response);
    
    // 处理不同的响应格式
    if (response && response.data) {
      if (response.data.success && response.data.data) {
        // 标准格式 { success: true, data: [...] }
        console.log('标准格式响应，数据条数:', response.data.data.length);
        return {
          ...response.data,
          data: response.data.data
        };
      } else if (Array.isArray(response.data)) {
        // 直接返回数组
        console.log('数组格式响应，数据条数:', response.data.length);
        return {
          success: true,
          data: response.data,
          stats: response.stats || null,
          currentPage: response.currentPage || 1,
          totalPages: response.totalPages || 1
        };
      } else {
        // 其他格式，直接返回
        console.log('其他格式响应:', response.data);
        return response.data;
      }
    } else {
      console.warn('API响应格式异常:', response);
      return {
        success: false,
        data: [],
        stats: null,
        currentPage: 1,
        totalPages: 1
      };
    }
  } catch (error) {
    console.error('获取用户练习历史记录失败:', error);
    throw error;
  }
};

// 获取所有练习历史记录
export const getExerciseHistory = async (params = {}) => {
  try {
    const response = await api.get('/exercises/history', { params });
    return response.data;
  } catch (error) {
    console.error('获取练习历史记录失败:', error);
    throw error;
  }
};

// 删除单条练习历史记录
export const deleteExerciseHistory = async (id) => {
  try {
    const response = await api.delete(`/exercises/history/${id}`);
    return response.data;
  } catch (error) {
    console.error(`删除练习历史记录失败(ID: ${id}):`, error);
    throw error;
  }
};

// 清空所有练习历史记录
export const clearAllExerciseHistory = async () => {
  try {
    const response = await api.delete('/exercises/history/all');
    return response.data;
  } catch (error) {
    console.error('清空所有练习历史记录失败:', error);
    throw error;
  }
};

// 清除无效的练习历史记录
export const clearInvalidExerciseHistory = async () => {
  try {
    const response = await api.delete('/exercises/history/invalid');
    return response.data;
  } catch (error) {
    console.error('清除无效练习历史记录失败:', error);
    throw error;
  }
};

// 获取单个练习题的详细信息
export const getExerciseDetails = async (id) => {
  try {
    console.log(`正在请求练习题详情(ID: ${id})`);
    const response = await api.get(`/exercises/${id}`);
    console.log(`成功获取练习题详情(ID: ${id}):`, response);
    return response;
  } catch (error) {
    console.error(`获取练习题详情失败(ID: ${id}):`, error);
    throw error;
  }
};

// 获取所有练习题
const getAllExercises = async (params = {}) => {
  try {
    const response = await api.get('/exercises', { params });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('获取练习题列表失败:', error);
    return {
      success: false,
      message: error.response?.data?.message || '获取练习题列表失败',
      error
    };
  }
};

// 获取单个练习题
export const getExerciseById = async (id) => {
  try {
    const response = await api.get(`/exercises/${id}`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('获取练习题详情失败:', error);
    return {
      success: false,
      message: error.response?.data?.message || '获取练习题详情失败',
      error
    };
  }
};

// 创建练习题
const createExercise = async (exerciseData) => {
  try {
    const response = await api.post('/exercises', exerciseData);
    return {
      success: true,
      data: response.data.data,
      message: '练习题创建成功'
    };
  } catch (error) {
    console.error('创建练习题失败:', error);
    return {
      success: false,
      message: error.response?.data?.message || '创建练习题失败',
      error
    };
  }
};

// 更新练习题
const updateExercise = async (id, exerciseData) => {
  try {
    const response = await api.put(`/exercises/${id}`, exerciseData);
    return {
      success: true,
      data: response.data.data,
      message: '练习题更新成功'
    };
  } catch (error) {
    console.error('更新练习题失败:', error);
    return {
      success: false,
      message: error.response?.data?.message || '更新练习题失败',
      error
    };
  }
};

// 删除练习题
const deleteExercise = async (id) => {
  try {
    const response = await api.delete(`/exercises/${id}`);
    return {
      success: true,
      data: response.data.data,
      message: '练习题删除成功'
    };
  } catch (error) {
    console.error('删除练习题失败:', error);
    return {
      success: false,
      message: error.response?.data?.message || '删除练习题失败',
      error
    };
  }
};

// 随机获取练习题
const getRandomExercises = async (params = {}) => {
  try {
    const response = await api.get('/exercises/random', { params });
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('获取随机练习题失败:', error);
    return {
      success: false,
      message: error.response?.data?.message || '获取随机练习题失败',
      error
    };
  }
};

// 提交练习题答案
const submitExerciseAnswer = async (exerciseId, answer) => {
  try {
    const response = await api.post(`/exercises/${exerciseId}/answer`, { answer });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
      isCorrect: response.data.isCorrect
    };
  } catch (error) {
    console.error('提交答案失败:', error);
    return {
      success: false,
      message: error.response?.data?.message || '提交答案失败',
      error
    };
  }
};

/**
 * 获取用户练习统计数据
 * @param {Object} params - 请求参数
 * @returns {Promise} - 请求Promise
 */
export const getUserExerciseStats = async (params = {}) => {
  try {
    const response = await api.get('/exercises/stats', { params });
    
    // 处理不同格式的响应数据
    if (response && response.data && response.data.success) {
      // 标准格式：{ success: true, data: {...} }
      return response.data;
    } else if (response && response.data) {
      // 直接返回数据对象
      return {
        success: true,
        data: response.data
      };
    } else if (response && response.success) {
      // 已经是标准格式
      return response;
    } else {
      // 返回默认数据
      return {
        success: false,
        message: '无法获取练习统计数据',
        data: {
          total: 0,
          correct: 0,
          correctRate: 0,
          typeDistribution: []
        }
      };
    }
  } catch (error) {
    return {
      success: false,
      message: '获取练习统计数据失败',
      data: {
        total: 0,
        correct: 0,
        correctRate: 0,
        typeDistribution: []
      }
    };
  }
};

/**
 * 获取推荐练习
 * @param {number} [limit=3] - 获取数量
 * @returns {Promise<Object>} 推荐练习列表数据
 */
export const getRecommendedExercises = async (limit = 3) => {
  try {
    const response = await axios.get('/exercises', { 
      params: { 
        limit: limit
      } 
    });
    return response.data;
  } catch (error) {
    console.error('获取推荐练习失败:', error);
    throw error;
  }
};

// 同时导出整个API对象
const exercisesAPI = {
  getExercises,
  getExercise,
  getExercisesByCategory,
  getExercisesByKnowledgePoint,
  getExercisesByType,
  submitExercise,
  getUserExerciseHistory,
  getExerciseHistory,
  getAllExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
  getRandomExercises,
  submitExerciseAnswer,
  getExerciseDetails,
  getUserExerciseStats
};

export default exercisesAPI; 