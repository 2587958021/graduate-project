import api from './api';

// 用户认证相关的API服务
const authAPI = {
    // 用户注册
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        if (response.success) {
            localStorage.setItem('token', response.data.token);
        }
        return response;
    },

    // 用户登录
    login: async (credentials) => {
        console.log('发送登录请求:', JSON.stringify(credentials));
        try {
            const response = await api.post('/auth/login', credentials);
            console.log('登录响应:', response);
            
            // 如果登录成功且返回了token，保存到localStorage
            if (response.success && response.data && response.data.token) {
                localStorage.setItem('token', response.data.token);
                console.log('登录成功，已保存token');
            }
            
            return response;
        } catch (error) {
            console.error('登录请求出错:', error);
            throw error;
        }
    },
    
    // 发送重置密码验证码
    sendResetCode: async (data) => {
        return await api.post('/auth/send-reset-code', data);
    },
    
    // 重置密码
    resetPassword: async (data) => {
        return await api.post('/auth/reset-password', data);
    },

    // 获取当前用户信息
    getCurrentUser: async () => {
        try {
            console.log('发送获取用户信息请求...');
            // 检查是否有token
            const token = localStorage.getItem('token');
            console.log('当前token:', token);
            if (!token) {
                console.error('获取用户信息失败: 未找到认证令牌');
                throw new Error('未找到认证令牌');
            }
            
            const response = await api.get('/auth/me');
            console.log('获取用户信息原始响应:', response);
            
            // 直接返回axios响应对象，让调用方处理数据结构
            return response;
        } catch (error) {
            console.error('获取用户信息请求失败:', error);
            throw error;
        }
    },

    // 退出登录
    logout: () => {
        localStorage.removeItem('token');
    },
    
    // 管理员功能：获取所有用户
    getUsers: async (params = {}) => {
        try {
            const response = await api.get('/users', { params });
            return response;
        } catch (error) {
            console.error('获取用户列表失败:', error);
            throw error;
        }
    },
    
    // 管理员功能：更新用户信息
    updateUser: async (userId, userData) => {
        try {
            const response = await api.put(`/users/${userId}`, userData);
            return response;
        } catch (error) {
            console.error('更新用户信息失败:', error);
            throw error;
        }
    },
    
    // 管理员功能：删除用户
    deleteUser: async (userId) => {
        try {
            const response = await api.delete(`/users/${userId}`);
            return response;
        } catch (error) {
            console.error('删除用户失败:', error);
            throw error;
        }
    },

    // 更新用户信息
    updateUserProfile: async (userData) => {
        try {
            const response = await api.put('/auth/update', userData);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // 修改密码
    changePassword: async (passwordData) => {
        try {
            const response = await api.put('/auth/change-password', passwordData);
            return response;
        } catch (error) {
            throw error;
        }
    }
};

export default authAPI; 