/**
 * 日期格式化工具函数
 */

/**
 * 格式化日期为标准格式
 * @param {string|Date} dateString - 日期字符串或日期对象
 * @param {boolean} short - 是否使用短格式（仅年月日）
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (dateString, short = false) => {
  if (!dateString) return '';
  
  const date = dateString instanceof Date ? dateString : new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return '无效日期';
  }
  
  if (short) {
    // 短格式: YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // 完整格式: YYYY-MM-DD HH:MM
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * 格式化时间差（多久以前）
 * @param {number} timestamp - 时间戳
 * @returns {string} 格式化后的时间差
 */
export const formatTimeAgo = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return '刚刚';
};

/**
 * 获取当前日期时间字符串
 * @returns {string} 当前日期时间字符串
 */
export const getCurrentDateTime = () => {
  return formatDate(new Date());
};

export default {
  formatDate,
  formatTimeAgo,
  getCurrentDateTime
}; 