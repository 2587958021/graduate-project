import { defineStore } from 'pinia';
import api from '../api/api';
import router from '../router';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        token: localStorage.getItem('token') || null,
        isAuthenticated: !!localStorage.getItem('token'),
        loading: false,
        error: null
    }),

    getters: {
        // 获取用户ID
        userId: (state) => state.user?.id || state.user?._id || null,
        
        // 获取用户名
        username: (state) => state.user?.username || '游客',
        
        // 判断是否为管理员
        isAdmin: (state) => state.user?.role === 'admin'
    },

    actions: {
        // 设置认证信息
        setAuth(token, user) {
            this.token = token;
            this.user = user;
            this.isAuthenticated = true;
            
            // 保存用户信息到localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
        },
        
        // 登录
        async login(credentials) {
            try {
                const response = await api.post('/auth/login', credentials);
                
                if (response.success && response.token) {
                    // 保存token和用户信息到localStorage
                    localStorage.setItem('token', response.token);
                    localStorage.setItem('user', JSON.stringify(response.user));
                    
                    // 更新状态
                    this.token = response.token;
                    this.user = response.user;
                    this.isAuthenticated = true;
                    
                    return { success: true };
                } else {
                    return { 
                        success: false, 
                        message: response.message || '登录失败' 
                    };
                }
            } catch (error) {
                return { 
                    success: false, 
                    message: error.response?.data?.message || '登录失败' 
                };
            }
        },
        
        // 注册
        async register(userData) {
            try {
                const response = await api.post('/auth/register', userData);
                
                if (response.success) {
                    return { success: true };
                } else {
                    return { 
                        success: false, 
                        message: response.message || '注册失败' 
                    };
                }
            } catch (error) {
                return { 
                    success: false, 
                    message: error.response?.data?.message || '注册失败' 
                };
            }
        },
        
        // 登出
        logout() {
            // 清除localStorage中的token和用户信息
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // 重置状态
            this.token = null;
            this.user = null;
            this.isAuthenticated = false;
            
            // 跳转到登录页
            if (router.currentRoute.value.meta.requiresAuth) {
                router.push('/login');
            }
        },
        
        // 获取当前用户信息
        async fetchCurrentUser() {
            try {
                if (!this.token) {
                    return { success: false, message: '未找到认证令牌' };
                }
                
                const response = await api.get('/auth/me');
                
                if (response.success && response.user) {
                    this.user = response.user;
                    // 更新localStorage中的用户信息
                    localStorage.setItem('user', JSON.stringify(response.user));
                    return { success: true };
                } else {
                    // 不要立即登出，而是返回错误信息
                    return { 
                        success: false, 
                        message: response.message || '获取用户信息失败'
                    };
                }
            } catch (error) {
                // 检查是否是401错误
                if (error.response && error.response.status === 401) {
                    this.logout();
                    return { 
                        success: false, 
                        message: '登录已过期，请重新登录'
                    };
                }
                
                // 其他错误不触发登出
                console.error('获取用户信息失败:', error);
                return { 
                    success: false, 
                    message: error.response?.data?.message || '获取用户信息失败'
                };
            }
        },

        // 检查是否有管理员权限
        hasAdminRole() {
            return this.user && this.user.role === 'admin';
        }
    }
}); 