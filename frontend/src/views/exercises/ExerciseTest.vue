<template>
  <div class="exercise-test-container">
    <div class="header">
      <h1 class="page-title">练习题</h1>
      <div class="progress-info">
        <div class="progress-bar">
          <div class="progress-filled" :style="{ width: `${progressPercentage}%` }"></div>
        </div>
        <div class="progress-text">{{ currentIndex + 1 }} / {{ exercises.length }}</div>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="error-msg">
      <p>{{ error }}</p>
      <button @click="goBack" class="btn btn-back">返回</button>
    </div>

    <div v-else-if="exercises.length === 0" class="no-exercises">
      <p>没有找到练习题</p>
      <button @click="goBack" class="btn btn-back">返回</button>
    </div>

    <div v-else class="exercise-content">
      <div class="exercise-card" :key="`q-${currentIndex}-${refreshKey}`"
        :class="{ 'incorrect': showAnswer && !isCorrect, 'correct': showAnswer && isCorrect }">
        <div class="exercise-info">
          <span class="exercise-type" :class="currentExercise.type">{{ getTypeName(currentExercise.type) }}</span>
          <span class="exercise-category">{{ getCategoryName(currentExercise.category) }}</span>
        </div>

        <h2 class="exercise-title">{{ currentExercise.title }}</h2>
        <div class="knowledge-point">知识点: {{ currentExercise.knowledgePoint }}</div>

        <div class="exercise-question">
          <p v-html="formatContent(currentExercise.content)"></p>
        </div>

        <!-- 单选题组件 -->
        <SingleChoiceExercise v-if="currentExercise.type && currentExercise.type.toLowerCase() === 'single-choice'"
          :exercise="currentExercise" :userAnswer="userAnswers[currentIndex]" @answer="setAnswer"
          :showAnswer="showAnswer" />

        <!-- 多选题组件 -->
        <MultipleChoiceExercise
          v-else-if="currentExercise.type && currentExercise.type.toLowerCase() === 'multiple-choice'"
          :exercise="currentExercise" :userAnswer="userAnswers[currentIndex]" @answer="setAnswer"
          :showAnswer="showAnswer" />

        <!-- 判断题组件 -->
        <TrueFalseExercise v-else-if="currentExercise.type && currentExercise.type.toLowerCase() === 'true-false'"
          :exercise="currentExercise" :userAnswer="userAnswers[currentIndex]" @answer="setAnswer"
          :showAnswer="showAnswer" />

        <!-- 简答题组件 -->
        <ShortAnswerExercise v-else-if="currentExercise.type && currentExercise.type.toLowerCase() === 'short-answer'"
          :exercise="currentExercise" :userAnswer="userAnswers[currentIndex]" @answer="setAnswer"
          :showAnswer="showAnswer" />

        <!-- 代码补全题组件 -->
        <CodeCompletionExercise
          v-else-if="currentExercise.type && currentExercise.type.toLowerCase() === 'code-completion'"
          :exercise="currentExercise" :userAnswer="userAnswers[currentIndex]" @answer="setAnswer"
          :showAnswer="showAnswer" />

        <!-- 面试题组件 -->
        <InterviewExercise v-else-if="currentExercise.type && currentExercise.type.toLowerCase() === 'interview'"
          :exercise="currentExercise" :userAnswer="userAnswers[currentIndex]" @answer="setAnswer"
          :showAnswer="showAnswer" />

        <!-- 未知题型 -->
        <div v-else class="unknown-type">
          <p>不支持的题目类型: {{ currentExercise.type || '未知' }}</p>
          <p>题目数据: {{ JSON.stringify(currentExercise).slice(0, 100) + '...' }}</p>
        </div>

        <!-- 答案解析部分 -->
        <div v-if="showAnswer" class="answer-explanation">
          <h3>答案解析</h3>
          <div class="answer-status" :class="isCorrect ? 'correct' : 'incorrect'">
            {{ isCorrect ? '回答正确' : '回答错误' }}
          </div>
          <div class="correct-answer">
            <strong>正确答案:</strong>
            <span v-if="currentExercise.type && currentExercise.type.toLowerCase() === 'single-choice'">
              {{ getOptionText(currentExercise.answer) }}
            </span>
            <span v-else-if="currentExercise.type && currentExercise.type.toLowerCase() === 'multiple-choice'">
              {{ getMultipleOptionText(currentExercise.answer) }}
            </span>
            <span v-else-if="currentExercise.type && currentExercise.type.toLowerCase() === 'true-false'">
              {{ currentExercise.answer ? '正确' : '错误' }}
            </span>
            <span v-else>{{ currentExercise.answer }}</span>
          </div>
        </div>
      </div>

      <div class="exercise-actions">
        <button v-if="!showAnswer" @click="checkAnswer" class="btn btn-check" :disabled="!hasAnswer">
          提交答案
        </button>

        <button @click="goBackToList" class="btn btn-back">
          返回题库
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getExercise, getExercisesByCategory, submitExercise } from '@/api/exercises.js';
import mistakeAPI from '@/api/mistakes.js';
import { ElMessage } from 'element-plus';
import SingleChoiceExercise from '@/components/exercises/SingleChoiceExercise.vue';
import MultipleChoiceExercise from '@/components/exercises/MultipleChoiceExercise.vue';
import TrueFalseExercise from '@/components/exercises/TrueFalseExercise.vue';
import ShortAnswerExercise from '@/components/exercises/ShortAnswerExercise.vue';
import CodeCompletionExercise from '@/components/exercises/CodeCompletionExercise.vue';
import InterviewExercise from '@/components/exercises/InterviewExercise.vue';

export default {
  name: 'ExerciseTest',
  components: {
    SingleChoiceExercise,
    MultipleChoiceExercise,
    TrueFalseExercise,
    ShortAnswerExercise,
    CodeCompletionExercise,
    InterviewExercise
  },
  props: {
    preSelectedIds: {
      type: Array,
      default: () => []
    }
  },
  emits: ['finish'],
  setup(props, { emit }) {
    const router = useRouter();
    const route = useRoute();

    const loading = ref(true);
    const error = ref(null);
    const exercises = ref([]);
    const currentIndex = ref(0);
    const userAnswers = ref([]);
    const showAnswer = ref(false);
    const isCorrect = ref(false);
    const refreshKey = ref(0);

    // 当前题目ID，用于强制组件重新渲染
    const currentQuestionId = ref('initial');

    const currentExercise = computed(() => {
      const exercise = exercises.value[currentIndex.value] || {};

      // 更新当前题目ID
      if (exercise._id) {
        currentQuestionId.value = exercise._id;
      }
      return exercise;
    });

    // 当前题目标题，用于测试
    const currentTitle = computed(() => {
      return currentExercise.value.title || '无标题';
    });

    const progressPercentage = computed(() => {
      if (exercises.value.length === 0) return 0;
      return ((currentIndex.value + 1) / exercises.value.length) * 100;
    });

    const hasAnswer = computed(() => {
      const answer = userAnswers.value[currentIndex.value];
      const exerciseType = currentExercise.value.type && currentExercise.value.type.toLowerCase();

      // 特殊处理判断题，因为false也是有效答案
      if (exerciseType === 'true-false') {
        return answer === true || answer === false;
      }

      // 对于其他题型，null、undefined或空值都视为没有答案
      if (answer === null || answer === undefined) return false;

      if (exerciseType === 'multiple-choice') {
        return answer.length > 0;
      }

      if (exerciseType === 'short-answer' || exerciseType === 'code-completion' || exerciseType === 'interview') {
        return answer.trim().length > 0;
      }

      return true;
    });

    const fetchExercises = async () => {
      loading.value = true;

      try {
        // 尝试从路由中获取ID
        const exerciseId = route.params.id || route.query.id;

        // 如果有预选的ID数组，优先使用
        if (props.preSelectedIds && props.preSelectedIds.length > 0) {

          // 过滤掉无效的ID
          const validIds = props.preSelectedIds.filter(id => id && typeof id === 'string');

          if (validIds.length === 0) {
            console.error('没有有效的练习题ID');
            // 使用模拟数据
            useMockData();
            return;
          }

          try {
            // 按ID获取多个练习题
            const exercisePromises = validIds.map(id => getExercise(id));
            const responses = await Promise.all(exercisePromises);

            exercises.value = responses.map(res => {
              if (res.data && res.data.data) {
                return res.data.data;
              } else if (res.data) {
                return res.data;
              }
              return null;
            }).filter(ex => ex !== null);

            if (exercises.value.length === 0) {
              console.warn('未能获取有效的练习题数据，使用模拟数据');
              useMockData();
              return;
            }
          } catch (error) {
            console.error('获取练习题失败，使用模拟数据:', error);
            useMockData();
            return;
          }
        }
        // 如果有路由ID参数，获取单个练习题
        else if (exerciseId) {
          console.log(`通过ID ${exerciseId} 获取单个练习题`);

          try {
            const response = await getExercise(exerciseId);
            console.log('获取到的单个练习题响应:', response);

            if (response.data && response.data.data) {
              exercises.value = [response.data.data];
            } else if (response.data) {
              exercises.value = [response.data];
            } else {
              exercises.value = [];
            }

            console.log('处理后的练习题数据:', exercises.value);

            if (exercises.value.length === 0) {
              console.warn('未能获取有效的练习题数据，使用模拟数据');
              useMockData();
              return;
            }
          } catch (error) {
            console.error('获取练习题失败，使用模拟数据:', error);
            useMockData();
            return;
          }
        }
        // 如果没有ID参数，显示错误信息
        else {
          console.warn('未指定练习题，使用模拟数据');
          useMockData();
          return;
        }

        // 初始化用户答案数组
        userAnswers.value = Array(exercises.value.length).fill(null);

      } catch (err) {
        console.error('获取练习题失败，使用模拟数据', err);
        useMockData();
      } finally {
        loading.value = false;
        console.log('练习题数据获取完成，当前索引:', currentIndex.value);
        console.log('当前练习题:', currentExercise.value);
      }
    };

    // 使用模拟数据
    const useMockData = () => {
      console.log('使用模拟数据');
      exercises.value = [
        {
          _id: 'mock1',
          title: 'JavaScript中如何添加事件监听器？',
          type: 'single-choice',
          content: '以下哪种方法可以为HTML元素添加事件监听器？',
          options: [
            { id: 'A', text: 'element.addEventListener(event, function)' },
            { id: 'B', text: 'element.attachEvent(event, function)' },
            { id: 'C', text: 'element.addEvent(event, function)' },
            { id: 'D', text: 'element.listenTo(event, function)' }
          ],
          answer: 'A',
          explanation: 'addEventListener是标准的DOM方法，用于为元素添加事件监听器。',
          difficulty: 'easy',
          category: 'javascript',
          knowledgePoint: 'DOM事件'
        },
        {
          _id: 'mock2',
          title: 'Vue v-for用途',
          type: 'true-false',
          content: 'Vue中的v-for指令可以用于渲染列表。',
          answer: true,
          explanation: 'v-for指令用于循环渲染元素或模板，通常用于显示数组或对象中的数据。',
          difficulty: 'easy',
          category: 'framework',
          knowledgePoint: 'Vue基础'
        },
        {
          _id: 'mock3',
          title: 'CSS选择器优先级',
          type: 'single-choice',
          content: '下列哪个CSS选择器优先级最高？',
          options: [
            { id: 'A', text: '元素选择器 (如 div)' },
            { id: 'B', text: '类选择器 (如 .class)' },
            { id: 'C', text: 'ID选择器 (如 #id)' },
            { id: 'D', text: '内联样式 (style属性)' }
          ],
          answer: 'D',
          explanation: '内联样式具有最高的优先级，其次是ID选择器、类选择器，最后是元素选择器。',
          difficulty: 'medium',
          category: 'html_css',
          knowledgePoint: 'CSS优先级'
        }
      ];

      // 初始化用户答案数组
      userAnswers.value = Array(exercises.value.length).fill(null);

      // 清除错误状态
      error.value = null;
    };

    const setAnswer = (answer) => {
      console.log('设置答案:', answer, '类型:', typeof answer);
      userAnswers.value[currentIndex.value] = answer;

      // 特别处理判断题
      if (currentExercise.value.type && currentExercise.value.type.toLowerCase() === 'true-false') {
        console.log('判断题答案已设置:', answer, '类型:', typeof answer);
        console.log('hasAnswer值:', hasAnswer.value);
      }
    };

    const checkAnswer = async () => {
      const exercise = currentExercise.value;
      const userAnswer = userAnswers.value[currentIndex.value];
      const exerciseType = exercise.type && exercise.type.toLowerCase();

      // 验证答案有效性
      if (userAnswer === null || userAnswer === undefined) {
        ElMessage.warning('请先回答问题');
        return;
      }

      console.log('提交答案:', userAnswer, '类型:', exerciseType);

      // 检查答案是否正确
      if (exerciseType === 'multiple-choice') {
        // 多选题比较数组
        const sortedUserAnswer = [...userAnswer].sort();
        const sortedCorrectAnswer = [...exercise.answer].sort();
        isCorrect.value = JSON.stringify(sortedUserAnswer) === JSON.stringify(sortedCorrectAnswer);
      } else if (exerciseType === 'short-answer' || exerciseType === 'code-completion') {
        // 简答题、代码补全题简单匹配
        isCorrect.value = userAnswer.trim() === exercise.answer.trim();
      } else if (exerciseType === 'interview') {
        // 面试题特殊处理：由于面试题通常没有标准答案，我们可以：
        // 1. 总是认为用户回答是错误的，以便添加到错题本进行复习
        // 2. 或者进行一些简单的关键词匹配
        isCorrect.value = false; // 默认为错误，确保添加到错题本
        console.log('面试题回答:', userAnswer, '参考答案:', exercise.answer);
      } else if (exerciseType === 'true-false') {
        // 判断题特殊处理，确保比较的是布尔值
        // 直接比较布尔值，不使用严格相等
        isCorrect.value = userAnswer === exercise.answer;
        console.log('判断题比较:', userAnswer, exercise.answer, isCorrect.value);
      } else {
        // 单选题直接比较
        isCorrect.value = userAnswer === exercise.answer;
      }

      // 保存完成的题目
      await saveCompletionStatus();

      // 调用后端API提交答案
      try {
        await submitExercise(exercise._id, userAnswer, {
          knowledgePoint: exercise.knowledgePoint || 'unknown',
          type: exercise.type || 'unknown',
          category: exercise.category || 'unknown',
          title: exercise.title || ''
        });

        // 如果答错了，自动添加到错题本（包括面试题）
        if (!isCorrect.value) {
          try {
            const currentEx = currentExercise.value;
            console.log('准备添加到错题本：', {
              exerciseId: currentEx._id,
              userAnswer: userAnswer,
              type: exerciseType
            });

            // 获取用户ID
            const userInfo = localStorage.getItem('user');
            let userId = null;
            if (userInfo) {
              try {
                const user = JSON.parse(userInfo);
                userId = user._id || user.id;
                // 确保userId格式正确
                if (userId && userId.startsWith('user_')) {
                  userId = userId.substring(5);
                }
              } catch (err) {
                console.warn('无法解析用户信息', err);
              }
            }

            // 如果没有找到用户ID，使用默认ID
            if (!userId) {
              userId = '1748618904860';
            }

            console.log(`使用用户ID添加错题: ${userId}`);

            // 添加到错题本，显式传递userId
            const response = await mistakeAPI.addToMistakes(
              currentEx._id,
              "自动添加的错题",
              userAnswer
            );
            console.log('错题本API响应：', response);

            // 检查响应是否成功
            if (response && response.success) {
              // 显示更明显的成功提示
              ElMessage({
                message: '已自动添加到错题本，可在个人中心查看',
                type: 'success',
                duration: 3000,
                showClose: true
              });

              console.log('错题添加成功，数据:', response.data);
            } else {
              // 显示警告信息
              console.warn('错题本API响应异常:', response);
              ElMessage({
                message: '添加到错题本失败，请稍后重试',
                type: 'warning',
                duration: 2000
              });
            }
          } catch (error) {
            console.error('添加到错题本失败:', error);
            console.error('错误详情:', error.response ? error.response.data : error.message);

            // 显示错误提示，但不影响用户继续做题
            ElMessage({
              message: '添加到错题本时出现问题，请稍后在个人中心手动添加',
              type: 'error',
              duration: 3000,
              showClose: true
            });
          }
        }
      } catch (error) {
        console.error('提交答案失败:', error);
      }

      showAnswer.value = true;
    };

    const saveCompletionStatus = async () => {
      const exerciseId = currentExercise.value._id;
      if (!exerciseId) {
        console.error('无法保存完成状态：题目ID不存在');
        return;
      }

      try {
        // 获取当前用户的答案
        const currentUserAnswer = userAnswers.value[currentIndex.value];

        console.log('保存答案到服务器:', currentUserAnswer, '类型:', currentExercise.value?.type);

        // 生成唯一的时间戳，防止缓存
        const timestamp = new Date().getTime();

        // 保存到服务器
        try {
          console.log('提交练习记录到服务器...');
          const response = await submitExercise(exerciseId, currentUserAnswer, {
            knowledgePoint: currentExercise.value?.knowledgePoint || '',
            type: currentExercise.value?.type || 'unknown',
            category: currentExercise.value?.category || 'unknown',
            title: currentExercise.value?.title || `题目${exerciseId}`,
            _t: timestamp,
            forceRefresh: true
          });
          console.log('保存练习记录响应:', response);

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

          // 手动触发更新事件，确保所有页面都能更新数据
          console.log('准备触发练习更新事件...');

          // 立即触发一次事件
          const exerciseUpdateEvent = new CustomEvent('exercise-updated', {
            detail: {
              exerciseId,
              isCorrect: isCorrect.value,
              timestamp: new Date().toISOString(),
              forceRefresh: true
            }
          });
          window.dispatchEvent(exerciseUpdateEvent);
          console.log('已立即触发练习更新事件');

          // 再添加一个延迟触发，确保API请求完全完成
          setTimeout(() => {
            const delayedEvent = new CustomEvent('exercise-updated', {
              detail: {
                exerciseId,
                isCorrect: isCorrect.value,
                timestamp: new Date().toISOString(),
                forceRefresh: true,
                delayed: true
              }
            });
            window.dispatchEvent(delayedEvent);
            console.log('已延迟触发练习更新事件（二次确认）');
          }, 500);
        } catch (error) {
          console.error('保存练习记录到服务器失败:', error);
        }

        console.log(`题目 ${exerciseId} 已标记为完成，正确: ${isCorrect.value}，用户答案:`, currentUserAnswer);
      } catch (error) {
        console.error('保存完成的题目状态失败:', error);
      }
    };

    const updateExerciseStats = (isCorrect) => {
      // 统计数据现在直接保存在服务器，不再需要本地更新
      console.log(`更新统计数据: ${isCorrect ? '答对' : '答错'}`);
    };

    const goBackToList = () => {
      // 不再需要清除本地存储
      // 手动触发练习更新事件，确保返回题库时数据更新
      console.log('准备触发练习更新事件（返回题库）...');

      // 添加一个小延迟，确保有足够时间处理
      setTimeout(() => {
        const exerciseUpdateEvent = new CustomEvent('exercise-updated', {
          detail: {
            timestamp: new Date().toISOString(),
            forceRefresh: true,
            source: 'goBackToList'
          }
        });
        window.dispatchEvent(exerciseUpdateEvent);
        console.log('返回题库前已手动触发练习更新事件（带强制刷新）');

        emit('finish');
        router.push('/practice');
      }, 300);
    };

    const getOptionText = (optionId) => {
      const option = currentExercise.value.options.find(opt => opt.id === optionId);
      return option ? `${option.id}. ${option.text}` : '';
    };

    const getMultipleOptionText = (optionIds) => {
      return optionIds.map(id => {
        const option = currentExercise.value.options.find(opt => opt.id === id);
        return option ? `${option.id}. ${option.text}` : '';
      }).join(', ');
    };

    const formatContent = (content) => {
      if (!content) return '';

      // 替换代码块
      if (content.includes('```')) {
        return content.replace(/```(.*?)\n([\s\S]*?)```/g, (match, lang, code) => {
          return `<pre class="code-block"><code class="${lang}">${code}</code></pre>`;
        });
      }

      return content;
    };

    const getCategoryName = (category) => {
      const categoryMap = {
        'javascript': 'JavaScript',
        'framework': '前端框架',
        'html': 'HTML/CSS',
        'html_css': 'HTML/CSS'
      };
      return categoryMap[category] || category;
    };

    const getTypeName = (type) => {
      const typeMap = {
        'single-choice': '单选题',
        'multiple-choice': '多选题',
        'true-false': '判断题',
        'short-answer': '简答题',
        'code-completion': '代码补全',
        'interview': '面试题'
      };
      return typeMap[type] || type;
    };

    watch(route, () => {
      // 当路由变化时，重新获取习题
      fetchExercises();
    });

    onMounted(() => {
      // 检查URL参数
      const urlParams = new URLSearchParams(window.location.search);
      const indexParam = urlParams.get('index');

      if (indexParam !== null) {
        // 尝试设置索引
        try {
          const index = parseInt(indexParam, 10);
          if (!isNaN(index) && index >= 0) {
            currentIndex.value = index;
          }
        } catch (error) {
          console.error('解析索引参数失败:', error);
        }
      }

      // 获取练习题
      fetchExercises();
    });

    return {
      loading,
      error,
      exercises,
      currentIndex,
      currentExercise,
      userAnswers,
      showAnswer,
      isCorrect,
      progressPercentage,
      hasAnswer,
      setAnswer,
      checkAnswer,
      getOptionText,
      getMultipleOptionText,
      formatContent,
      getCategoryName,
      getTypeName,
      useMockData,
      goBackToList,
      refreshKey
    };
  }
};
</script>

<style scoped>
.exercise-test-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #333;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 10px;
  background-color: #eee;
  border-radius: 5px;
  overflow: hidden;
}

.progress-filled {
  height: 100%;
  background-color: #4285f4;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  color: #666;
  min-width: 60px;
  text-align: right;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: #4285f4;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.error-msg,
.no-exercises {
  text-align: center;
  padding: 40px;
  color: #666;
}

.exercise-content {
  margin-bottom: 24px;
}

.exercise-card {
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
  position: relative;
  border-left: 4px solid transparent;
  transition: all 0.3s ease;
}

.exercise-card.correct {
  border-left-color: #2e7d32;
}

.exercise-card.incorrect {
  border-left-color: #c62828;
}

.exercise-info {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.exercise-type,
.exercise-category {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.exercise-type {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.exercise-type.multiple-choice {
  background-color: #e3f2fd;
  color: #1565c0;
}

.exercise-type.true-false {
  background-color: #fff3e0;
  color: #e65100;
}

.exercise-type.short-answer {
  background-color: #f3e5f5;
  color: #6a1b9a;
}

.exercise-type.code-completion {
  background-color: #e8eaf6;
  color: #283593;
}

.exercise-category {
  background-color: #f5f5f5;
  color: #616161;
}

.exercise-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #333;
}

.knowledge-point {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.exercise-question {
  margin-bottom: 24px;
  font-size: 16px;
  line-height: 1.6;
}

.code-block {
  background-color: #f7f9fb;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  margin: 16px 0;
}

.unknown-type {
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 4px;
  text-align: center;
  color: #666;
}

.answer-explanation {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #eee;
}

.answer-explanation h3 {
  font-size: 18px;
  margin-bottom: 16px;
  color: #333;
}

.answer-status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-weight: 500;
  margin-bottom: 12px;
}

.answer-status.correct {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.answer-status.incorrect {
  background-color: #ffebee;
  color: #c62828;
}

.correct-answer {
  margin-bottom: 12px;
  line-height: 1.6;
}

.exercise-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-size: 14px;
  min-width: 100px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-check {
  background-color: #4285f4;
  color: white;
}

.btn-check:hover:not(:disabled) {
  background-color: #3367d6;
}

.btn-back {
  background-color: #f1f3f4;
  color: #3c4043;
}

.btn-back:hover {
  background-color: #e8eaed;
}

@media (max-width: 600px) {
  .exercise-actions {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .navigation-buttons {
    width: 100%;
    order: 1;
  }

  .btn-check {
    order: 2;
    width: 100%;
  }

  .btn-back {
    order: 3;
    width: 100%;
  }
}
</style>