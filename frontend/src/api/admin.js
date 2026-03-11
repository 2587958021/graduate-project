import api from './api';

/**
 * 获取系统统计数据
 * @returns {Promise} 系统统计数据
 */
const getSystemStats = async () => {
  try {
    console.log('正在获取系统统计数据...');
    const token = localStorage.getItem('token');
    console.log('使用token获取数据:', token ? '已获取token' : '无token');
    
    const response = await api.get('/admin/stats');
    
    console.log('获取系统统计数据成功:', response);
    return response;
  } catch (error) {
    console.error('获取系统统计数据失败', error);
    console.error('错误详情:', error.response ? error.response.data : error.message);
    // 返回一个错误对象而不是抛出异常，让调用者处理
    return {
      success: false,
      message: error.message || '获取系统统计数据失败',
      error: error
    };
  }
};

/**
 * 刷新系统统计数据
 * @returns {Promise} 刷新后的系统统计数据
 */
const refreshSystemStats = async () => {
  try {
    console.log('正在刷新系统统计数据...');
    const token = localStorage.getItem('token');
    console.log('使用token刷新数据:', token ? '已获取token' : '无token');
    
    const response = await api.get(`/admin/stats?refresh=true&t=${Date.now()}`);
    
    console.log('刷新系统统计数据成功:', response);
    return response;
  } catch (error) {
    console.error('刷新系统统计数据失败', error);
    console.error('错误详情:', error.response ? error.response.data : error.message);
    // 返回一个错误对象而不是抛出异常，让调用者处理
    return {
      success: false,
      message: error.message || '刷新系统统计数据失败',
      error: error
    };
  }
};

export default {
  getSystemStats,
  refreshSystemStats
}; 