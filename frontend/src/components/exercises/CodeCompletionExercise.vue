<template>
  <div class="code-completion-exercise">
    <div class="code-container">
      <div v-html="formattedCode" class="code-display"></div>
      
      <div class="input-container">
        <textarea 
          class="code-input"
          :class="{ 'read-only': showAnswer }"
          v-model="codeAnswer"
          placeholder="请输入缺失的代码..."
          :readonly="showAnswer"
          rows="3"
          @input="updateAnswer"
        ></textarea>
      </div>
    </div>
    
    <div v-if="showAnswer" class="model-answer">
      <h3>正确代码</h3>
      <pre class="model-code">{{ exercise.answer }}</pre>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';

export default {
  name: 'CodeCompletionExercise',
  props: {
    exercise: {
      type: Object,
      required: true
    },
    userAnswer: {
      type: String,
      default: ''
    },
    showAnswer: {
      type: Boolean,
      default: false
    }
  },
  emits: ['answer'],
  setup(props, { emit }) {
    const codeAnswer = ref(props.userAnswer || '');
    
    const updateAnswer = () => {
      emit('answer', codeAnswer.value);
    };
    
    // 处理代码内容，替换占位符为文本框
    const formattedCode = computed(() => {
      if (!props.exercise.content) return '';
      
      // 查找代码片段
      let content = props.exercise.content;
      
      // 查找代码块
      if (content.includes('```')) {
        // 处理代码块中的占位符
        content = content.replace(/```(.*?)\n([\s\S]*?)```/g, (match, lang, code) => {
          // 找到占位符（通常是类似 ______ 的部分）并高亮
          const highlightedCode = code.replace(/_{3,}/g, '<span class="highlight-placeholder">______</span>');
          return `<pre class="code-block"><code class="${lang}">${highlightedCode}</code></pre>`;
        });
      }
      
      return content;
    });
    
    // 同步props和本地状态
    watch(() => props.userAnswer, (newVal) => {
      if (newVal !== undefined && newVal !== codeAnswer.value) {
        codeAnswer.value = newVal;
      }
    });
    
    return {
      codeAnswer,
      formattedCode,
      updateAnswer
    };
  }
};
</script>

<style scoped>
.code-completion-exercise {
  margin-bottom: 20px;
}

.code-container {
  margin-bottom: 16px;
}

.code-display {
  margin-bottom: 16px;
}

.code-display :deep(.code-block) {
  background-color: #f7f9fb;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
}

.code-display :deep(.highlight-placeholder) {
  background-color: #fff3cd;
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: bold;
  color: #856404;
}

.input-container {
  margin-top: 16px;
}

.code-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 15px;
  line-height: 1.5;
  resize: vertical;
  font-family: 'Courier New', monospace;
  background-color: #f7f9fb;
  transition: border-color 0.2s ease;
}

.code-input:focus {
  outline: none;
  border-color: #4285f4;
  box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
}

.code-input.read-only {
  background-color: #f0f0f0;
  cursor: not-allowed;
}

.model-answer {
  background-color: #f5f9ff;
  padding: 16px;
  border-radius: 6px;
  border-left: 4px solid #4285f4;
}

.model-answer h3 {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 8px 0;
  color: #333;
}

.model-code {
  background-color: #f7f9fb;
  padding: 12px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  overflow-x: auto;
  margin: 0;
}
</style> 