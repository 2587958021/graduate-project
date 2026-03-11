/**
 * 性能监控工具
 * 用于监控和报告应用性能问题
 */

// 性能指标阈值
const THRESHOLDS = {
  FPS: 30, // 低于此值视为帧率过低
  LONG_TASK: 50, // 超过此值(ms)视为长任务
  MEMORY_LIMIT: 150 * 1024 * 1024, // 150MB，超过此值视为内存占用过高
  TTI_LIMIT: 3000, // 3秒，超过此值视为交互时间过长
  LCP_LIMIT: 2500 // 2.5秒，超过此值视为加载性能差
};

// 性能问题记录
let performanceIssues = [];

// 启动FPS监控
let lastFrameTime = performance.now();
let frameCount = 0;
let currentFPS = 60;
let lowFPSCount = 0;

/**
 * 初始化性能监控
 */
export function initPerformanceMonitoring() {
  // 检查浏览器是否支持性能API
  if (!window.performance || !window.PerformanceObserver) {
    console.warn('当前浏览器不支持性能监控API');
    return;
  }
  
  // 监控FPS
  monitorFPS();
  
  // 监控长任务
  monitorLongTasks();
  
  // 监控内存使用
  monitorMemoryUsage();
  
  // 监控关键性能指标
  monitorWebVitals();
  
  console.log('性能监控已启动');
}

/**
 * 监控FPS
 */
function monitorFPS() {
  // 使用requestAnimationFrame计算FPS
  const measureFPS = () => {
    const now = performance.now();
    const elapsed = now - lastFrameTime;
    
    // 每秒更新一次FPS计数
    if (elapsed >= 1000) {
      currentFPS = Math.round((frameCount * 1000) / elapsed);
      
      // 检测低帧率
      if (currentFPS < THRESHOLDS.FPS) {
        lowFPSCount++;
        
        // 连续3次低帧率才报告问题
        if (lowFPSCount >= 3) {
          recordPerformanceIssue('low-fps', `检测到低帧率: ${currentFPS} FPS`, { fps: currentFPS });
          lowFPSCount = 0;
        }
      } else {
        lowFPSCount = 0;
      }
      
      // 重置计数器
      frameCount = 0;
      lastFrameTime = now;
    }
    
    frameCount++;
    requestAnimationFrame(measureFPS);
  };
  
  requestAnimationFrame(measureFPS);
}

/**
 * 监控长任务
 */
function monitorLongTasks() {
  try {
    // 使用PerformanceObserver API监控长任务
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > THRESHOLDS.LONG_TASK) {
          recordPerformanceIssue('long-task', `检测到长任务: ${Math.round(entry.duration)}ms`, {
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name
          });
        }
      });
    });
    
    observer.observe({ entryTypes: ['longtask'] });
  } catch (e) {
    console.warn('长任务监控不可用:', e);
  }
}

/**
 * 监控内存使用
 */
function monitorMemoryUsage() {
  // 检查是否支持内存API
  if (!performance.memory) {
    console.warn('内存使用监控不可用');
    return;
  }
  
  // 每30秒检查一次内存使用
  setInterval(() => {
    const memoryInfo = performance.memory;
    
    if (memoryInfo.usedJSHeapSize > THRESHOLDS.MEMORY_LIMIT) {
      recordPerformanceIssue('high-memory', `检测到高内存使用: ${Math.round(memoryInfo.usedJSHeapSize / (1024 * 1024))}MB`, {
        usedJSHeapSize: memoryInfo.usedJSHeapSize,
        jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit
      });
    }
  }, 30000);
}

/**
 * 监控Web Vitals关键指标
 */
function monitorWebVitals() {
  try {
    // 监控LCP (Largest Contentful Paint)
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.startTime > THRESHOLDS.LCP_LIMIT) {
          recordPerformanceIssue('slow-lcp', `LCP过慢: ${Math.round(entry.startTime)}ms`, {
            value: entry.startTime,
            element: entry.element ? entry.element.tagName : 'unknown'
          });
        }
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    
    // 监控FID (First Input Delay)
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.processingStart - entry.startTime > 100) {
          recordPerformanceIssue('high-fid', `输入延迟高: ${Math.round(entry.processingStart - entry.startTime)}ms`, {
            value: entry.processingStart - entry.startTime
          });
        }
      }
    }).observe({ type: 'first-input', buffered: true });
    
    // 监控CLS (Cumulative Layout Shift)
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          if (clsValue > 0.1) {
            recordPerformanceIssue('high-cls', `布局偏移高: ${clsValue.toFixed(3)}`, {
              value: clsValue
            });
          }
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    console.warn('Web Vitals监控不可用:', e);
  }
}

/**
 * 记录性能问题
 * @param {string} type - 问题类型
 * @param {string} message - 问题描述
 * @param {Object} data - 相关数据
 */
function recordPerformanceIssue(type, message, data) {
  const issue = {
    type,
    message,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    data
  };
  
  performanceIssues.push(issue);
  
  // 限制存储的问题数量
  if (performanceIssues.length > 50) {
    performanceIssues.shift();
  }
  
  // 输出到控制台
  console.warn(`性能问题: ${message}`, data);
  
  // 发送到服务器或分析工具
  // sendToAnalytics(issue);
}

/**
 * 获取当前FPS
 * @returns {number} 当前FPS
 */
export function getCurrentFPS() {
  return currentFPS;
}

/**
 * 获取记录的性能问题
 * @returns {Array} 性能问题列表
 */
export function getPerformanceIssues() {
  return [...performanceIssues];
}

/**
 * 清除记录的性能问题
 */
export function clearPerformanceIssues() {
  performanceIssues = [];
}

/**
 * 获取性能建议
 * @returns {Array<string>} 性能优化建议
 */
export function getPerformanceSuggestions() {
  const suggestions = [];
  const issues = getPerformanceIssues();
  
  // 根据问题类型提供建议
  if (issues.some(issue => issue.type === 'low-fps')) {
    suggestions.push('检测到低帧率，建议减少复杂动画和DOM操作，考虑使用CSS硬件加速');
  }
  
  if (issues.some(issue => issue.type === 'long-task')) {
    suggestions.push('检测到长任务，建议将复杂计算拆分为小任务或移至Web Worker中执行');
  }
  
  if (issues.some(issue => issue.type === 'high-memory')) {
    suggestions.push('检测到高内存使用，检查是否存在内存泄漏，减少大型对象的创建');
  }
  
  if (issues.some(issue => issue.type === 'slow-lcp')) {
    suggestions.push('页面加载缓慢，建议优化关键资源加载，考虑使用懒加载和资源预加载');
  }
  
  if (issues.some(issue => issue.type === 'high-cls')) {
    suggestions.push('检测到布局偏移，确保图片和视频有预设尺寸，避免动态插入内容导致布局变化');
  }
  
  return suggestions;
} 