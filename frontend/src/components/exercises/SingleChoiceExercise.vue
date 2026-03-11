<template>
  <div class="single-choice-exercise">
    <div class="options-list">
      <div 
        v-for="option in exercise.options" 
        :key="option.id"
        :class="[
          'option-item', 
          { 'selected': userAnswer === option.id },
          { 'correct': showAnswer && option.id === exercise.answer },
          { 'incorrect': showAnswer && userAnswer === option.id && option.id !== exercise.answer }
        ]"
        @click="selectOption(option.id)"
      >
        <div class="option-marker">{{ option.id }}</div>
        <div class="option-text">{{ option.text }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SingleChoiceExercise',
  props: {
    exercise: {
      type: Object,
      required: true
    },
    userAnswer: {
      type: String,
      default: null
    },
    showAnswer: {
      type: Boolean,
      default: false
    }
  },
  emits: ['answer'],
  setup(props, { emit }) {
    const selectOption = (optionId) => {
      if (props.showAnswer) return; // 已显示答案时不允许更改
      emit('answer', optionId);
    };

    return {
      selectOption
    };
  }
};
</script>

<style scoped>
.single-choice-exercise {
  margin-bottom: 20px;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.option-item:hover:not(.correct):not(.incorrect) {
  background-color: #f5f9ff;
  border-color: #c2d8ff;
}

.option-item.selected:not(.correct):not(.incorrect) {
  background-color: #e3edfd;
  border-color: #4285f4;
}

.option-item.correct {
  background-color: #e8f5e9;
  border-color: #2e7d32;
}

.option-item.incorrect {
  background-color: #ffebee;
  border-color: #c62828;
  position: relative;
}

.option-item.incorrect::before {
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

.option-marker {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #f1f5fe;
  color: #4285f4;
  font-weight: 500;
  margin-right: 12px;
  flex-shrink: 0;
}

.option-item.selected .option-marker {
  background-color: #4285f4;
  color: white;
}

.option-item.correct .option-marker {
  background-color: #2e7d32;
  color: white;
}

.option-item.incorrect .option-marker {
  background-color: #c62828;
  color: white;
}

.option-text {
  font-size: 15px;
  line-height: 1.5;
  flex: 1;
}
</style> 