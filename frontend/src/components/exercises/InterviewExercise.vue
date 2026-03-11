<template>
  <div class="interview-exercise">
    <div class="answer-container">
      <textarea 
        class="answer-input"
        :class="{ 'read-only': showAnswer }"
        v-model="answerText"
        placeholder="请在此输入您的答案..."
        :readonly="showAnswer"
        rows="6"
        @input="updateAnswer"
      ></textarea>
    </div>
    
    <div v-if="showAnswer" class="model-answer">
      <h3>参考答案</h3>
      <div class="model-answer-content">
        {{ exercise.answer }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue';

export default {
  name: 'InterviewExercise',
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
    const answerText = ref(props.userAnswer || '');
    
    const updateAnswer = () => {
      emit('answer', answerText.value);
    };

    // 同步props和本地状态
    watch(() => props.userAnswer, (newVal) => {
      if (newVal !== undefined && newVal !== answerText.value) {
        answerText.value = newVal;
      }
    });

    return {
      answerText,
      updateAnswer
    };
  }
};
</script>

<style scoped>
.interview-exercise {
  margin-bottom: 20px;
}

.answer-container {
  margin-bottom: 16px;
}

.answer-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 15px;
  line-height: 1.5;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.2s ease;
}

.answer-input:focus {
  outline: none;
  border-color: #4285f4;
  box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
}

.answer-input.read-only {
  background-color: #f9f9f9;
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

.model-answer-content {
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-line;  /* 保留换行符 */
}
</style> 