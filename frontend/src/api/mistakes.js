import api from './api';

// 错题本相关的API服务
const mistakesAPI = {
    // 获取用户错题列表
    getMistakes: async (params = {}) => {
        try {
            // 获取用户ID
            const userInfo = localStorage.getItem('user');
            let userId = null;
            if (userInfo) {
                try {
                    const user = JSON.parse(userInfo);
                    userId = user._id || user.id;
                    // 确保用户ID格式正确，去掉可能的'user_'前缀
                    if (userId && userId.startsWith('user_')) {
                        userId = userId.substring(5);
                    }
                } catch (err) {
                    console.warn('无法解析用户信息', err);
                }
            }
            
            // 如果没有用户ID，使用默认ID
            if (!userId) {
                userId = '1748618904860';
            }
            
            // 将用户ID添加到参数中
            const requestParams = { ...params, userId };
            
            console.log('调用获取错题列表API，参数:', requestParams);
            const response = await api.get('/mistakes', { params: requestParams });
            console.log('获取错题列表成功, 原始响应:', response);
            
            // 确保返回标准格式的响应
            if (response && response.success && Array.isArray(response.data)) {
                // 已经是标准格式 { success: true, data: [...] }
                return response;
            } else if (response && Array.isArray(response)) {
                // 直接返回数组的情况
                return {
                    success: true,
                    data: response
                };
            } else {
                // 其他情况，直接返回
                return response;
            }
        } catch (error) {
            console.error('获取错题列表API错误:', error);
            if (error.response) {
                console.error('错误响应:', error.response.data);
            }
            throw error;
        }
    },

    // 添加题目到错题本
    addToMistakes: async (exerciseId, note, userAnswer) => {
        try {
            // 获取用户ID
            const userInfo = localStorage.getItem('user');
            let userId = null;
            if (userInfo) {
                try {
                    const user = JSON.parse(userInfo);
                    userId = user._id || user.id;
                    // 确保用户ID格式正确，去掉可能的'user_'前缀
                    if (userId && userId.startsWith('user_')) {
                        userId = userId.substring(5);
                    }
                } catch (err) {
                    console.warn('无法解析用户信息', err);
                }
            }
            
            // 如果没有用户ID，使用默认ID
            if (!userId) {
                userId = '1748618904860';
            }
            
            console.log('调用添加错题API，参数:', { exerciseId, note, userAnswer, userId });
            const response = await api.post('/mistakes', { exerciseId, note, userAnswer, userId });
            console.log('添加错题成功, 响应:', response.data);
            return response;
        } catch (error) {
            console.error('添加错题API错误:', error);
            if (error.response) {
                console.error('错误响应:', error.response.data);
            }
            throw error;
        }
    },

    // 从错题本移除题目
    removeFromMistakes: async (mistakeId) => {
        try {
            // 获取用户ID
            const userInfo = localStorage.getItem('user');
            let userId = null;
            if (userInfo) {
                try {
                    const user = JSON.parse(userInfo);
                    userId = user._id || user.id;
                    // 确保用户ID格式正确，去掉可能的'user_'前缀
                    if (userId && userId.startsWith('user_')) {
                        userId = userId.substring(5);
                    }
                } catch (err) {
                    console.warn('无法解析用户信息', err);
                }
            }
            
            // 如果没有用户ID，使用默认ID
            if (!userId) {
                userId = '1748618904860';
            }
            
            console.log(`调用移除错题API，ID: ${mistakeId}，用户ID: ${userId}`);
            // 添加userId作为查询参数
            const response = await api.delete(`/mistakes/${mistakeId}?userId=${userId}`);
            console.log('移除错题成功:', response.data);
            return response;
        } catch (error) {
            console.error(`移除错题API错误(ID:${mistakeId}):`, error);
            if (error.response) {
                console.error('错误响应:', error.response.data);
            }
            throw error;
        }
    },

    // 更新错题状态（已掌握/未掌握）
    updateMistakeStatus: async (mistakeId, data) => {
        try {
            console.log(`调用更新错题状态API，ID: ${mistakeId}，数据:`, data);
            const response = await api.patch(`/mistakes/${mistakeId}`, data);
            console.log('更新错题状态成功:', response.data);
            return response;
        } catch (error) {
            console.error(`更新错题状态API错误(ID:${mistakeId}):`, error);
            if (error.response) {
                console.error('错误响应:', error.response.data);
            }
            throw error;
        }
    },

    // 更新错题笔记
    updateMistakeNote: async (mistakeId, data) => {
        try {
            console.log(`调用更新错题笔记API，ID: ${mistakeId}，数据:`, data);
            const response = await api.put(`/mistakes/${mistakeId}/note`, data);
            console.log('更新错题笔记成功:', response.data);
            return response;
        } catch (error) {
            console.error(`更新错题笔记API错误(ID:${mistakeId}):`, error);
            if (error.response) {
                console.error('错误响应:', error.response.data);
            }
            throw error;
        }
    },

    // 获取错题统计信息
    getMistakeStats: async () => {
        try {
            console.log('调用获取错题统计API');
            const response = await api.get('/mistakes/stats');
            console.log('获取错题统计成功:', response.data);
            return response;
        } catch (error) {
            console.error('获取错题统计API错误:', error);
            if (error.response) {
                console.error('错误响应:', error.response.data);
            }
            throw error;
        }
    },

    // 兼容旧方法名
    getUserMistakes: async (params = {}) => {
        return mistakesAPI.getMistakes(params);
    },
    
    // 添加错题 (新增方法，直接添加一个完整的错题对象)
    addMistake: async (mistakeData) => {
        try {
            console.log('直接添加错题，数据:', mistakeData);
            const response = await api.post('/mistakes', mistakeData);
            console.log('添加错题成功:', response.data);
            return response.data;
        } catch (error) {
            console.error('添加错题失败:', error);
            throw error;
        }
    },
    
    // 直接移除错题 (新增方法，为了与ServerStorageManager接口一致)
    removeMistake: async (id) => {
        try {
            return await mistakesAPI.removeFromMistakes(id);
        } catch (error) {
            console.error('移除错题失败:', error);
            throw error;
        }
    }
};

// 导出解构方法，方便按需导入
export const {
    getMistakes,
    addToMistakes,
    removeFromMistakes,
    updateMistakeStatus,
    updateMistakeNote,
    getMistakeStats,
    getUserMistakes,
    addMistake,
    removeMistake
} = mistakesAPI;

// 默认导出整个API对象
export default mistakesAPI; 