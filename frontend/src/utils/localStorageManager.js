import exercisesApi from '@/api/exercises';
import mistakesApi from '@/api/mistakes';
import { ElMessage } from 'element-plus';

/**
 * 服务器存储管理工具
 * 用于直接与服务器API交互，完全移除本地存储
 */
class ServerStorageManager {
  /**
   * 获取练习历史
   * @returns {Promise<Array>} 练习历史数组
   */
  static async getExerciseHistory() {
    try {
      const response = await exercisesApi.getExerciseHistory();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('获取练习历史失败:', error);
      return [];
    }
  }

  /**
   * 保存练习记录
   * @param {Object} exerciseRecord - 练习记录
   * @returns {Promise<boolean>} 保存结果
   */
  static async saveExerciseRecord(exerciseRecord) {
    try {
      if (!exerciseRecord) return false;
      
      // 直接调用API保存练习记录
      const response = await exercisesApi.submitExerciseRecord(exerciseRecord);
      return response.success;
    } catch (error) {
      console.error('保存练习记录失败:', error);
      ElMessage.error('保存练习记录失败，请稍后再试');
      return false;
    }
  }

  /**
   * 获取错题本
   * @returns {Promise<Array>} 错题本数组
   */
  static async getMistakes() {
    try {
      const response = await mistakesApi.getUserMistakes();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('获取错题本失败:', error);
      return [];
    }
  }

  /**
   * 保存错题
   * @param {Object} mistake - 错题记录
   * @returns {Promise<boolean>} 保存结果
   */
  static async saveMistake(mistake) {
    try {
      if (!mistake) return false;
      
      // 直接调用API保存错题
      const response = await mistakesApi.addMistake(mistake);
      return response.success;
    } catch (error) {
      console.error('保存错题失败:', error);
      ElMessage.error('保存错题失败，请稍后再试');
      return false;
    }
  }

  /**
   * 从错题本中删除错题
   * @param {String} id - 错题ID或练习题ID
   * @returns {Promise<boolean>} 删除结果
   */
  static async removeMistake(id) {
    try {
      if (!id) return false;
      
      // 直接调用API删除错题
      const response = await mistakesApi.removeMistake(id);
      return response.success;
    } catch (error) {
      console.error('删除错题失败:', error);
      return false;
    }
  }

  /**
   * 保持接口兼容，但已无实际功能
   * @returns {Promise<Object>} 同步结果
   */
  static async syncToServer() {
    console.log('不再需要同步，所有数据已直接保存到服务器');
    return { 
      success: true, 
      message: '所有数据已直接保存到服务器' 
    };
  }
}

// 导出服务器存储管理器，使用与原本相同的导出名
export default ServerStorageManager; 