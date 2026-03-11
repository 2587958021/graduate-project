<template>
  <div 
    class="course-cover" 
    :class="[`category-${categoryClass}`, { 'styled': isStyled }]"
    :style="coverStyle"
  >
    <div class="course-cover-overlay" :style="overlayStyle">
      <div class="course-cover-content">
        <h3 class="course-title">{{ title }}</h3>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CourseCover',
  props: {
    imageUrl: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    category: {
      type: String,
      default: 'other'
    }
  },
  computed: {
    // 检查是否应用统一样式
    isStyled() {
      return this.imageUrl && this.imageUrl.includes('styled=true');
    },
    
    // 提取原始图片URL（去掉查询参数）
    originalImageUrl() {
      return this.imageUrl ? this.imageUrl.split('?')[0] : '';
    },
    
    // 设置封面样式
    coverStyle() {
      return {
        backgroundImage: `url(${this.originalImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    },
    
    // 设置叠加层样式
    overlayStyle() {
      if (!this.isStyled) return {};
      
      return {
        backgroundColor: `${this.categoryColor}99` // 添加透明度
      };
    },
    
    // 获取分类CSS类名
    categoryClass() {
      if (this.category === 'html_css' || this.category === 'html') {
        return 'html-css';
      }
      return this.category ? this.category.replace('_', '-').toLowerCase() : 'other';
    },
    
    // 获取分类颜色
    categoryColor() {
      const categoryKey = this.mapCategoryToKey(this.category);
      const categoryColors = {
        'HTML/CSS': { color: '#e44d26', gradient: 'linear-gradient(135deg, #e44d26, #f16529)' },
        'JavaScript': { color: '#f7df1e', gradient: 'linear-gradient(135deg, #f7df1e, #f1c40f)' },
        'Vue': { color: '#42b883', gradient: 'linear-gradient(135deg, #42b883, #35495e)' },
        'React': { color: '#61dafb', gradient: 'linear-gradient(135deg, #61dafb, #2d3748)' },
        'TypeScript': { color: '#007acc', gradient: 'linear-gradient(135deg, #007acc, #0288d1)' },
        'uni-app': { color: '#2B9939', gradient: 'linear-gradient(135deg, #2B9939, #42b883)' },
        '其他': { color: '#9c27b0', gradient: 'linear-gradient(135deg, #9c27b0, #673ab7)' }
      };
      return categoryColors[categoryKey]?.color || categoryColors['其他'].color;
    }
  },
  methods: {
    // 将内部分类映射到categoryColors的键
    mapCategoryToKey(category) {
      const categoryMap = {
        'html_css': 'HTML/CSS',
        'html': 'HTML/CSS',
        'javascript': 'JavaScript',
        'vue': 'Vue',
        'react': 'React',
        'typescript': 'TypeScript',
        'uniapp': 'uni-app'
      };
      
      return categoryMap[category] || '其他';
    }
  }
};
</script>

<style scoped>
.course-cover {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 宽高比 */
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.course-cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%);
  transition: all 0.3s ease;
}

.course-cover:hover .course-cover-overlay {
  background: linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%);
}

.course-cover-content {
  padding: 20px;
  color: #fff;
}

.course-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style> 