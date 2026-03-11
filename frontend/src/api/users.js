import api from './api';
import axios from 'axios';

// 管理员：获取所有用户
const getAllUsers = async (params = {}) => {
  try {
    const response = await api.get('/users/admin/all', { params });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return {
      success: false,
      message: error.response?.data?.message || '获取用户列表失败',
      error
    };
  }
};

// 管理员：获取单个用户详情
const getUserDetails = async (userId) => {
  try {
    const response = await api.get(`/users/admin/details/${userId}`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('获取用户详情失败:', error);
    return {
      success: false,
      message: error.response?.data?.message || '获取用户详情失败',
      error
    };
  }
};

// 管理员：更新用户角色和状态
const updateUser = async (userId, userData) => {
  try {
    console.log(`开始更新用户 ${userId}:`, userData);
    
    const response = await api.put(
      `/users/admin/users/${userId}`,
      userData
    );
    
    console.log('用户更新响应:', response.data);
    
    return {
      success: true,
      data: response.data.data,
      message: '用户更新成功'
    };
  } catch (error) {
    console.error('更新用户失败:', error);
    return {
      success: false,
      message: error.response?.data?.message || '更新用户失败',
      error
    };
  }
};

// 普通用户：更新当前用户个人资料
const updateProfile = async (userData) => {
  try {
    const response = await api.put('/users/profile', userData);
    return {
      success: true,
      data: response.data.data,
      message: '个人资料更新成功'
    };
  } catch (error) {
    console.error('更新个人资料失败:', error);
    return {
      success: false,
      message: error.response?.data?.message || '更新个人资料失败',
      error
    };
  }
};

// 普通用户：上传头像
const uploadAvatar = async (formData) => {
  try {
    console.log('开始上传头像...');
    const response = await api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('头像上传响应:', response);
    
    // 检查响应格式
    if (response && response.success === true) {
      return {
        success: true,
        data: response.data,
        message: response.message || '头像上传成功'
      };
    } else {
      // 如果响应格式不符合预期，尝试兼容处理
      return {
        success: true,
        data: response,
        message: '头像上传成功'
      };
    }
  } catch (error) {
    console.error('上传头像失败:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || '上传头像失败',
      error
    };
  }
};

// 获取管理统计数据
export const getAdminStatistics = async () => {
  try {
    const response = await api.get('/users/admin/statistics');
    return response.data;
  } catch (error) {
    console.error('获取管理统计数据失败:', error);
    throw error;
  }
};

export default {
  getAllUsers,
  getUserDetails,
  updateUser,
  updateProfile,
  uploadAvatar
}; 