<template>
  <div class="practice-container">
    <div class="page-header">
      <h1 class="title">前端练习题库</h1>
      <div class="description">
        通过题库练习巩固前端开发知识，跟踪您的学习进度
      </div>
    </div>

    <div class="tabs">
      <div class="tab" :class="{ active: activeTab === 'list' }" @click="activeTab = 'list'">
        题库浏览
      </div>
    </div>

    <!-- 练习题列表 -->
    <ExerciseList v-if="activeTab === 'list'" @select-exercise="selectExercise" />

    <!-- 练习测试 -->
    <ExerciseTest v-if="activeTab === 'test'" :key="exerciseTestKey" :pre-selected-ids="selectedExerciseIds"
      @finish="onFinishExercise" />
  </div>
</template>

<script>
import ExerciseList from './ExerciseList.vue';
import ExerciseTest from './ExerciseTest.vue';
import api from '@/api/api.js';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'Practice',
  components: {
    ExerciseList,
    ExerciseTest
  },
  setup() {
    const router = useRouter();
    const activeTab = ref('list');
    const selectedExerciseIds = ref([]);
    const exerciseTestKey = ref(0);

    // 选择特定练习题
    const selectExercise = (exerciseId) => {
      console.log('选择练习题，ID:', exerciseId);

      // 如果没有ID，生成一个临时ID
      const id = exerciseId ? String(exerciseId) : `temp_${Date.now()}`;

      if (!exerciseId) {
        console.warn('收到无效的练习题ID，使用临时ID:', id);
      }

      selectedExerciseIds.value = [id];
      console.log('设置预选练习题IDs:', selectedExerciseIds.value);

      // 确保ID已经设置后再切换视图
      setTimeout(() => {
        activeTab.value = 'test';
        // 更新key以强制重新渲染组件
        exerciseTestKey.value++;
        console.log('切换到测试视图，key:', exerciseTestKey.value);
      }, 0);
    };

    // 完成练习
    const onFinishExercise = async () => {
      // 手动触发练习更新事件，确保返回题库时数据更新
      console.log('准备触发练习更新事件（练习完成）...');

      try {
        // 生成唯一的时间戳
        const timestamp = new Date().getTime();

        // 强制刷新统计数据
        try {
          console.log('强制刷新统计数据...');
          await api.get('/exercises/stats', {
            params: {
              _t: timestamp,
              forceRefresh: true
            }
          });
          console.log('统计数据已强制刷新');
        } catch (err) {
          console.error('强制刷新统计数据失败', err);
        }

        // 立即触发一次事件
        const exerciseUpdateEvent = new CustomEvent('exercise-updated', {
          detail: {
            timestamp: new Date().toISOString(),
            forceRefresh: true,
            source: 'onFinishExercise'
          }
        });
        window.dispatchEvent(exerciseUpdateEvent);
        console.log('练习完成，已立即触发练习更新事件');

        // 添加一个小延迟，确保有足够时间处理
        setTimeout(() => {
          const delayedEvent = new CustomEvent('exercise-updated', {
            detail: {
              timestamp: new Date().toISOString(),
              forceRefresh: true,
              source: 'onFinishExercise',
              delayed: true
            }
          });
          window.dispatchEvent(delayedEvent);
          console.log('练习完成，已延迟触发练习更新事件（二次确认）');

          // 切换回列表视图
          activeTab.value = 'list';
        }, 500);
      } catch (error) {
        console.error('更新数据失败:', error);
        // 即使出错也切换回列表视图
        activeTab.value = 'list';
      }
    };

    return {
      activeTab,
      selectedExerciseIds,
      exerciseTestKey,
      selectExercise,
      onFinishExercise
    };
  }
};
</script>

<style scoped>
.practice-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  height: 100vh;
  overflow-y: auto;
}

html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

.title {
  font-size: 28px;
  color: #2c3e50;
  margin-bottom: 8px;
}

.description {
  color: #606266;
  font-size: 16px;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 20px;
}

.tab {
  padding: 12px 20px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  margin-right: 10px;
  border-bottom: 2px solid transparent;
}

.tab:hover {
  color: #409eff;
}

.tab.active {
  color: #409eff;
  border-bottom: 2px solid #409eff;
}
</style>