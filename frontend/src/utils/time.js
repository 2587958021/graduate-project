/**
 * 格式化时间
 * @param {Date|string|number} time 时间对象、时间字符串或时间戳
 * @returns {string} 格式化后的时间字符串
 */
export const formatTime = (time) => {
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;
  
  // 如果时间差小于1分钟
  if (diff < 60 * 1000) {
    return '刚刚';
  }
  
  // 如果时间差小于1小时
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes}分钟前`;
  }
  
  // 如果时间差小于24小时
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours}小时前`;
  }
  
  // 如果是昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.getDate() === yesterday.getDate()) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  
  // 如果是今年
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  
  // 其他情况
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}; 