import api from './api';

/**
 * 分析薄弱知识点
 * @param {Object} params - 请求参数
 * @param {String} params.timeframe - 时间范围（all, week, month）
 * @param {Boolean} params.includeMistakes - 是否包含错题本数据（默认true）
 * @returns {Promise} - 请求Promise
 */
export const analyzeWeakPoints = async (params = {}) => {
  try {
    // 默认包含错题本数据
    const includeMistakes = params.includeMistakes !== false;
    
    // 构建请求参数
    const requestParams = { ...params };
    
    // 如果需要包含错题本数据，添加相关标记
    if (includeMistakes) {
      requestParams.includeMistakes = true;
    }
    
    const response = await api.get('/learning-analysis/weak-points', { params: requestParams });
    
    if (!response.data) {
      return {
        success: false,
        message: '无法获取薄弱点分析数据',
        data: {
          weakKnowledgePoints: [],
          weakExerciseTypes: [],
          summary: {
            totalExercises: 0,
            totalMistakes: 0
          }
        }
      };
    }
    
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: '分析薄弱知识点失败',
      data: {
        weakKnowledgePoints: [],
        weakExerciseTypes: [],
        summary: {
          totalExercises: 0,
          totalMistakes: 0
        }
      }
    };
  }
};

export default {
  analyzeWeakPoints
}; 