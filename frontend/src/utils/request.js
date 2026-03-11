import axios from 'axios';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/store/auth';

// 创建axios实例
const service = axios.create({
  baseURL: '/api', // 设置API基础URL
  timeout: 15000, // 请求超时时间
  withCredentials: true // 允许携带cookie
});

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 在发送请求之前做些什么
    const authStore = useAuthStore();
    if (authStore.token) {
      // 让每个请求携带token
      config.headers['Authorization'] = `Bearer ${authStore.token}`;
    }
    return config;
  },
  error => {
    // 对请求错误做些什么
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  response => {
    // 对响应数据做点什么
    const res = response.data;
    
    // 如果响应成功但业务状态码表示失败
    if (res.code && res.code !== 200 && res.code !== 0) {
      ElMessage({
        message: res.message || '请求失败',
        type: 'error',
        duration: 5 * 1000
      });
      
      // 处理特定错误码
      if (res.code === 401) {
        // 未授权，可能是token过期
        const authStore = useAuthStore();
        authStore.logout();
        window.location.href = '/login';
      }
      
      return Promise.reject(new Error(res.message || '请求失败'));
    } else {
      return res;
    }
  },
  error => {
    // 对响应错误做点什么
    console.error('响应错误:', error);
    
    // 获取错误信息
    let message = error.message;
    let shouldLogout = false;

    if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 401:
          message = '未授权，请重新登录';
          shouldLogout = true;
          break;
        case 403:
          message = '拒绝访问';
          break;
        case 404:
          // 对于404错误，不显示错误消息，直接返回空数据
          console.warn('资源未找到:', error.config.url);
          return Promise.resolve({
            success: true,
            message: '暂无数据',
            data: {
              weakKnowledgePoints: [],
              weakExerciseTypes: [],
              summary: {
                totalExercises: 0,
                totalMistakes: 0,
                analyzedKnowledgePoints: 0,
                analyzedExerciseTypes: 0,
                weakKnowledgePointsCount: 0,
                weakExerciseTypesCount: 0
              }
            }
          });
        case 500:
          message = '服务器内部错误';
          break;
        default:
          message = `请求失败: ${status}`;
      }

      // 如果需要登出，执行登出操作
      if (shouldLogout) {
        const authStore = useAuthStore();
        authStore.logout();
        window.location.href = '/login';
      } else {
        // 显示错误消息
        ElMessage({
          message: message,
          type: 'error',
          duration: 5 * 1000
        });
      }
    } else {
      // 网络错误等其他错误
      ElMessage({
        message: message,
        type: 'error',
        duration: 5 * 1000
      });
    }
    
    return Promise.reject(error);
  }
);

export default service; 