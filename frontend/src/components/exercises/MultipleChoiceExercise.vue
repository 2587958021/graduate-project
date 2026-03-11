<template>
  <div class="multiple-choice-exercise">
    <div class="options-list">
      <div 
        v-for="option in exercise.options" 
        :key="option.id"
        :class="[
          'option-item', 
          { 'selected': isSelected(option.id) },
          { 'correct': showAnswer && isCorrectAnswer(option.id) },
          { 'incorrect': showAnswer && isSelected(option.id) && !isCorrectAnswer(option.id) },
          { 'missed': showAnswer && !isSelected(option.id) && isCorrectAnswer(option.id) }
        ]"
        @click="toggleOption(option.id)"
      >
        <div class="option-marker">
          <div class="checkbox" :class="{ 'checked': isSelected(option.id) }"></div>
          <span>{{ option.id }}</span>
        </div>
        <div class="option-text">{{ option.text }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  name: 'MultipleChoiceExercise',
  props: {
    exercise: {
      type: Object,
      required: true
    },
    userAnswer: {
      type: Array,
      default: () => []
    },
    showAnswer: {
      type: Boolean,
      default: false
    }
  },
  emits: ['answer'],
  setup(props, { emit }) {
    const selectedOptions = ref(props.userAnswer || []);
    
    const isSelected = (optionId) => {
      return selectedOptions.value.includes(optionId);
    };
    
    const isCorrectAnswer = (optionId) => {
      return props.exercise.answer.includes(optionId);
    };
    
    const toggleOption = (optionId) => {
      if (props.showAnswer) return; // 已显示答案时不允许更改
      
      const newSelectedOptions = [...selectedOptions.value];
      const index = newSelectedOptions.indexOf(optionId);
      
      if (index > -1) {
        newSelectedOptions.splice(index, 1);
      } else {
        newSelectedOptions.push(optionId);
      }
      
      selectedOptions.value = newSelectedOptions;
      emit('answer', newSelectedOptions);
    };

    return {
      selectedOptions,
      isSelected,
      isCorrectAnswer,
      toggleOption
    };
  }
};
</script>

<style scoped>
.multiple-choice-exercise {
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

.option-item:hover:not(.correct):not(.incorrect):not(.missed) {
  background-color: #f5f9ff;
  border-color: #c2d8ff;
}

.option-item.selected:not(.correct):not(.incorrect):not(.missed) {
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

.option-item.missed {
  background-color: #fff3e0;
  border-color: #e65100;
}

.option-marker {
  display: flex;
  align-items: center;
  margin-right: 12px;
  flex-shrink: 0;
  gap: 8px;
}

.checkbox {
  width: 18px;
  height: 18px;
  border: 2px solid #aaa;
  border-radius: 3px;
  position: relative;
}

.checkbox.checked {
  background-color: #4285f4;
  border-color: #4285f4;
}

.checkbox.checked::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.option-item.correct .checkbox.checked {
  background-color: #2e7d32;
  border-color: #2e7d32;
}

.option-item.incorrect .checkbox.checked {
  background-color: #c62828;
  border-color: #c62828;
}

.option-item.missed .checkbox {
  border-color: #e65100;
  background-color: #fff3e0;
}

.option-text {
  font-size: 15px;
  line-height: 1.5;
  flex: 1;
}
</style> 