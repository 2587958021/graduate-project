<template>
  <div class="course-detail-page">
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>
    
    <div v-else-if="error" class="error-container">
      <el-empty description="加载课程失败" :image-size="200">
        <template #description>
          <p>{{ error }}</p>
        </template>
        <el-button type="primary" @click="fetchCourse">重试</el-button>
      </el-empty>
    </div>
    
    <div v-else-if="!course" class="not-found-container">
      <el-empty description="课程不存在" :image-size="200">
        <el-button type="primary" @click="$router.push('/courses')">返回课程列表</el-button>
      </el-empty>
    </div>
    
    <template v-else>
      <div class="course-header">
        <div class="course-header-content">
          <div class="course-breadcrumb">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item :to="{ path: '/courses' }">课程中心</el-breadcrumb-item>
              <el-breadcrumb-item>{{ course.title }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          
          <h1 class="course-title">{{ course.title }}</h1>
          
          <div class="course-meta">
            <span class="course-category" :class="getCategoryClass(course.category)">
              {{ course.category }}
            </span>
            <span class="course-level" :class="getLevelClass(getDisplayLevel(course))">
              {{ getDisplayLevel(course) }}
            </span>
            <span class="course-duration">
              <el-icon><Timer /></el-icon>
              {{ formatDuration(course.totalDuration) }}
            </span>
          </div>
          
          <div class="course-actions">
            <el-button 
              type="primary" 
              size="large" 
              @click="startLearning"
              :disabled="!chaptersLoaded || !course.chapters || course.chapters.length === 0"
            >
              开始学习
            </el-button>
          </div>
        </div>
        
        <div class="course-cover">
          <img :src="course.coverImage" :alt="course.title">
        </div>
      </div>
      
      <div class="course-content">
        <el-tabs v-model="activeTab" class="course-tabs">
          <el-tab-pane label="课程章节" name="chapters">
            <div class="course-chapters">
              <h2>课程大纲</h2>
              
              <div v-if="chaptersLoading" class="chapters-loading">
                <el-skeleton :rows="5" animated />
              </div>
              
              <div v-else-if="chaptersError" class="chapters-error">
                <el-alert
                  title="加载章节失败"
                  type="error"
                  description="请稍后重试"
                  show-icon
                />
                <el-button type="primary" @click="fetchChapters" class="retry-btn">重试</el-button>
              </div>
              
              <div v-else-if="!course.chapters || course.chapters.length === 0" class="chapters-empty">
                <el-empty description="暂无章节内容" />
              </div>
              
              <div v-else class="chapters-list">
                <el-collapse v-model="expandedChapters">
                  <el-collapse-item 
                    v-for="chapter in course.chapters" 
                    :key="chapter._id"
                    :title="chapter.title"
                    :name="chapter._id"
                  >
                    <div class="chapter-info">
                      <p v-if="chapter.description" class="chapter-description">
                        {{ chapter.description }}
                      </p>
                      
                      <ul class="lessons-list">
                        <li 
                          v-for="lesson in chapter.lessons" 
                          :key="lesson._id"
                          class="lesson-item"
                          @click="playLesson(chapter._id, lesson._id)"
                        >
                          <div class="lesson-title">
                            <span>{{ lesson.title }}</span>
                          </div>
                          <div class="lesson-duration">
                            {{ formatLessonDuration(lesson.duration) }}
                          </div>
                        </li>
                      </ul>
                    </div>
                  </el-collapse-item>
                </el-collapse>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Timer, Check } from '@element-plus/icons-vue';
import axios from '../../api/api';
import { ElMessage } from 'element-plus';
import { getDisplayLevel, getLevelClass } from '../utils/courseUtils';

const route = useRoute();
const router = useRouter();
const courseId = route.params.id;

// 状态变量
const course = ref(null);
const loading = ref(true);
const error = ref(null);
const activeTab = ref('chapters');
const expandedChapters = ref([]);
const chaptersLoading = ref(false);
const chaptersLoaded = ref(false);
const chaptersError = ref(null);

// 获取课程详情
const fetchCourse = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await axios.get(`/courses/${courseId}`);
    console.log('课程详情API响应:', response);
    console.log('响应类型:', typeof response);
    console.log('响应结构:', Object.keys(response));
    
    // 使用更灵活的方式处理不同响应结构
    if (response) {
      if (response.data && response.data.data) {
        // 标准嵌套结构: { data: { data: ... } }
        course.value = response.data.data;
      } else if (response.data) {
        // 简单结构: { data: ... }
        course.value = response.data;
      } else if (response.success && response.data) {
        // 标准API响应: { success: true, data: ... }
        course.value = response.data;
      } else {
        // 无法识别的结构，尝试直接使用
        console.warn('无法识别的课程详情API响应结构:', response);
        course.value = response;
      }
    } else {
      throw new Error('API响应为空');
    }
    
    console.log('处理后的课程对象:', course.value);
    
    // 初始展开第一个章节
    if (course.value && course.value.chapters && course.value.chapters.length > 0) {
      expandedChapters.value = [course.value.chapters[0]._id];
    }
  } catch (err) {
    console.error('获取课程详情失败:', err);
    error.value = err.response?.data?.message || err.message || '获取课程详情失败';
    ElMessage.error(error.value);
  } finally {
    loading.value = false;
  }
};

// 获取课程章节
const fetchChapters = async () => {
  if (chaptersLoaded.value && !chaptersError.value) return;
  
  chaptersLoading.value = true;
  chaptersError.value = null;
  
  try {
    const response = await axios.get(`/courses/${courseId}/chapters`);
    console.log('课程章节API响应:', response);
    console.log('响应类型:', typeof response);
    console.log('响应结构:', Object.keys(response));
    
    // 使用更灵活的方式处理不同响应结构
    let chaptersData = null;
    
    if (response) {
      if (response.data && response.data.data) {
        // 标准嵌套结构: { data: { data: ... } }
        chaptersData = response.data.data;
      } else if (response.data) {
        // 简单结构: { data: ... }
        chaptersData = response.data;
      } else if (response.success && response.data) {
        // 标准API响应: { success: true, data: ... }
        chaptersData = response.data;
      } else {
        // 无法识别的结构，尝试直接使用
        console.warn('无法识别的课程章节API响应结构:', response);
        chaptersData = response;
      }
    } else {
      throw new Error('章节API响应为空');
    }
    
    console.log('处理后的章节数据:', chaptersData);
    
    // 创建或更新课程对象
    if (!course.value) {
      course.value = { chapters: chaptersData };
    } else {
      course.value.chapters = chaptersData;
    }
    
    // 初始展开第一个章节
    if (course.value.chapters && course.value.chapters.length > 0) {
      expandedChapters.value = [course.value.chapters[0]._id];
    }
    
    chaptersLoaded.value = true;
  } catch (err) {
    console.error('获取课程章节失败:', err);
    chaptersError.value = err.response?.data?.message || err.message || '获取课程章节失败';
    ElMessage.error(chaptersError.value);
  } finally {
    chaptersLoading.value = false;
  }
};

// 获取分类样式类
const getCategoryClass = (category) => {
  const classMap = {
    'HTML/CSS': 'category-html',
    'JavaScript': 'category-js',
    'Vue': 'category-vue',
    'React': 'category-react'
  };
  
  return classMap[category] || 'category-other';
};

// 格式化课程总时长
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

// 格式化课时时长
const formatLessonDuration = (seconds) => {
  if (!seconds) return '';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

// 开始学习
const startLearning = () => {
  if (!course.value?.chapters || course.value.chapters.length === 0) {
    ElMessage.warning('该课程暂无章节内容');
    return;
  }
  
  // 默认第一个章节的第一个课时
  const targetChapterId = course.value.chapters[0]._id;
  const targetLessonId = course.value.chapters[0].lessons[0]._id;
  
  // 使用router.push进行导航而不是window.location.href
  router.push(`/course-player/${courseId}/${targetChapterId}/${targetLessonId}`);
};

// 播放指定课时
const playLesson = (chapterId, lessonId) => {
  router.push(`/course-player/${courseId}/${chapterId}/${lessonId}`);
};

// 生命周期钩子
onMounted(() => {
  fetchCourse();
});
</script>

<style scoped>
.course-detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.loading-container, .error-container, .not-found-container {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.course-header {
  display: flex;
  gap: 32px;
  margin-bottom: 32px;
  align-items: flex-start;
}

.course-header-content {
  flex: 1;
}

.course-breadcrumb {
  margin-bottom: 16px;
}

.course-title {
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 16px;
  line-height: 1.3;
}

.course-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.course-category, .course-level {
  padding: 4px 12px;
  border-radius: 4px;
  font-weight: 500;
  font-size: 14px;
}

.category-html {
  background-color: #e44d26;
  color: white;
}

.category-js {
  background-color: #f7df1e;
  color: #333;
}

.category-vue {
  background-color: #42b883;
  color: white;
}

.category-react {
  background-color: #61dafb;
  color: #333;
}

.category-other {
  background-color: #9c27b0;
  color: white;
}

.level-beginner {
  background-color: #e3f2fd;
  color: #1976d2;
}

.level-intermediate {
  background-color: #fff9c4;
  color: #fbc02d;
}

.level-advanced {
  background-color: #ffebee;
  color: #c62828;
}

.course-duration {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--text-light);
  padding: 4px 0;
}

.course-actions {
  margin-top: 24px;
}

.course-cover {
  width: 300px;
  height: 200px;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.course-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.course-content {
  margin-top: 32px;
}

.course-tabs {
  background-color: var(--card-background);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.course-chapters h2 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 24px;
  color: var(--text-dark);
}

.chapters-loading, .chapters-error, .chapters-empty {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.retry-btn {
  margin-top: 16px;
}

.chapter-description {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 16px;
  color: var(--text-light);
  white-space: pre-line;
}

.lessons-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.lesson-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 8px;
  background-color: var(--background-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.lesson-item:hover {
  background-color: rgba(74, 108, 247, 0.08);
}

.lesson-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.lesson-duration {
  font-size: 14px;
  color: var(--text-light);
}

@media (max-width: 768px) {
  .course-header {
    flex-direction: column-reverse;
  }
  
  .course-cover {
    width: 100%;
    height: auto;
    aspect-ratio: 16/9;
    margin-bottom: 24px;
  }
}
</style> 