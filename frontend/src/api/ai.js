import request from '@/utils/request';
import mistakesAPI from './mistakes';

/**
 * 获取学习薄弱点分析
 * @param {Object} params - 请求参数
 * @param {String} params.timeFrame - 时间范围（all, week, month）
 * @param {Boolean} params.includeMistakes - 是否包含错题本数据（默认true）
 * @returns {Promise} - 请求Promise
 */
export async function getWeaknessAnalysis(params = {}) {
  try {
    // 默认包含错题本数据
    const includeMistakes = params.includeMistakes !== false;
    
    // 构建请求参数
    const requestParams = { ...params };
    
    // 如果需要包含错题本数据，添加相关标记
    if (includeMistakes) {
      requestParams.includeMistakes = true;
    }
    
    console.log('调用AI薄弱点分析API，参数:', requestParams);
    
    return request({
      url: '/ai/weakness-analysis',
      method: 'get',
      params: requestParams
    });
  } catch (error) {
    console.error('获取薄弱点分析失败:', error);
    throw error;
  }
}

/**
 * 获取基于薄弱点的学习建议
 * @param {Object} params - 请求参数
 * @param {String} params.timeFrame - 时间范围（all, week, month）
 * @returns {Promise} - 请求Promise
 */
export function getLearningRecommendations(params = {}) {
  return request({
    url: '/ai/learning-recommendations',
    method: 'get',
    params
  });
}

/**
 * 获取学习资源推荐
 * @param {Object} params - 请求参数
 * @param {String} params.userId - 用户ID
 * @param {Boolean} params.includeWeakPoints - 是否包含薄弱点资源
 * @param {Number} params.limit - 限制返回数量
 * @returns {Promise} - 请求Promise
 */
export function getResourceRecommendations(params = {}) {
  return request({
    url: '/ai/weakness-analysis',
    method: 'get',
    params
  });
}

export default {
  getWeaknessAnalysis,
  getLearningRecommendations,
  getResourceRecommendations
}; 