/**
 * 滚动管理器 - 处理页面滚动条，确保整个应用只有一个滚动条
 */

// 检测滚动条是否被隐藏
const isScrollbarHidden = () => {
  const hasVScroll = document.body.scrollHeight > window.innerHeight;
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  return hasVScroll && scrollbarWidth <= 0;
};

// 确保滚动条可见
const ensureScrollbarVisible = () => {
  // 1. 检测并修复body和html的overflow设置
  const htmlEl = document.documentElement;
  const bodyEl = document.body;
  
  // 确保main-content有滚动条
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.style.overflowY = 'auto';
    mainContent.style.overflowX = 'hidden';
  }
  
  // 确保不影响页面布局
  if (window.getComputedStyle(htmlEl).overflow !== 'hidden') {
    htmlEl.style.overflow = 'hidden';
  }
  
  if (window.getComputedStyle(bodyEl).overflow !== 'hidden') {
    bodyEl.style.overflow = 'hidden';
  }
  
  // 确保app容器不滚动
  const appEl = document.getElementById('app');
  if (appEl && window.getComputedStyle(appEl).overflow !== 'hidden') {
    appEl.style.overflow = 'hidden';
  }
};

// 修复所有容器滚动问题
const fixContainerScrolling = () => {
  // 修复所有可能导致双滚动条的容器
  const containers = document.querySelectorAll(
    '.practice-container, .home-container, .content-area, .exercise-list-container, ' + 
    '.user-profile-container, .mistakes-container, .exercise-statistics, ' + 
    '.user-center-layout, .el-aside, .user-sidebar'
  );
  containers.forEach(container => {
    if (container) {
      container.style.overflowY = 'visible';
      container.style.overflowX = 'hidden';
      container.style.height = 'auto';
    }
  });
  
  // 修复所有可能的滚动元素
  const scrollElements = document.querySelectorAll(
    '.chat-messages, .code-content, .exercise-grid, ' + 
    '.user-menu, .el-table__body-wrapper, .el-scrollbar__wrap'
  );
  scrollElements.forEach(el => {
    if (el) {
      el.style.overflowY = 'visible';
      el.style.maxHeight = 'none';
    }
  });

  // 处理特定的Element Plus组件
  const elScrollbars = document.querySelectorAll('.el-scrollbar');
  elScrollbars.forEach(scrollbar => {
    if (scrollbar && !scrollbar.closest('.el-table')) {
      const view = scrollbar.querySelector('.el-scrollbar__view');
      if (view) {
        view.style.overflow = 'visible';
      }
      scrollbar.style.overflow = 'visible';
    }
  });
};

// 监听路由变化时重新处理滚动条
const setupScrollFix = () => {
  ensureScrollbarVisible();
  fixContainerScrolling();
  
  // 在组件挂载和更新后检查修复
  setTimeout(() => {
    ensureScrollbarVisible();
    fixContainerScrolling();
  }, 100);
  
  // 监听滚动事件
  window.addEventListener('scroll', () => {
    ensureScrollbarVisible();
  });
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    ensureScrollbarVisible();
    fixContainerScrolling();
  });
  
  // 监听DOM变化
  const observer = new MutationObserver(() => {
    ensureScrollbarVisible();
    fixContainerScrolling();
  });
  
  // 开始观察
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
};

export {
  setupScrollFix,
  ensureScrollbarVisible,
  fixContainerScrolling
}; 