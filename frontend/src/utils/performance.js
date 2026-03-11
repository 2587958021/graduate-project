/**
 * 性能优化工具函数
 */

/**
 * 节流函数 - 限制函数在一定时间内只执行一次
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟时间(ms)
 * @returns {Function} - 节流后的函数
 */
export function throttle(fn, delay = 300) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
}

/**
 * 防抖函数 - 延迟函数执行，如果在延迟时间内再次调用则重新计时
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟时间(ms)
 * @returns {Function} - 防抖后的函数
 */
export function debounce(fn, delay = 300) {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * 优化图表初始化和更新
 * @param {Function} initFn - 初始化函数
 * @param {Function} updateFn - 更新函数
 * @returns {Object} - 包含优化后的初始化和更新函数
 */
export function optimizeChartRendering(initFn, updateFn) {
  // 使用防抖优化初始化
  const optimizedInit = debounce(initFn, 200);
  
  // 使用节流优化更新
  const optimizedUpdate = throttle(updateFn, 300);
  
  return {
    init: optimizedInit,
    update: optimizedUpdate
  };
}

/**
 * 检测浏览器是否支持硬件加速
 * @returns {boolean} - 是否支持硬件加速
 */
export function supportsHardwareAcceleration() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || 
             canvas.getContext('experimental-webgl');
  
  return !!gl;
}

/**
 * 根据设备性能调整图表配置
 * @returns {Object} - 图表配置建议
 */
export function getChartPerformanceConfig() {
  // 检测设备性能
  const isLowEndDevice = !supportsHardwareAcceleration() || 
                        (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
  
  return {
    // 低端设备使用更简单的动画
    animation: !isLowEndDevice,
    // 低端设备降低渲染精度
    progressive: isLowEndDevice ? 500 : 0,
    // 低端设备减少阴影和特效
    useSimpleStyle: isLowEndDevice
  };
} 