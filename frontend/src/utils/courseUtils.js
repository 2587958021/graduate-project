/**
 * 课程相关工具函数
 */

/**
 * 根据课程分类和标题自动判断课程难度级别
 * @param {Object} course - 课程对象
 * @returns {String} 课程难度级别（初级、中级、高级）
 */
export const getDisplayLevel = (course) => {
  if (!course) return '';
  
  // 根据课程标题和分类判断难度级别
  if (course.category === 'html_css' ||
      (course.title && (course.title.includes('HTML') || course.title.includes('CSS'))) ||
      (course.description && (course.description.includes('HTML5+CSS3') || 
      course.description.includes('HTML5与CSS3')))) {
    return '初级';
  } else if (course.category === 'javascript') {
    return '中级';
  } else if (course.category === 'vue' || course.category === 'react') {
    return '中级';
  } else {
    return '高级';
  }
};

/**
 * 获取难度样式类
 * @param {String} level - 难度级别（初级、中级、高级）
 * @returns {String} CSS类名
 */
export const getLevelClass = (level) => {
  const classMap = {
    '初级': 'level-beginner',
    '中级': 'level-intermediate',
    '高级': 'level-advanced'
  };
  
  return classMap[level] || '';
};

/**
 * 获取分类样式类
 * @param {String} category - 课程分类
 * @returns {String} CSS类名
 */
export const getCategoryClass = (category) => {
  const classMap = {
    'html_css': 'category-html',
    'javascript': 'category-js',
    'typescript': 'category-typescript',
    'vue': 'category-vue',
    'react': 'category-react',
    'uni-app': 'category-uniapp',
    'uniapp': 'category-uniapp',
    '其他': 'category-other'
  };
  
  return classMap[category] || 'category-other';
}; 