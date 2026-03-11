/**
 * B站API集成服务
 * 提供B站视频信息获取和进度追踪功能
 */

import axios from 'axios';
import { ElMessage } from 'element-plus';

// 创建专用的axios实例
const biliAxios = axios.create({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36',
    'Referer': 'https://www.bilibili.com'
  }
});

/**
 * 从B站获取视频信息
 * @param {string} bvid - B站视频ID
 * @returns {Promise<Object>} 视频信息
 */
export async function getBiliVideoInfo(bvid) {
  if (!bvid) {
    console.error('getBiliVideoInfo: 缺少BVID参数');
    return null;
  }

  try {
    // 使用代理服务器转发请求，避免跨域问题
    const response = await biliAxios.get(`/api/bilibili/video/${bvid}`);
    return response.data;
  } catch (error) {
    console.error('获取B站视频信息失败:', error);
    return null;
  }
}

/**
 * 创建B站视频播放器 iframe 并监听进度
 * @param {string} elementId - 要放置播放器的元素ID
 * @param {string} bvid - B站视频ID
 * @param {number} page - 分P编号，默认为1
 * @param {Function} onProgress - 进度更新回调函数
 * @returns {Object} 播放器控制对象
 */
export function createBiliPlayer(elementId, bvid, page = 1, onProgress) {
  if (!elementId || !bvid) {
    console.error('createBiliPlayer: 参数不完整');
    return null;
  }

  const container = document.getElementById(elementId);
  if (!container) {
    console.error(`找不到ID为 ${elementId} 的元素`);
    return null;
  }

  // 清空容器
  container.innerHTML = '';

  // 创建iframe
  const iframe = document.createElement('iframe');
  iframe.src = `https://player.bilibili.com/player.html?bvid=${bvid}&page=${page}&high_quality=1&danmaku=0&autoplay=0`;
  iframe.setAttribute('allowfullscreen', 'true');
  iframe.setAttribute('frameborder', 'no');
  iframe.setAttribute('scrolling', 'no');
  iframe.setAttribute('sandbox', 'allow-top-navigation allow-same-origin allow-forms allow-scripts');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  
  // 添加iframe到容器
  container.appendChild(iframe);

  // 创建播放器控制对象
  const playerControl = {
    iframe,
    messageHandler: null,
    interval: null,
    duration: 0,
    currentTime: 0,
    
    // 初始化消息监听
    init() {
      // 监听iframe消息
      this.messageHandler = (event) => {
        try {
          // 仅处理来自B站播放器的消息
          if (event.origin.includes('bilibili.com')) {
            const data = JSON.parse(event.data);
            
            // 处理视频时长信息
            if (data.type === 'videoInfo') {
              this.duration = data.data.duration;
              console.log('获取到视频时长:', this.duration);
            }
            
            // 处理播放进度信息
            if (data.type === 'progress') {
              this.currentTime = data.data.currentTime;
              // 调用进度回调
              if (onProgress && typeof onProgress === 'function') {
                onProgress({
                  currentTime: this.currentTime,
                  duration: this.duration,
                  percentage: this.duration > 0 ? (this.currentTime / this.duration * 100) : 0
                });
              }
            }
          }
        } catch (error) {
          console.error('处理B站播放器消息失败:', error);
        }
      };
      
      // 添加消息监听
      window.addEventListener('message', this.messageHandler);
      
      // 使用轮询作为备用方案来获取进度
      this.interval = setInterval(() => {
        try {
          // 尝试发送消息给iframe获取当前进度
          this.iframe.contentWindow.postMessage(JSON.stringify({
            type: 'getProgress'
          }), '*');
        } catch (error) {
          console.warn('轮询获取播放进度失败:', error);
        }
      }, 5000); // 每5秒获取一次进度
      
      return this;
    },
    
    // 销毁播放器
    destroy() {
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
      
      if (this.messageHandler) {
        window.removeEventListener('message', this.messageHandler);
        this.messageHandler = null;
      }
      
      if (container && iframe) {
        container.removeChild(iframe);
      }
    }
  };
  
  // 初始化并返回控制对象
  return playerControl.init();
}

/**
 * 在前端实现简单的进度记忆功能
 * 由于无法直接访问B站用户的观看历史，可以在本地存储用户的观看记录
 */
export const watchHistory = {
  // 获取观看记录
  getWatchRecord(bvid, page = 1) {
    try {
      const storageKey = `bili_watch_${bvid}_${page}`;
      const record = localStorage.getItem(storageKey);
      return record ? JSON.parse(record) : null;
    } catch (error) {
      console.error('获取观看记录失败:', error);
      return null;
    }
  },
  
  // 保存观看记录
  saveWatchRecord(bvid, page = 1, currentTime, duration) {
    try {
      const storageKey = `bili_watch_${bvid}_${page}`;
      const record = {
        bvid,
        page,
        currentTime,
        duration,
        percentage: duration > 0 ? (currentTime / duration * 100) : 0,
        timestamp: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(record));
      return true;
    } catch (error) {
      console.error('保存观看记录失败:', error);
      return false;
    }
  },
  
  // 检查是否完成观看（例如超过90%视频长度）
  isCompleted(bvid, page = 1, threshold = 90) {
    const record = this.getWatchRecord(bvid, page);
    return record && record.percentage >= threshold;
  },
  
  // 获取所有观看记录
  getAllWatchRecords() {
    try {
      const records = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('bili_watch_')) {
          const record = JSON.parse(localStorage.getItem(key));
          records.push(record);
        }
      }
      return records;
    } catch (error) {
      console.error('获取所有观看记录失败:', error);
      return [];
    }
  },
  
  // 清除观看记录
  clearWatchRecord(bvid, page = 1) {
    try {
      const storageKey = `bili_watch_${bvid}_${page}`;
      localStorage.removeItem(storageKey);
      return true;
    } catch (error) {
      console.error('清除观看记录失败:', error);
      return false;
    }
  }
};

/**
 * 创建后端代理服务，以获取更多B站API功能
 * 注意：这需要在后端实现相应的接口
 */
export async function syncBiliProgress(courseId, chapterId, lessonId, bvid, page, progress) {
  try {
    // 将B站的进度同步到我们的后端
    const response = await axios.post(`/api/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/bilibili-progress`, {
      bvid,
      page,
      currentTime: progress.currentTime,
      duration: progress.duration,
      percentage: progress.percentage
    });
    
    return response.data;
  } catch (error) {
    console.error('同步B站进度失败:', error);
    return null;
  }
} 