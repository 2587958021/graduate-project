<template>
  <div class="home-container" :class="{ 'dark-theme': isDarkTheme }">
    <!-- 2. 主视觉区域 -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">前端学习平台</h1>
        <p class="hero-subtitle">系统化学习前端开发，从入门到精通</p>
        <div class="hero-features">
          <div class="hero-feature">
            <el-icon>
              <DocumentChecked />
            </el-icon>
            <span>系统化课程</span>
          </div>
          <div class="hero-feature">
            <el-icon>
              <Aim />
            </el-icon>
            <span>练习检验</span>
          </div>
          <div class="hero-feature">
            <el-icon>
              <ChatLineRound />
            </el-icon>
            <span>AI辅导</span>
          </div>
        </div>
        <div class="hero-buttons">
          <el-button type="primary" size="large" @click="$router.push('/courses')">
            开始学习
          </el-button>
          <el-button type="success" size="large" @click="$router.push('/ai-assistant')">
            AI学习助手
          </el-button>
        </div>
      </div>
      <div class="hero-image">
        <div class="code-editor">
          <div class="editor-header">
            <div class="editor-controls">
              <span class="control close"></span>
              <span class="control minimize"></span>
              <span class="control maximize"></span>
            </div>
            <div class="editor-title">index.html</div>
            <div class="editor-actions">
              <span class="action-icon"><el-icon>
                  <RefreshRight />
                </el-icon></span>
              <span class="action-icon"><el-icon>
                  <Download />
                </el-icon></span>
            </div>
          </div>
          <div class="editor-body">
            <div class="line-numbers">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
              <span>6</span>
              <span>7</span>
              <span>8</span>
              <span>9</span>
              <span>10</span>
            </div>
            <div class="code-content">
              <div class="code-line"><span class="token-html">&lt;!DOCTYPE html&gt;</span></div>
              <div class="code-line"><span class="token-html">&lt;html</span> <span class="token-attr">lang=</span><span
                  class="token-value">"zh-CN"</span><span class="token-html">&gt;</span></div>
              <div class="code-line"><span class="token-html">&lt;head&gt;</span></div>
              <div class="code-line indent-1"><span class="token-html">&lt;meta</span> <span
                  class="token-attr">charset=</span><span class="token-value">"UTF-8"</span><span
                  class="token-html">&gt;</span></div>
              <div class="code-line indent-1"><span class="token-html">&lt;title&gt;</span><span
                  class="token-text">前端开发学习平台</span><span class="token-html">&lt;/title&gt;</span></div>
              <div class="code-line indent-1"><span class="token-html">&lt;link</span> <span
                  class="token-attr">rel=</span><span class="token-value">"stylesheet"</span> <span
                  class="token-attr">href=</span><span class="token-value">"style.css"</span><span
                  class="token-html">&gt;</span></div>
              <div class="code-line"><span class="token-html">&lt;/head&gt;</span></div>
              <div class="code-line"><span class="token-html">&lt;body&gt;</span></div>
              <div class="code-line indent-1"><span class="token-html">&lt;h1</span> <span
                  class="token-attr">class=</span><span class="token-value">"title"</span><span
                  class="token-html">&gt;</span><span class="token-text">欢迎学习前端开发</span><span
                  class="token-html">&lt;/h1&gt;</span></div>
              <div class="code-line"><span class="token-html">&lt;/body&gt;</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. 功能模块展示 -->
    <section class="features-section">
      <div class="section-header">
        <h2>推荐课程</h2>
        <el-button link @click="$router.push('/courses')">查看全部 <el-icon>
            <ArrowRight />
          </el-icon></el-button>
      </div>
      <div class="recommended-courses">
        <div class="course-card" v-for="course in recommendedCourses" :key="course.id">
          <div class="course-card-inner">
            <div class="course-image-container" :class="course.categoryClass">
              <img v-if="course.coverImage" :src="course.coverImage" :alt="course.title" class="course-image" />
              <div v-else :class="course.categoryClass">
                <span class="category-icon">{{ getCategoryName(course.category) }}</span>
              </div>
            </div>
            <div class="course-content">
              <h3 class="course-title">{{ course.title }}</h3>
              <p class="course-description">{{ course.description }}</p>
              <div class="course-meta">
                <span class="course-level" :class="'level-' + course.levelClass">{{ course.level }}</span>
              </div>
              <div class="course-progress" v-if="authStore.isAuthenticated && course.progress">
                <div class="progress-info">
                  <span class="progress-text">{{ course.progress.completionRate }}% 已完成</span>
                  <span class="last-study-time">{{ course.progress.lastStudy }}</span>
                </div>
                <div class="progress-bar-container">
                  <div class="progress-bar" :style="{ width: course.progress.completionRate + '%' }"></div>
                </div>
              </div>
              <div class="course-actions">
                <router-link v-if="authStore.isAuthenticated && course.progress && course.progress.completionRate > 0"
                  to="/courses" class="course-continue">
                  <el-icon>
                    <VideoPlay />
                  </el-icon>
                  继续学习
                </router-link>
                <router-link v-else to="/courses" class="course-start">
                  <el-icon>
                    <VideoPlay />
                  </el-icon>
                  开始学习
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section-header">
        <h2>推荐练习</h2>
        <el-button link @click="$router.push('/practice')">查看全部 <el-icon>
            <ArrowRight />
          </el-icon></el-button>
      </div>
      <div class="recommended-exercises">
        <div class="exercise-card" v-for="exercise in recommendedExercises" :key="exercise.id">
          <div class="exercise-tag" :style="{ backgroundColor: exercise.typeColor }">{{ exercise.type }}</div>
          <h3>{{ exercise.title }}</h3>
          <p>{{ exercise.description }}</p>
          <div class="exercise-info">
            <el-tag size="small" :type="exercise.difficultyType">{{ exercise.difficulty }}</el-tag>
          </div>
          <el-button type="primary" plain @click="$router.push(exercise.route)">开始练习</el-button>
        </div>
      </div>
    </section>

    <!-- 5. 动态内容 -->
    <section class="dynamic-content" v-if="authStore.isAuthenticated">
      <div class="ai-assistant-section">
        <div class="section-header">
          <h2>AI学习助手</h2>
          <el-button link @click="$router.push('/ai-assistant')">立即体验 <el-icon>
              <ArrowRight />
            </el-icon></el-button>
        </div>
        <div class="ai-feature-container">
          <div class="ai-introduction">
            <h3>智能学习伙伴，随时助你解惑</h3>
            <p class="ai-introduction-text">基于先进的大语言模型，为你提供个性化的学习支持和辅导，让你的前端学习更高效</p>
          </div>

          <div class="ai-features">
            <div class="ai-feature-card">
              <div class="feature-icon" style="background-color: rgba(74, 144, 226, 0.1);">
                <el-icon style="color: #4a90e2;">
                  <ChatLineRound />
                </el-icon>
              </div>
              <div class="feature-content">
                <h4>智能答疑解惑</h4>
                <p>遇到前端概念不明白？AI助手能够清晰解释JavaScript闭包、CSS Grid等各种前端概念</p>
              </div>
            </div>

            <div class="ai-feature-card">
              <div class="feature-icon" style="background-color: rgba(80, 227, 194, 0.1);">
                <el-icon style="color: #50e3c2;">
                  <DocumentCopy />
                </el-icon>
              </div>
              <div class="feature-content">
                <h4>代码分析优化</h4>
                <p>提交你的代码片段，AI助手会分析并提供改进建议，帮助你写出更高质量的代码</p>
              </div>
            </div>

            <div class="ai-feature-card">
              <div class="feature-icon" style="background-color: rgba(255, 153, 51, 0.1);">
                <el-icon style="color: #ff9933;">
                  <Connection />
                </el-icon>
              </div>
              <div class="feature-content">
                <h4>个性化学习规划</h4>
                <p>根据你的学习进度和薄弱环节，AI助手会为你制定个性化的学习计划</p>
              </div>
            </div>

            <div class="ai-feature-card">
              <div class="feature-icon" style="background-color: rgba(114, 163, 255, 0.1);">
                <el-icon style="color: #72a3ff;">
                  <Monitor />
                </el-icon>
              </div>
              <div class="feature-content">
                <h4>项目实战指导</h4>
                <p>在实际项目开发中遇到困难？AI助手会给予方向性指导和解决方案</p>
              </div>
            </div>
          </div>

          <div class="ai-demo-container">
            <div class="ai-chat-demo">
              <div class="chat-header">
                <h4>AI助手示例对话</h4>
              </div>
              <div class="chat-messages">
                <div class="user-message">
                  <div class="message-bubble">JavaScript中的Promise和async/await有什么区别？</div>
                </div>
                <div class="ai-message">
                  <div class="message-bubble">
                    <p><strong>Promise和async/await的区别：</strong></p>
                    <p>Promise是ES6引入的异步编程解决方案，它通过.then()和.catch()链式调用处理异步操作。</p>
                    <p>async/await是ES8引入的语法糖，让异步代码看起来像同步代码，更易读：</p>
                    <ul>
                      <li>async函数总是返回Promise</li>
                      <li>await关键字只能在async函数内使用</li>
                      <li>await使代码暂停执行，等待Promise解决</li>
                    </ul>
                    <p>想了解更多实例吗？</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="ai-experience-button">
              <el-button type="primary" size="large" @click="$router.push('/ai-assistant')">
                立即体验AI学习助手
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 6. 页脚 -->
    <footer class="main-footer">
      <div class="footer-content">
        <div class="footer-section">
          <h3>前端学习平台</h3>
          <p>为前端开发者提供全方位的学习资源和工具</p>
        </div>
        <div class="footer-section">
          <h3>快速链接</h3>
          <ul class="footer-links">
            <li><router-link to="/">首页</router-link></li>
            <li><router-link to="/courses">课程中心</router-link></li>
            <li><router-link to="/practice">练习中心</router-link></li>
          </ul>
        </div>
        <div class="footer-section">
          <h3>联系我们</h3>
          <ul class="footer-links">
            <li><a href="mailto:wuyelongjobs@163.com">wuyelongjobs@163.com</a></li>
            <li><a href="tel:+13571795875">13571795875</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h3>帮助中心</h3>
          <ul class="footer-links">
            <li><router-link to="/help/guides">使用指南</router-link></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; {{ new Date().getFullYear() }} 前端学习平台. 保留所有权利.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { DocumentChecked, Aim, ChatLineRound, RefreshRight, Download, ArrowRight, Timer, VideoPlay, DocumentCopy, Connection, Monitor, InfoFilled } from '@element-plus/icons-vue';
import { useAuthStore } from '@/store/auth';
import { getRecommendedCourses } from '@/api/courses';
import { getRecommendedExercises } from '@/api/exercises';

const authStore = useAuthStore();
const router = useRouter();
const isDarkTheme = ref(false);

// 推荐课程
const recommendedCourses = ref([]);
const recommendedExercises = ref([]);
const loading = ref(true);

// 获取推荐课程
const fetchRecommendedCourses = async () => {
  try {
    const response = await getRecommendedCourses(3);
    console.log('推荐课程API响应:', response);

    if (response && response.data) {
      // 处理不同的响应格式
      let courseData = [];

      if (response.data.success && response.data.data) {
        // 标准API响应格式 { success: true, data: [...] }
        courseData = response.data.data;
      } else if (Array.isArray(response.data)) {
        // 直接返回数组的情况
        courseData = response.data;
      }

      if (courseData.length > 0) {
        recommendedCourses.value = courseData.map(course => ({
          ...course,
          id: course._id,
          categoryClass: getCategoryClass(course.category),
          levelClass: getLevelClass(course.level)
        }));
        console.log('成功获取推荐课程:', recommendedCourses.value);
      } else {
        console.warn('未获取到推荐课程数据');
      }
    } else {
      console.warn('推荐课程响应格式异常:', response);
    }
  } catch (error) {
    console.error('获取推荐课程失败:', error);
  }
};

// 获取推荐练习
const fetchRecommendedExercises = async () => {
  try {
    const response = await getRecommendedExercises();
    if (response && response.data && response.data.length > 0) {
      recommendedExercises.value = response.data.map(exercise => ({
        ...exercise,
        id: exercise._id,
        typeColor: getExerciseTypeColor(exercise.type),
        difficultyType: getDifficultyType(exercise.difficulty)
      }));
      console.log('成功获取推荐练习:', recommendedExercises.value);
    } else {
      // 使用示例数据
      recommendedExercises.value = [
        {
          id: 1,
          title: 'HTML标签与属性',
          description: '测试你对HTML基础标签和属性的掌握程度',
          type: '选择题',
          typeColor: '#409EFF',
          difficulty: '简单',
          difficultyType: 'success',
          estimatedTime: '10分钟',
          route: '/practice'
        },
        {
          id: 2,
          title: 'CSS选择器与样式',
          description: '检验CSS选择器和常用样式属性的应用能力',
          type: '填空题',
          typeColor: '#67C23A',
          difficulty: '中等',
          difficultyType: 'warning',
          estimatedTime: '15分钟',
          route: '/practice'
        },
        {
          id: 3,
          title: 'JavaScript函数与闭包',
          description: '测试对JavaScript函数和闭包概念的理解',
          type: '编程题',
          typeColor: '#E6A23C',
          difficulty: '困难',
          difficultyType: 'danger',
          estimatedTime: '20分钟',
          route: '/practice'
        }
      ];
      console.log('使用示例练习数据');
    }
  } catch (error) {
    console.error('获取推荐练习失败:', error);
    // 出错时也使用示例数据
    recommendedExercises.value = [
      {
        id: 1,
        title: 'HTML标签与属性',
        description: '测试你对HTML基础标签和属性的掌握程度',
        type: '选择题',
        typeColor: '#409EFF',
        difficulty: '简单',
        difficultyType: 'success',
        estimatedTime: '10分钟',
        route: '/practice'
      },
      {
        id: 2,
        title: 'CSS选择器与样式',
        description: '检验CSS选择器和常用样式属性的应用能力',
        type: '填空题',
        typeColor: '#67C23A',
        difficulty: '中等',
        difficultyType: 'warning',
        estimatedTime: '15分钟',
        route: '/practice'
      },
      {
        id: 3,
        title: 'JavaScript函数与闭包',
        description: '测试对JavaScript函数和闭包概念的理解',
        type: '编程题',
        typeColor: '#E6A23C',
        difficulty: '困难',
        difficultyType: 'danger',
        estimatedTime: '20分钟',
        route: '/practice'
      }
    ];
  } finally {
    loading.value = false;
  }
};

// 获取分类CSS类
const getCategoryClass = (category) => {
  if (!category) return 'category-other';

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

// 获取难度CSS类
const getLevelClass = (level) => {
  if (!level) return 'beginner';

  switch (level) {
    case '入门':
    case '初级':
    case '基础':
      return 'beginner';
    case '中级':
      return 'intermediate';
    case '高级':
    case '进阶':
    case '专家':
      return 'advanced';
    default:
      return 'beginner';
  }
};

// 获取练习题类型颜色
const getExerciseTypeColor = (type) => {
  switch (type) {
    case '选择题': return '#409EFF';
    case '填空题': return '#67C23A';
    case '编程题': return '#E6A23C';
    case '问答题': return '#F56C6C';
    default: return '#909399';
  }
};

// 获取难度类型
const getDifficultyType = (difficulty) => {
  switch (difficulty) {
    case '简单': return 'success';
    case '中等': return 'warning';
    case '困难': return 'danger';
    default: return 'info';
  }
};

// 获取分类显示名称
const getCategoryName = (category) => {
  const nameMap = {
    'html_css': 'HTML/CSS',
    'javascript': 'JavaScript',
    'typescript': 'TypeScript',
    'vue': 'Vue',
    'react': 'React',
    'uni-app': 'uni-app',
    '其他': '其他'
  };
  return nameMap[category] || category;
};

// 页面加载时执行
onMounted(async () => {
  // 检查暗色模式
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  isDarkTheme.value = prefersDark;

  // 加载推荐内容
  fetchRecommendedCourses();
  fetchRecommendedExercises();
});

// 前往练习
const goToExercise = () => {
  router.push('/exercises');
};
</script>

<style scoped>
/* 全局样式 */
.home-container {
  max-width: 100%;
  overflow-x: hidden;
  color: #333;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  height: 100%;
  overflow-y: auto;
}

html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow-y: auto;
}

/* 主视觉区域 */
.hero-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 80px 20px;
  max-width: 1280px;
  margin: 20px auto 0;
}

.hero-content {
  flex: 1;
  max-width: 600px;
}

.hero-title {
  font-size: 48px;
  font-weight: 800;
  color: #4a90e2;
  margin: 0 0 20px;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 20px;
  color: #666;
  margin-bottom: 30px;
  line-height: 1.5;
}

.hero-features {
  display: flex;
  margin-bottom: 30px;
  gap: 15px;
}

.hero-feature {
  display: flex;
  align-items: center;
  background-color: rgba(74, 144, 226, 0.1);
  border-radius: 20px;
  padding: 8px 15px;
}

.hero-feature .el-icon {
  margin-right: 8px;
  color: #4a90e2;
  font-size: 18px;
}

.hero-buttons {
  display: flex;
  gap: 15px;
}

.hero-image {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.code-editor {
  width: 100%;
  height: 340px;
  border-radius: 10px;
  background-color: #1e1e1e;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  font-family: 'Consolas', 'Monaco', monospace;
  transition: transform 0.3s, box-shadow 0.3s;
}

.code-editor:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.editor-header {
  background-color: #252526;
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  border-bottom: 1px solid #3c3c3c;
}

.editor-controls {
  display: flex;
  gap: 8px;
  margin-right: 15px;
}

.control {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.close {
  background-color: #ff5f56;
}

.minimize {
  background-color: #ffbd2e;
}

.maximize {
  background-color: #27c93f;
}

.editor-title {
  flex: 1;
  color: #ccc;
  font-size: 14px;
  text-align: center;
}

.editor-actions {
  display: flex;
  gap: 10px;
}

.action-icon {
  color: #ccc;
  cursor: pointer;
}

.action-icon:hover {
  color: #fff;
}

.editor-body {
  display: flex;
  height: calc(100% - 36px);
  overflow: auto;
}

.line-numbers {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 8px 8px 8px 15px;
  background-color: #1e1e1e;
  color: #858585;
  font-size: 14px;
  user-select: none;
}

.line-numbers span {
  line-height: 1.5;
  padding: 2px 0;
}

.code-content {
  flex: 1;
  padding: 8px 15px;
  font-size: 14px;
  color: #d4d4d4;
  overflow: auto;
}

.code-line {
  line-height: 1.5;
  padding: 2px 0;
  white-space: pre;
}

.indent-1 {
  padding-left: 20px;
}

.token-html {
  color: #569cd6;
}

.token-attr {
  color: #9cdcfe;
}

.token-value {
  color: #ce9178;
}

.token-text {
  color: #dcdcaa;
}

/* 3. 功能模块展示 */
.features-section {
  max-width: 1280px;
  margin: 0 auto;
  padding: 40px 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* 推荐课程 */
.recommended-courses {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 60px;
}

.course-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  height: 100%;
  background-color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.course-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.course-card:active {
  transform: translateY(2px);
}

.course-card-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.course-image-container {
  position: relative;
  height: 180px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.course-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.course-tags-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 10px;
}

.course-tag {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.category-tag {
  color: white;
}

.new-tag {
  background-color: #ff9933;
  color: white;
}

.category-html {
  background: linear-gradient(135deg, #e44d26, #f16529);
}

.category-js {
  background: linear-gradient(135deg, #f7df1e, #f1c40f);
}

.category-vue {
  background: linear-gradient(135deg, #42b883, #35495e);
}

.category-react {
  background: linear-gradient(135deg, #61dafb, #2d3748);
}

.category-typescript {
  background: linear-gradient(135deg, #007acc, #0288d1);
}

.category-uniapp {
  background: linear-gradient(135deg, #2B9939, #42b883);
}

.category-other {
  background: linear-gradient(135deg, #9c27b0, #673ab7);
}

.course-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.course-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
  line-height: 1.4;
  color: #333;
}

.course-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
  line-height: 1.6;
  flex-grow: 1;
}

.course-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
}

.course-level {
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.level-beginner {
  background-color: rgba(227, 242, 253, 0.9);
  color: #1565c0;
  border: 1px solid rgba(21, 101, 192, 0.2);
}

.level-intermediate {
  background-color: rgba(255, 249, 196, 0.9);
  color: #f57f17;
  border: 1px solid rgba(245, 127, 23, 0.2);
}

.level-advanced {
  background-color: rgba(255, 235, 238, 0.9);
  color: #b71c1c;
  border: 1px solid rgba(183, 28, 28, 0.2);
}

.course-duration {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #888;
}

.course-progress {
  margin-bottom: 16px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.progress-text {
  font-size: 13px;
  font-weight: 500;
  color: #4a90e2;
}

.last-study-time {
  font-size: 13px;
  color: #888;
}

.progress-bar-container {
  height: 6px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, rgba(74, 144, 226, 0.9), rgba(80, 227, 194, 0.9));
  border-radius: 3px;
}

.course-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
}

.course-continue,
.course-start {
  flex: 1;
  padding: 10px 12px;
  border-radius: 6px;
  text-align: center;
  font-weight: 500;
  font-size: 14px;
  text-decoration: none;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.course-continue {
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.9), rgba(80, 227, 194, 0.85));
  color: white;
}

.course-start {
  background: linear-gradient(135deg, rgba(80, 227, 194, 0.9), rgba(74, 144, 226, 0.85));
  color: white;
}

/* 推荐练习 */
.recommended-exercises {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 60px;
}

.exercise-card {
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 20px;
  position: relative;
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
}

.exercise-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.exercise-tag {
  position: absolute;
  top: 0;
  right: 0;
  padding: 5px 15px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  border-bottom-left-radius: 10px;
}

.exercise-card h3 {
  margin-top: 10px;
  margin-bottom: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.exercise-card p {
  color: #666;
  margin-bottom: 15px;
  font-size: 14px;
  line-height: 1.5;
  height: 42px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.exercise-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  font-size: 14px;
  color: #888;
}

.exercise-info span {
  display: flex;
  align-items: center;
}

.exercise-info .el-icon {
  margin-right: 5px;
}

/* 5. 动态内容 - AI助手部分 */
.dynamic-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 40px 20px;
}

.ai-assistant-section {
  background-color: #fff;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 30px;
}

.ai-introduction {
  text-align: center;
  margin-bottom: 30px;
}

.ai-introduction h3 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.ai-introduction-text {
  font-size: 16px;
  color: #666;
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.6;
}

.ai-features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 40px;
}

.ai-feature-card {
  background-color: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: flex-start;
  transition: transform 0.3s, box-shadow 0.3s;
}

.ai-feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
}

.feature-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  flex-shrink: 0;
}

.feature-icon .el-icon {
  font-size: 24px;
}

.feature-content {
  flex-grow: 1;
}

.feature-content h4 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-top: 0;
  margin-bottom: 10px;
}

.feature-content p {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin: 0;
}

.ai-demo-container {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ai-chat-demo {
  width: 100%;
  max-width: 800px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.chat-header {
  background-color: #4a90e2;
  color: white;
  padding: 12px 20px;
}

.chat-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.chat-messages {
  background-color: #f8f9fa;
  padding: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.user-message,
.ai-message {
  margin-bottom: 15px;
  display: flex;
}

.user-message {
  justify-content: flex-end;
}

.ai-message {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
}

.user-message .message-bubble {
  background-color: #4a90e2;
  color: white;
  border-bottom-right-radius: 0;
}

.ai-message .message-bubble {
  background-color: white;
  color: #333;
  border-bottom-left-radius: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.ai-message .message-bubble p {
  margin: 0 0 10px;
}

.ai-message .message-bubble ul {
  margin: 10px 0;
  padding-left: 20px;
}

.ai-message .message-bubble li {
  margin-bottom: 5px;
}

.ai-experience-button {
  margin-top: 20px;
}

@media (max-width: 768px) {
  .ai-features {
    grid-template-columns: 1fr;
  }

  .message-bubble {
    max-width: 90%;
  }
}

/* 6. 页脚 */
.main-footer {
  background-color: #333;
  color: #fff;
  padding: 60px 20px 20px;
}

.footer-content {
  max-width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 40px;
  margin-bottom: 40px;
}

.footer-section h3 {
  color: #fff;
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 600;
}

.footer-section p {
  color: #aaa;
  margin-bottom: 20px;
  line-height: 1.5;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li {
  margin-bottom: 10px;
}

.footer-links a {
  color: #aaa;
  text-decoration: none;
  transition: color 0.3s;
}

.footer-links a:hover {
  color: #fff;
}

.footer-bottom {
  max-width: 1280px;
  margin: 0 auto;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 20px;
  text-align: center;
}

.footer-bottom p {
  color: #888;
  margin: 0;
}

.course-image-container {
  position: relative;
  height: 180px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.category-icon {
  font-size: 16px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(2px);
  letter-spacing: 0.5px;
}

.html-icon {
  color: white;
}

.js-icon {
  color: rgba(50, 50, 50, 0.9);
}

.vue-icon {
  color: white;
}

.course-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  background-color: rgba(245, 150, 50, 0.85);
  color: white;
  letter-spacing: 0.3px;
}

.new-tag {
  background-color: rgba(245, 150, 50, 0.85);
  backdrop-filter: blur(2px);
  color: white;
}

.course-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.action-buttons {
  display: flex;
  gap: 10px;
}
</style>