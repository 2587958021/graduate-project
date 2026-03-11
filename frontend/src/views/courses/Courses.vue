<template>
  <div class="courses-page">
    <div class="page-header">
      <h1 class="page-title">课程中心</h1>
      <p class="page-subtitle">探索前端开发的精品课程，开始您的学习之旅</p>
    </div>

    <div class="main-content">
      <!-- 左侧导航区域 -->
      <div class="sidebar">
        <h3 class="sidebar-title">课程分类</h3>
        <ul class="category-nav">
          <li class="category-item" :class="{ active: activeCategory === 'all' }" @click="setCategory('all')">
            <span>全部课程</span>
            <span class="course-count">{{ totalCourseCount }}</span>
          </li>
          <!-- 按照指定顺序显示分类 -->
          <li v-for="category in categories" :key="category" class="category-item"
            :class="{ active: activeCategory === category }" @click="setCategory(category)">
            <span>{{ getCategoryDisplayName(category) }}</span>
            <span class="course-count">{{ categoryCounts[category] || 0 }}</span>
          </li>
        </ul>
      </div>

      <!-- 右侧内容区域 -->
      <div class="content-area">
        <div class="filters-container">
          <div class="filters">
            <el-input v-model="filters.search" placeholder="搜索课程" class="search-input" clearable
              @keyup.enter="fetchCourses" @clear="fetchCourses">
              <template #prefix>
                <el-icon class="search-icon">
                  <Search />
                </el-icon>
              </template>
            </el-input>
          </div>
        </div>

        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="3" animated />
          <el-skeleton :rows="3" animated />
          <el-skeleton :rows="3" animated />
        </div>

        <div v-else-if="error" class="error-container">
          <el-empty description="加载课程失败" :image-size="200">
            <el-button type="primary" @click="fetchCourses">重试</el-button>
          </el-empty>
        </div>

        <div v-else-if="courses.length === 0" class="empty-container">
          <el-empty description="暂无课程" :image-size="200">
            <el-button type="primary" @click="resetFilters">清除筛选</el-button>
          </el-empty>
        </div>

        <div v-else class="courses-grid">
          <div v-for="course in courses" :key="course._id" class="course-card">
            <div class="course-card-inner">
              <div class="course-image-container" :class="getCategoryClass(course.category)">
                <img v-if="course.coverImage" :src="course.coverImage" :alt="course.title" class="course-image" />
                <div v-else class="default-course-image">
                  <span class="course-title-in-image">{{ course.title }}</span>
                </div>
                <div class="course-category" :class="getCategoryClass(course.category)">
                  {{ getCategoryDisplayName(course.category) }}
                </div>
                <div v-if="course.isNew" class="course-tag new-tag">新课</div>
              </div>

              <div class="course-content">
                <h3 class="course-title">{{ course.title }}</h3>
                <p v-if="truncateDescription(course.description)" class="course-description">{{
                  truncateDescription(course.description) }}</p>

                <div class="course-meta">
                  <span class="course-level" :class="getLevelClass(getDisplayLevel(course))">
                    {{ getDisplayLevel(course) }}
                  </span>
                </div>

                <div class="course-actions">
                  <el-button type="primary" @click="startLearning(course)" class="course-start">
                    <el-icon>
                      <VideoPlay />
                    </el-icon>
                    开始学习
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="pagination-container" v-if="totalPages > 1">
          <el-pagination v-model="currentPage" :page-size="pageSize" :total="total" layout="prev, pager, next"
            @current-change="handlePageChange" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { Search, Timer, VideoPlay, InfoFilled } from '@element-plus/icons-vue';
import { useAuthStore } from '@/store/auth';
import { getCourses, getCourseChapters } from '@/api/courses.js';
import axios from '@/api/api.js';
import { ElMessage, ElEmpty } from 'element-plus';
import { useRouter } from 'vue-router';
import { getDisplayLevel, getLevelClass, getCategoryClass } from '@/utils/courseUtils.js';

const authStore = useAuthStore();
const router = useRouter();

// 状态变量
const courses = ref([]);
const loading = ref(true);
const error = ref(null);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const totalPages = ref(0);
const activeCategory = ref('all');
const totalCourseCount = ref(0);
const categoryCounts = ref({
  'html_css': 0,
  'javascript': 0,
  'typescript': 0,
  'vue': 0,
  'react': 0,
  'uni-app': 0,
  '其他': 0
});

// 筛选选项
const categories = ['html_css', 'javascript', 'typescript', 'vue', 'react', 'uni-app', '其他'];

// 筛选条件
const filters = reactive({
  category: '',
  search: ''
});

// 设置分类筛选
const setCategory = (category) => {
  console.log('选择分类:', category);
  activeCategory.value = category;
  filters.category = category === 'all' ? '' : category;
  currentPage.value = 1;
  fetchCourses();
};

// 获取分类显示名称
const getCategoryDisplayName = (category) => {
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

// 获取课程列表
const fetchCourses = async () => {
  loading.value = true;
  error.value = null;

  try {
    console.log('获取课程列表，筛选条件:', filters);
    const response = await getCourses({
      page: currentPage.value,
      limit: pageSize.value,
      category: filters.category,
      search: filters.search
    });

    // 检查响应格式并获取数据
    if (response && response.data) {
      if (response.data.success && response.data.data) {
        // 标准API响应格式 { success: true, data: [...], ... }
        const courseData = response.data.data;

        if (Array.isArray(courseData)) {
          // 直接使用数组数据
          courses.value = courseData.map(course => {
            const isNew = new Date(course.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            // 不再需要在这里设置难度级别，通过getDisplayLevel函数获取            
            return { ...course, isNew };
          });

          // 按照指定分类顺序排序课程
          sortCoursesByCategory();

          // 尝试从响应中获取分页信息
          if (response.data.pagination) {
            total.value = response.data.pagination.total || courseData.length;
            totalPages.value = response.data.pagination.pages || Math.ceil(total.value / pageSize.value);
          } else {
            total.value = courseData.length;
            totalPages.value = Math.ceil(total.value / pageSize.value);
          }
        } else {
          console.error('课程数据不是数组:', courseData);
          courses.value = [];
          error.value = '获取课程数据格式异常';
        }
      } else if (Array.isArray(response.data)) {
        // 直接返回数组的情况
        const courseData = response.data;
        courses.value = courseData.map(course => {
          const isNew = new Date(course.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          // 不再需要在这里设置难度级别，通过getDisplayLevel函数获取
          return { ...course, isNew };
        });

        // 按照指定分类顺序排序课程
        sortCoursesByCategory();

        total.value = courseData.length;
        totalPages.value = Math.ceil(total.value / pageSize.value);
      } else {
        console.error('未知的响应格式:', response.data);
        courses.value = [];
        error.value = '获取课程数据格式异常';
      }
    } else {
      courses.value = [];
      error.value = '获取课程数据失败';
    }

    // 获取分类统计
    try {
      const categoryStatsResponse = await axios.get('/courses/category-stats');
      if (categoryStatsResponse && categoryStatsResponse.data) {
        const statsData = categoryStatsResponse.data.data || categoryStatsResponse.data;
        if (statsData) {
          categoryCounts.value = statsData;
          totalCourseCount.value = Object.values(categoryCounts.value).reduce((sum, count) => sum + count, 0);
        } else {
          console.warn('分类统计数据为空');
          totalCourseCount.value = courses.value.length;
        }
      }
    } catch (statsErr) {
      console.error('获取分类统计失败:', statsErr);
      // 不影响主流程，所以不设置error
      // 使用当前课程数量作为总数
      totalCourseCount.value = courses.value.length;
    }
  } catch (err) {
    console.error('获取课程列表失败:', err);
    error.value = err.response?.data?.message || '获取课程列表失败';
    ElMessage.error(error.value);
    courses.value = [];
  } finally {
    loading.value = false;
  }
};

// 重置筛选条件
const resetFilters = () => {
  filters.category = '';
  filters.search = '';
  activeCategory.value = 'all';
  currentPage.value = 1;
  fetchCourses();
};

// 页面切换
const handlePageChange = (page) => {
  currentPage.value = page;
  fetchCourses();
};

// 格式化持续时间
const formatDuration = (seconds) => {
  if (!seconds) return '未知时长';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}小时${minutes > 0 ? ` ${minutes}分钟` : ''}`;
  } else {
    return `${minutes}分钟`;
  }
};

// 格式化最后学习时间
const formatLastStudyTime = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '今天';
  } else if (diffDays === 1) {
    return '昨天';
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }
};

// 截断描述文本
const truncateDescription = (text) => {
  if (!text || text.trim() === '暂无描述') return '';
  return text.length > 100 ? text.substring(0, 100) + '...' : text;
};

// 按分类排序课程
const sortCoursesByCategory = () => {
  const categoryOrder = {
    'html_css': 1,
    'javascript': 2,
    'typescript': 3,
    'vue': 4,
    'react': 5,
    'uni-app': 6,
    '其他': 7
  };

  courses.value.sort((a, b) => {
    // 先按分类顺序排序
    const categoryA = categoryOrder[a.category] || 999;
    const categoryB = categoryOrder[b.category] || 999;
    if (categoryA !== categoryB) {
      return categoryA - categoryB;
    }

    // 如果分类相同，则按照创建时间降序排序（新课程在前）
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
};

// 开始学习课程
const startLearning = async (course) => {
  try {
    loading.value = true;

    // 获取课程章节信息
    const response = await getCourseChapters(course._id);

    if (!response || !response.success) {
      throw new Error('获取课程章节失败');
    }

    const chapters = response.data || [];
    if (!chapters || chapters.length === 0) {
      ElMessage.warning('该课程暂无章节内容');
      loading.value = false;
      return;
    }

    // 默认跳转到第一个章节的第一个课时
    const targetChapterId = chapters[0]._id;
    const targetLessonId = chapters[0].lessons && chapters[0].lessons.length > 0
      ? chapters[0].lessons[0]._id
      : '';

    if (!targetChapterId || !targetLessonId) {
      ElMessage.warning('无法确定课时位置，请稍后再试');
      loading.value = false;
      return;
    }

    // 使用router.push进行导航
    router.push(`/course-player/${course._id}/${targetChapterId}/${targetLessonId}`);
  } catch (err) {
    console.error('启动课程学习失败:', err);
    ElMessage.error('启动课程学习失败，请稍后再试');
  } finally {
    loading.value = false;
  }
};

// 页面加载时获取课程
onMounted(() => {
  fetchCourses();
});
</script>

<style scoped>
.courses-page {
  max-width: 100%;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.page-header {
  text-align: center;
  margin-bottom: 20px;
  padding: 20px 0;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #4a90e2, #50e3c2);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-subtitle {
  font-size: 16px;
  color: var(--text-light);
  margin-bottom: 0;
}

.main-content {
  display: flex;
  gap: 0;
  flex: 1;
  height: calc(100vh - 120px);
  overflow: hidden;
}

/* 左侧导航 */
.sidebar {
  width: 200px;
  flex-shrink: 0;
  background-color: var(--card-background);
  border-radius: 0;
  padding: 0;
  box-shadow: var(--el-box-shadow-light);
  align-self: stretch;
  position: sticky;
  top: 68px;
  margin-left: 0;
  height: 100%;
  border-right: 1px solid var(--el-border-color-light);
  z-index: 10;
  overflow-y: auto;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  padding: 20px;
  color: var(--text-dark);
  border-bottom: 1px solid var(--el-border-color-light);
}

.category-nav {
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 0;
  font-size: 14px;
  border-left: 3px solid transparent;
  width: 100%;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

.category-item:hover {
  background-color: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

.category-item.active {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 500;
  border-left: 3px solid var(--el-color-primary);
}

.course-count {
  margin-left: auto;
  background-color: var(--el-fill-color);
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  min-width: 28px;
  text-align: center;
}

/* 右侧内容区域 */
.content-area {
  flex: 1;
  min-width: 0;
  padding: 0 24px 24px 24px;
  overflow-y: auto;
  height: 100%;
}

.filters-container {
  margin-bottom: 24px;
  background-color: var(--card-background);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.search-input {
  width: 300px;
}

.loading-container,
.error-container,
.empty-container {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: var(--card-background);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 课程卡片 */
.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.course-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  height: 100%;
  background-color: var(--card-background);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.course-card:hover {
  transform: translateY(-4px) scale(1.03);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
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
}

.course-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.course-card:hover .course-image {
  transform: scale(1.05);
}

.default-course-image {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 20px;
}

.course-title-in-image {
  color: white;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}

.course-category {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: white;
  background-color: rgba(0, 0, 0, 0.5);
}

.course-tag {
  position: absolute;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: white;
}

.new-tag {
  top: 12px;
  left: 12px;
  background-color: #ff9933;
}

.category-html {
  background-color: #e44d26;
}

.course-image-container.category-html {
  background: linear-gradient(135deg, #e44d26, #f16529);
}

.category-js {
  background-color: #f7df1e;
  color: #333;
}

.course-image-container.category-js {
  background: linear-gradient(135deg, #f7df1e, #f1c40f);
}

.category-vue {
  background-color: #42b883;
}

.course-image-container.category-vue {
  background: linear-gradient(135deg, #42b883, #35495e);
}

.category-react {
  background-color: #61dafb;
  color: #333;
}

.course-image-container.category-react {
  background: linear-gradient(135deg, #61dafb, #2d3748);
}

.category-other {
  background-color: #9c27b0;
}

.course-image-container.category-other {
  background: linear-gradient(135deg, #9c27b0, #673ab7);
}

.category-typescript {
  background-color: #007acc;
}

.course-image-container.category-typescript {
  background: linear-gradient(135deg, #007acc, #0288d1);
}

.category-uniapp {
  background-color: #2B9939;
}

.course-image-container.category-uniapp {
  background: linear-gradient(135deg, #2B9939, #42b883);
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
  color: var(--text-dark);
}

.course-description {
  font-size: 14px;
  color: var(--text-light);
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

.course-duration {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-light);
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
  color: var(--text-light);
}

.progress-bar-container {
  height: 6px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #4a90e2, #50e3c2);
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
  background: linear-gradient(135deg, #4a90e2, #50e3c2);
  color: white;
}

.course-start {
  background: linear-gradient(135deg, #50e3c2, #4a90e2);
  color: white;
}

.course-continue:hover,
.course-start:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(74, 144, 226, 0.3);
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

@media (max-width: 900px) {
  .main-content {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    position: static;
  }

  .category-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .category-item {
    flex: 1;
    min-width: 140px;
  }
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    align-items: flex-start;
  }

  .search-input {
    width: 100%;
  }

  .courses-grid {
    grid-template-columns: 1fr;
  }
}
</style>