<template>
  <div class="course-player-page">
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>
    
    <div v-else-if="error" class="error-container">
      <el-empty description="加载失败" :image-size="200">
        <template #description>
          <p>{{ error }}</p>
        </template>
        <el-button type="primary" @click="fetchLesson">重试</el-button>
        <el-button @click="$router.push('/courses')">返回课程中心</el-button>
      </el-empty>
    </div>
    
    <template v-else>
      <div class="player-header">
        <div class="player-nav">
          <el-button @click="$router.push('/courses')" class="back-button">
            <el-icon><ArrowLeft /></el-icon>
            返回课程
          </el-button>
          
          <div class="lesson-info">
            <h1 class="lesson-title">{{ lessonTitle }}</h1>
            <div class="course-info">
              <span class="course-title">{{ courseTitle }}</span>
              <span class="chapter-title">{{ chapterTitle }}</span>
            </div>
          </div>
          
          <div class="player-actions">
            <!-- 删除原先的标记完成按钮 -->
            <!-- <el-button 
              v-if="!lessonCompleted"
              type="primary" 
              @click="markLessonAsCompleted"
              :disabled="markingCompleted"
            >
              标记为已完成
            </el-button>
            <el-button 
              v-else
              type="success" 
              disabled
            >
              <el-icon><Check /></el-icon>
              已完成
            </el-button> -->
          </div>
        </div>
      </div>
      
      <div class="player-container">
        <div class="player-content">
          <div class="video-container">
            <div class="bilibili-redirect-container">
              <div class="bilibili-logo">
                <img src="/images/bilibili-logo.png" alt="哔哩哔哩" onerror="this.src='https://www.bilibili.com/favicon.ico'">
                </div>
              <div class="redirect-message">
                <h3>{{ courseTitle }}</h3>
                <p>本课程视频托管在哔哩哔哩，请点击下方按钮观看完整高清视频</p>
              </div>
              <el-button 
                type="primary" 
                size="large" 
                class="bilibili-button"
                @click="openBilibili"
              >
                <el-icon class="btn-icon"><VideoPlay /></el-icon>
                在B站观看视频
                </el-button>
              <div class="tips">
                <p>提示：视频将在新标签页中打开，学习完成后请返回本页面继续学习</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="player-navigation">
          <el-button
            v-if="prevLesson"
            @click="navigateToLesson(prevLesson.chapterId, prevLesson.lessonId)"
            class="nav-button prev-button"
          >
            <el-icon><ArrowLeft /></el-icon>
            上一课
          </el-button>
          
          <div class="navigation-spacer"></div>
          
          <el-button
            v-if="nextLesson"
            @click="navigateToLesson(nextLesson.chapterId, nextLesson.lessonId)"
            class="nav-button next-button"
            type="primary"
          >
            下一课
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, ArrowRight, Check, VideoPlay, CircleClose, Loading, Refresh } from '@element-plus/icons-vue';
import axios from '@/api/api';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/store/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// 路由参数
const courseId = route.params.courseId;
const chapterId = route.params.chapterId;
const lessonId = route.params.lessonId;

// 状态变量
const loading = ref(true);
const error = ref(null);
const courseTitle = ref('');
const chapterTitle = ref('');
const lessonTitle = ref('');
const lessonDescription = ref('');
const videoEmbedCode = ref('');
const chapters = ref([]);
const chaptersLoading = ref(false);
const chaptersLoaded = ref(false);
const chaptersError = ref(null);
const biliVideoLink = ref('');
const course = ref(null);
const expandedChapters = ref([]);

// 获取当前课时内容
const fetchLesson = async () => {
  loading.value = true;
  error.value = null;
  
  // 检查课程ID是否存在
  if (!courseId) {
    error.value = '课程ID不能为空';
    loading.value = false;
    ElMessage.error(error.value);
    return;
  }
  
  // 如果只有课程ID但没有章节ID或课时ID，先加载章节信息
  if (!chapterId || !lessonId) {
    console.log('只有课程ID，尝试加载章节信息并导航到第一个课时');
    await fetchChapters();
    // fetchChapters中会处理导航到第一个课时
    return;
  }
  
  try {
    console.log(`请求课时详情: /courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`);
    const response = await axios.get(`/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`);
    console.log('课时详情响应:', response);
    
    // 由于axios拦截器已经返回了response.data，所以直接使用response
    courseTitle.value = response.courseTitle || '';
    chapterTitle.value = response.chapterTitle || '';
    
    if (response.lesson) {
      lessonTitle.value = response.lesson.title || response.lesson.description || '';
      lessonDescription.value = response.lesson.description || '';
      videoEmbedCode.value = response.lesson.embedCode || '';
      biliVideoLink.value = response.lesson.biliVideoLink || '';
    } else {
      console.warn('课时数据为空');
    }
    
  } catch (err) {
    console.error('获取课时详情失败:', err);
    error.value = err.response?.data?.message || err.message || '获取课时详情失败';
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
    console.log(`请求课程章节: /courses/${courseId}/chapters`);
    const response = await axios.get(`/courses/${courseId}/chapters`);
    console.log('课程章节API响应:', response);
    
    // 由于axios拦截器已经返回了response.data，所以直接使用response
    if (response && response.success) {
      chapters.value = response.data || [];
    } else if (Array.isArray(response)) {
      chapters.value = response;
    } else {
      console.warn('无法识别的课程章节API响应结构:', response);
      chapters.value = [];
      throw new Error('章节API响应格式不正确');
    }
    
    // 初始展开第一个章节
    if (chapters.value && chapters.value.length > 0) {
      expandedChapters.value = [chapters.value[0]._id];
    }
    
    chaptersLoaded.value = true;
    
    // 如果没有指定章节和课时，导航到第一个课时
    if (!chapterId || !lessonId) {
      if (chapters.value && 
          chapters.value.length > 0 && 
          chapters.value[0].lessons && 
          chapters.value[0].lessons.length > 0) {
        
        const firstChapter = chapters.value[0];
        const firstLesson = firstChapter.lessons[0];
        
        // 使用router.push而不是replace，以支持浏览器的前进后退功能
        router.push(`/course-player/${courseId}/${firstChapter._id}/${firstLesson._id}`);
      }
    }
  } catch (err) {
    console.error('获取课程章节失败:', err);
    chaptersError.value = err.response?.data?.message || err.message || '获取课程章节失败';
    ElMessage.error(chaptersError.value);
  } finally {
    chaptersLoading.value = false;
  }
};

// 检查是否是当前课时
const isCurrentLesson = (cId, lId) => {
  return cId === chapterId && lId === lessonId;
};

// 格式化时长
const formatDuration = (seconds) => {
  if (!seconds) return '';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

// 计算上一课
const prevLesson = computed(() => {
  if (!chapters.value || chapters.value.length === 0) return null;
  
  let prevChapterIndex = -1;
  let prevLessonIndex = -1;
  
  // 找到当前章节和课时的索引
  const currentChapterIndex = chapters.value.findIndex(c => c._id === chapterId);
  
  if (currentChapterIndex === -1) return null;
  
  const currentChapter = chapters.value[currentChapterIndex];
  const currentLessonIndex = currentChapter.lessons.findIndex(l => l._id === lessonId);
  
  if (currentLessonIndex === -1) return null;
  
  // 如果不是第一个课时，返回同一章节的上一个课时
  if (currentLessonIndex > 0) {
    return {
      chapterId: currentChapter._id,
      lessonId: currentChapter.lessons[currentLessonIndex - 1]._id
    };
  }
  
  // 如果是章节的第一个课时，且不是第一个章节，返回上一章节的最后一个课时
  if (currentChapterIndex > 0) {
    const prevChapter = chapters.value[currentChapterIndex - 1];
    if (prevChapter.lessons.length > 0) {
      return {
        chapterId: prevChapter._id,
        lessonId: prevChapter.lessons[prevChapter.lessons.length - 1]._id
      };
    }
  }
  
  // 没有上一课
  return null;
});

// 计算下一课
const nextLesson = computed(() => {
  if (!chapters.value || chapters.value.length === 0) return null;
  
  // 找到当前章节和课时的索引
  const currentChapterIndex = chapters.value.findIndex(c => c._id === chapterId);
  
  if (currentChapterIndex === -1) return null;
  
  const currentChapter = chapters.value[currentChapterIndex];
  const currentLessonIndex = currentChapter.lessons.findIndex(l => l._id === lessonId);
  
  if (currentLessonIndex === -1) return null;
  
  // 如果不是最后一个课时，返回同一章节的下一个课时
  if (currentLessonIndex < currentChapter.lessons.length - 1) {
    return {
      chapterId: currentChapter._id,
      lessonId: currentChapter.lessons[currentLessonIndex + 1]._id
    };
  }
  
  // 如果是章节的最后一个课时，且不是最后一个章节，返回下一章节的第一个课时
  if (currentChapterIndex < chapters.value.length - 1) {
    const nextChapter = chapters.value[currentChapterIndex + 1];
    if (nextChapter.lessons.length > 0) {
      return {
        chapterId: nextChapter._id,
        lessonId: nextChapter.lessons[0]._id
      };
    }
  }
  
  // 没有下一课
  return null;
});

// 监听路由变化
watch(
  () => route.params,
  (newParams, oldParams) => {
    if (
      newParams.courseId !== oldParams.courseId ||
      newParams.chapterId !== oldParams.chapterId ||
      newParams.lessonId !== oldParams.lessonId
    ) {
      console.log('路由参数变化，重新加载课时');
      // 重置状态
      videoEmbedCode.value = '';
      
      // 重新加载课时
      fetchLesson();
    }
  }
);

// 组件销毁时清理资源
onUnmounted(() => {
  // 不再需要停止进度跟踪
});

// 组件挂载时加载课时
onMounted(() => {
  fetchLesson();
});

// 打开B站视频
const openBilibili = () => {
  if (biliVideoLink.value) {
    window.open(biliVideoLink.value, '_blank');
  } else {
    ElMessage.warning('视频链接不可用');
  }
};

// 导航到指定课时
const navigateToLesson = (targetChapterId, targetLessonId) => {
  if (!targetChapterId || !targetLessonId) return;
  
  // 使用router.push进行导航，保留浏览器历史记录
  router.push(`/course-player/${courseId}/${targetChapterId}/${targetLessonId}`);
};
</script>

<style scoped>
.course-player-page {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0;
}

.loading-container, .error-container {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 24px;
}

.player-header {
  background-color: var(--card-background);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 16px 24px;
  position: sticky;
  top: 68px;
  z-index: 10;
}

.player-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 4px;
}

.lesson-info {
  flex: 1;
  min-width: 0;
}

.lesson-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course-info {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: var(--text-light);
}

.course-title {
  margin-right: 12px;
  position: relative;
}

.course-title::after {
  content: '';
  display: inline-block;
  width: 4px;
  height: 4px;
  background-color: var(--text-light);
  border-radius: 50%;
  margin-left: 8px;
  position: relative;
  top: -3px;
}

.player-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
}

.player-content {
  display: flex;
  gap: 24px;
}

.video-container {
  flex: 1;
  background-color: var(--card-background);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.video-wrapper {
  position: relative;
  padding-top: 56.25%; /* 16:9 Aspect Ratio */
  overflow: hidden;
}

.video-wrapper :deep(iframe) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

.player-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
}

.navigation-spacer {
  flex: 1;
}

.nav-button {
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

@media (max-width: 768px) {
  .player-nav {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .player-actions {
    align-self: flex-end;
  }
}

.video-hd-tip {
  margin-top: 12px;
  padding: 0 12px;
}

.bilibili-link {
  color: #00aeec;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s ease;
}

.bilibili-link:hover {
  color: #00a1d6;
  text-decoration: underline;
}

.video-loading-overlay, .video-error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.loading-content, .error-content {
  text-align: center;
  color: #fff;
  padding: 24px;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.5);
}

.loading-spinner {
  margin-bottom: 16px;
  font-size: 48px;
  height: 48px;
}

.error-icon {
  font-size: 48px;
  color: #f56c6c;
  margin-bottom: 16px;
}

.loading-text, .error-text {
  margin-bottom: 16px;
  font-size: 18px;
}

.reload-button {
  margin-top: 16px;
}

.video-controls {
  position: absolute;
  bottom: 24px;
  right: 24px;
  z-index: 90;
  opacity: 0.4;
  transition: opacity 0.3s ease;
}

.video-controls:hover {
  opacity: 1;
}

.bilibili-redirect-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background-color: #f8f9fa;
  border-radius: 8px;
  text-align: center;
  height: 100%;
  min-height: 360px;
}

.bilibili-logo {
  margin-bottom: 16px;
}

.bilibili-logo img {
  width: 60px;
  height: 60px;
  object-fit: contain;
}

.redirect-message {
  margin-bottom: 24px;
}

.redirect-message h3 {
  margin-bottom: 12px;
  font-size: 1.5rem;
  color: #333;
}

.redirect-message p {
  color: #666;
  font-size: 1rem;
}

.bilibili-button {
  padding: 12px 24px;
  font-size: 1.1rem;
}

.btn-icon {
  margin-right: 8px;
}

.tips {
  margin-top: 16px;
  color: #999;
  font-size: 0.9rem;
}

.lesson-button {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
  margin: 0;
  height: auto;
  text-align: left;
}

.lesson-button:hover {
  background: transparent;
}
</style> 