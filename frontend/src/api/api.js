import axios from 'axios';
import { useAuthStore } from '../store/auth';
import { ElMessage } from 'element-plus';

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    
    // 如果存在token，则添加到请求头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('发送请求:', config.method.toUpperCase(), config.url, config.data);
    return config;
  },
  error => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  response => {
    console.log('收到响应:', response.status, response.data);
    return response.data;
  },
  error => {
    console.error('响应错误:', error.response?.status, error.response?.data);
    
    // 处理401错误（未授权）
    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore();
      
      // 清除认证状态
      authStore.logout();
      
      ElMessage.error('登录已过期，请重新登录');
    }
    
    return Promise.reject(error);
  }
);

export default api; 