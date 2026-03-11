/**
 * 认证相关工具函数
 */

// 存储令牌的键名
const TOKEN_KEY = 'token';

/**
 * 从本地存储获取令牌
 * @returns {string|null} 认证令牌或null
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * 设置令牌到本地存储
 * @param {string} token - 认证令牌
 */
export const setToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

/**
 * 移除本地存储中的令牌
 */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * 检查用户是否已认证
 * @returns {boolean} - 是否已认证
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * 解析JWT令牌的Payload部分（不验证签名）
 * @param {string} token - JWT令牌
 * @returns {Object|null} - 解析后的数据或null
 */
export const parseToken = (token) => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('解析令牌失败:', error);
    return null;
  }
};

/**
 * 检查令牌是否过期（不验证签名）
 * @returns {boolean} - 是否过期
 */
export const isTokenExpired = () => {
  const token = getToken();
  if (!token) return true;
  
  const payload = parseToken(token);
  if (!payload || !payload.exp) return true;
  
  // JWT中的exp是秒级时间戳
  const expireTime = payload.exp * 1000;
  return Date.now() >= expireTime;
};

export default {
  getToken,
  setToken,
  removeToken,
  isAuthenticated,
  parseToken,
  isTokenExpired
}; 