/**
 * API配置文件
 */

// API基础URL
export const API_BASE_URL = import.meta.env.PROD 
  ? '/api'  // 生产环境使用相对路径
  : 'http://localhost:3000/api';  // 开发环境

// 请求超时时间（毫秒）
export const TIMEOUT = 30000;

// 其他API相关配置
export const API_CONFIG = {
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
};