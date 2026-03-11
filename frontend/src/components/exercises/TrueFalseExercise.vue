<template>
  <div class="true-false-exercise">
    <div class="options-container">
      <div 
        class="option"
        :class="[
          { 'selected': userAnswer === true },
          { 'correct': showAnswer && exercise.answer === true },
          { 'incorrect': showAnswer && userAnswer === true && exercise.answer !== true }
        ]"
        @click="selectOption(true)"
      >
        <div class="option-icon">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
          </svg>
        </div>
        <div class="option-text">正确</div>
      </div>
      
      <div 
        class="option"
        :class="[
          { 'selected': userAnswer === false },
          { 'correct': showAnswer && exercise.answer === false },
          { 'incorrect': showAnswer && userAnswer === false && exercise.answer !== false }
        ]"
        @click="selectOption(false)"
      >
        <div class="option-icon">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
          </svg>
        </div>
        <div class="option-text">错误</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TrueFalseExercise',
  props: {
    exercise: {
      type: Object,
      required: true
    },
    userAnswer: {
      type: Boolean,
      default: null
    },
    showAnswer: {
      type: Boolean,
      default: false
    }
  },
  emits: ['answer'],
  setup(props, { emit }) {
    const selectOption = (value) => {
      if (props.showAnswer) return; // 已显示答案时不允许更改
      
      // 确保值是布尔类型
      const boolValue = Boolean(value === true);
      console.log('判断题选择:', value, '类型:', typeof value, '转换后:', boolValue, '类型:', typeof boolValue);
      
      // 直接使用布尔值
      emit('answer', value === true);
    };

    return {
      selectOption
    };
  }
};
</script>

<style scoped>
.true-false-exercise {
  margin-bottom: 20px;
}

.options-container {
  display: flex;
  gap: 16px;
}

.option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  position: relative;
}

.option:hover:not(.correct):not(.incorrect) {
  background-color: #f5f9ff;
  border-color: #c2d8ff;
}

.option.selected:not(.correct):not(.incorrect) {
  background-color: #e3edfd;
  border-color: #4285f4;
}

.option.correct {
  background-color: #e8f5e9;
  border-color: #2e7d32;
}

.option.incorrect {
  background-color: #ffebee;
  border-color: #c62828;
}

.option.incorrect::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background-color: #c62828;
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
}

.option-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #f1f5fe;
  color: #4285f4;
  margin-bottom: 12px;
}

.option.selected .option-icon {
  background-color: #4285f4;
  color: white;
}

.option.correct .option-icon {
  background-color: #2e7d32;
  color: white;
}

.option.incorrect .option-icon {
  background-color: #c62828;
  color: white;
}

.option-text {
  font-size: 16px;
  font-weight: 500;
}

@media (max-width: 480px) {
  .options-container {
    flex-direction: column;
  }
}
</style> 