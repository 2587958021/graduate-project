const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');
const asyncHandler = require('../middlewares/async');
const ErrorResponse = require('../utils/errorResponse');
const { extractBvid, extractPage, getVideoInfo } = require('../utils/bilibiliApi');

// 课程数据文件目录
const coursesDataDir = path.join(__dirname, '../data/courses');

// 加载课程数据
const loadCourseData = () => {
  let allCourses = [];
  
  try {
    // 获取目录中的所有JSON文件
    const files = fs.readdirSync(coursesDataDir).filter(file => file.endsWith('.json'));
    
    if (files.length === 0) {
      console.error('未找到任何课程JSON文件');
      return [];
    }
    
    // 读取每个文件并合并数据
    for (const file of files) {
      const filePath = path.join(coursesDataDir, file);
      
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        const courses = JSON.parse(data);
        console.log(`从文件 ${file} 中读取了 ${courses.length} 个课程`);
        allCourses = [...allCourses, ...courses];
      } catch (err) {
        console.log(`未找到${file}课程数据或解析失败:`, err.message);
      }
    }
    
    console.log(`总共加载了${allCourses.length}个课程`);
    
    // 对课程进行去重，使用_id和title都作为唯一标识
    const idMap = new Map();
    const titleMap = new Map();
    const uniqueCourses = [];
    
    // 去重，同时基于_id和title
    allCourses.forEach(course => {
      // 如果ID已存在，跳过
      if (idMap.has(course._id)) {
        console.log(`发现ID重复的课程: ${course._id} - ${course.title}`);
        return;
      }
      
      // 如果标题已存在，跳过
      if (titleMap.has(course.title)) {
        console.log(`发现标题重复的课程: ${course._id} - ${course.title}`);
        return;
      }
      
      // 记录ID和标题
      idMap.set(course._id, course);
      titleMap.set(course.title, course);
      uniqueCourses.push(course);
    });
    
    return uniqueCourses;
  } catch (error) {
    console.error('加载静态课程数据失败:', error);
    return [];
  }
};

// 保存课程到对应的JSON文件
const saveCourseToFile = (course) => {
  try {
    // 根据课程分类确定文件名
    const category = course.category || 'other';
    const fileName = `${category}_courses.json`;
    const filePath = path.join(coursesDataDir, fileName);
    
    // 处理课程章节和课时，限制每个章节最多保存2个课时
    if (course.chapters && Array.isArray(course.chapters)) {
      course.chapters.forEach(chapter => {
        if (chapter.lessons && Array.isArray(chapter.lessons) && chapter.lessons.length > 2) {
          // 只保留前2个课时
          chapter.lessons = chapter.lessons.slice(0, 2);
        }
      });
    }
    
    // 读取现有文件内容
    let courses = [];
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      courses = JSON.parse(data);
      
      // 检查是否已存在该课程，如果存在则更新
      const index = courses.findIndex(c => c._id === course._id);
      if (index !== -1) {
        courses[index] = course;
      } else {
        courses.push(course);
      }
    } else {
      courses = [course];
    }
    
    // 保存到文件
    fs.writeFileSync(filePath, JSON.stringify(courses, null, 2), 'utf8');
    console.log(`课程 ${course._id} 已保存到文件 ${fileName}`);
    return true;
  } catch (error) {
    console.error('保存课程文件失败:', error);
    return false;
  }
};

// 从文件中删除课程
const deleteCourseFromFile = (courseId) => {
  try {
    // 遍历所有JSON文件查找该课程
    const files = fs.readdirSync(coursesDataDir).filter(file => file.endsWith('.json'));
    
    for (const file of files) {
      const filePath = path.join(coursesDataDir, file);
      
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        let courses = JSON.parse(data);
        
        // 查找课程
        const originalLength = courses.length;
        courses = courses.filter(course => course._id !== courseId);
        
        // 如果找到并删除了课程
        if (originalLength > courses.length) {
          // 保存更新后的文件
          fs.writeFileSync(filePath, JSON.stringify(courses, null, 2), 'utf8');
          console.log(`已从文件 ${file} 中删除课程 ${courseId}`);
          return true;
        }
      } catch (err) {
        console.log(`读取或解析文件 ${file} 失败:`, err.message);
      }
    }
    
    console.log(`未找到要删除的课程: ${courseId}`);
    return false;
  } catch (error) {
    console.error('删除课程失败:', error);
    return false;
  }
};

// 获取课程分类统计数据
exports.getCategoryStats = async (req, res) => {
  try {
    const allCourses = loadCourseData();
    // 只统计已发布课程
    const publishedCourses = allCourses.filter(course => course.isPublished === true);
    
    const categoryCounts = publishedCourses.reduce((counts, course) => {
      const category = course.category;
      counts[category] = (counts[category] || 0) + 1;
      return counts;
    }, {});
    
    // 确保所有分类都存在，即使没有课程
    const allCategories = ['html_css', 'javascript', 'typescript', 'vue', 'react', 'uni-app', '其他'];
    allCategories.forEach(category => {
      if (!categoryCounts[category]) {
        categoryCounts[category] = 0;
      }
    });
    
    res.status(200).json({
      success: true,
      data: categoryCounts
    });
  } catch (error) {
    console.error('获取课程分类统计失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取分类统计'
    });
  }
};

// @desc    获取所有课程
// @route   GET /api/courses
// @access  Public
exports.getCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, sort = 'newest' } = req.query;
    
    console.log('获取课程请求参数:', req.query);
    
    // 从静态文件加载数据
    let courses = loadCourseData();
    
    // 只返回已发布的课程
    courses = courses.filter(course => course.isPublished === true);
    
    // 应用分类筛选
    if (category && category !== 'all') {
      courses = courses.filter(course => course.category === category);
    }
    
    // 应用搜索筛选
    if (search) {
      const searchLower = search.toLowerCase();
      courses = courses.filter(course => 
        (course.title && course.title.toLowerCase().includes(searchLower)) || 
        (course.description && course.description.toLowerCase().includes(searchLower))
      );
    }
    
    // 应用排序
    if (sort === 'newest') {
      courses.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sort === 'oldest') {
      courses.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    }
    
    // 计算分页
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = courses.length;
    const totalPages = Math.ceil(total / limit);
    
    // 获取当前页的课程
    const paginatedCourses = courses.slice(startIndex, endIndex);
    
    // 确保每个课程都有必要的字段
    const formattedCourses = paginatedCourses.map(course => ({
      ...course,
      _id: course._id || `course_${Math.random().toString(36).substr(2, 9)}`,
      title: course.title || '未命名课程',
      description: course.description || '暂无描述',
      category: course.category || '其他',
      level: course.level || '初级',
      createdAt: course.createdAt || new Date().toISOString()
    }));
    
    console.log(`返回 ${formattedCourses.length} 个课程，总计 ${total} 个课程`);
    
    res.status(200).json({
      success: true,
      data: formattedCourses,
      pagination: {
        total,
        pages: totalPages,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取课程列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取课程列表'
    });
  }
};

// @desc    获取课程详情
// @route   GET /api/courses/:id
// @access  Public
exports.getCourseDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 从静态文件加载数据
    const courses = loadCourseData();
    
    // 查找课程
    const course = courses.find(c => c._id === id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: '课程不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('获取课程详情失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取课程详情'
    });
  }
};

// @desc    创建课程
// @route   POST /api/courses
// @access  Private
exports.createCourse = async (req, res) => {
  try {
    const { title, description, category, level, tags } = req.body;
    
    // 验证输入
    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: '请提供课程标题、描述和分类'
      });
    }
    
    // 创建新课程
    const newCourse = {
      _id: `course_${Date.now()}`,
      title,
      description,
      category,
      level: level || '初级',
      tags: tags || [],
      isPublished: false,
      createdAt: new Date().toISOString(),
      chapters: []
    };
    
    // 保存到文件
    const saved = saveCourseToFile(newCourse);
    
    if (!saved) {
      return res.status(500).json({
        success: false,
        message: '保存课程失败'
      });
    }
    
    res.status(201).json({
      success: true,
      message: '课程创建成功',
      data: newCourse
    });
  } catch (error) {
    console.error('创建课程失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法创建课程'
    });
  }
};

// @desc    删除课程
// @route   DELETE /api/courses/:id
// @access  Private/Admin
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 从文件中删除课程
    const deleted = deleteCourseFromFile(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: '课程不存在或删除失败'
      });
    }
    
    res.status(200).json({
      success: true,
      message: '课程已成功删除',
      data: {}
    });
  } catch (error) {
    console.error('删除课程失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法删除课程'
    });
  }
};

// @desc    更新课程
// @route   PUT /api/courses/:id
// @access  Private/Admin
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // 从静态文件加载数据
    const courses = loadCourseData();
    
    // 查找课程
    const course = courses.find(c => c._id === id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: '课程不存在'
      });
    }
    
    // 更新课程
    const updatedCourse = {
      ...course,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    // 保存到文件
    const saved = saveCourseToFile(updatedCourse);
    
    if (!saved) {
      return res.status(500).json({
        success: false,
        message: '更新课程失败'
      });
    }
    
    res.status(200).json({
      success: true,
      message: '课程更新成功',
      data: updatedCourse
    });
  } catch (error) {
    console.error('更新课程失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法更新课程'
    });
  }
};

// @desc    获取管理员课程列表
// @route   GET /api/courses/admin/all
// @access  Private/Admin
exports.getAdminCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, published } = req.query;
    
    // 从静态文件加载数据
    let courses = loadCourseData();
    
    // 过滤条件 - 不再使用过滤条件，而是随机排序
    courses = courses.sort(() => 0.5 - Math.random());
    
    // 计算总数
    const total = courses.length;
    
    // 分页
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    
    // 按创建时间降序排序
    courses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const paginatedCourses = courses.slice(startIndex, endIndex);
    
    res.status(200).json({
      success: true,
      count: paginatedCourses.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      },
      data: paginatedCourses
    });
  } catch (error) {
    console.error('获取管理员课程列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取课程列表'
    });
  }
};

// @desc    清理重复课程
// @route   POST /api/courses/admin/clean-duplicates
// @access  Private/Admin
exports.cleanDuplicateCourses = async (req, res) => {
  try {
    // 获取所有课程
    const courses = loadCourseData();
    
    // 用于检查重复的映射
    const titleMap = new Map();
    const idMap = new Map();
    
    // 重复项统计
    let duplicatesCount = 0;
    let deletedCount = 0;
    
    // 检查每个课程文件
    const files = fs.readdirSync(coursesDataDir).filter(file => file.endsWith('.json'));
    
    for (const file of files) {
      const filePath = path.join(coursesDataDir, file);
      
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        let fileCourses = JSON.parse(data);
        const originalLength = fileCourses.length;
        
        // 过滤掉当前文件中的重复课程
        const uniqueFileCourses = [];
        
        for (const course of fileCourses) {
          // 检查ID重复
          if (idMap.has(course._id)) {
            duplicatesCount++;
            continue;
          }
          
          // 检查标题重复
          if (titleMap.has(course.title)) {
            duplicatesCount++;
            continue;
          }
          
          // 不重复，添加到结果集
          idMap.set(course._id, true);
          titleMap.set(course.title, true);
          uniqueFileCourses.push(course);
        }
        
        // 如果有重复项被移除
        if (uniqueFileCourses.length < originalLength) {
          deletedCount += (originalLength - uniqueFileCourses.length);
          
          // 保存更新后的文件
          fs.writeFileSync(filePath, JSON.stringify(uniqueFileCourses, null, 2), 'utf8');
        }
      } catch (error) {
        console.error(`处理文件 ${file} 时出错:`, error);
      }
    }
    
    res.status(200).json({
      success: true,
      message: `清理完成，共发现 ${duplicatesCount} 个重复项，删除了 ${deletedCount} 个课程`,
      data: {
        duplicatesFound: duplicatesCount,
        coursesDeleted: deletedCount
      }
    });
  } catch (error) {
    console.error('清理重复课程失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法清理重复课程'
    });
  }
};

// @desc    获取课程分类
// @route   GET /api/courses/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const allCourses = loadCourseData();
    
    // 提取所有分类
    const categories = [...new Set(allCourses.map(course => course.category))];
    
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('获取课程分类失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取课程分类'
    });
  }
};

// @desc    快速创建课程（从B站视频）
// @route   POST /api/courses/quick-create
// @access  Private/Admin
exports.quickCreateCourse = asyncHandler(async (req, res) => {
  try {
    const { videoUrl, coverImage, category, level, isPublished } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        message: '请提供视频URL'
      });
    }
    
    // 从视频URL提取BV号
    const bvid = extractBvid(videoUrl);
    if (!bvid) {
      return res.status(400).json({
        success: false,
        message: '无效的B站视频链接'
      });
    }
    
    // 获取视频信息
    const videoInfo = await getVideoInfo(bvid);
    
    // 根据视频分类信息自动判断课程分类
    let courseCategory = category;
    if (!courseCategory && videoInfo.categories && videoInfo.categories.length > 0) {
      const categoryMap = {
        '前端开发': 'javascript',
        'Web开发': 'javascript',
        'JavaScript': 'javascript',
        'HTML': 'html_css',
        'CSS': 'html_css',
        '网页设计': 'html_css',
        'Vue': 'vue',
        'React': 'react',
        'TypeScript': 'typescript',
        'TS': 'typescript',
        'Java': 'java',
        'Python': 'python'
      };
      
      // 尝试匹配视频分类
      for (const cat of videoInfo.categories) {
        if (categoryMap[cat]) {
          courseCategory = categoryMap[cat];
          break;
        }
      }
      
      // 检查标题中是否包含TypeScript或TS关键词
      if (videoInfo.title.includes('TypeScript') || videoInfo.title.includes('TS') || 
          videoInfo.title.includes('typescript') || videoInfo.title.includes('ts')) {
        courseCategory = 'typescript';
      }
    }
    
    // 创建新课程
    const courseId = `course_${Date.now()}`;
    const newCourse = {
      _id: courseId,
      title: videoInfo.title,
      description: videoInfo.description || '',
      category: courseCategory || '其他',
      level: level || '初级',
      tags: videoInfo.tags || [],
      coverImage: coverImage || videoInfo.coverUrl || '/images/default-course.jpg',
      isPublished: isPublished === true,
      createdAt: new Date().toISOString(),
      chapters: [
        {
          _id: "chapter-1",
          title: "第一章",
          description: "自动从B站视频创建的章节",
          order: 1,
          lessons: []
        }
      ]
    };
    
    // 添加视频的所有分P作为课时
    if (videoInfo.pages && videoInfo.pages.length > 0) {
      // 最多只添加前2个课时
      const pagesToAdd = videoInfo.pages.slice(0, 2);
      pagesToAdd.forEach((page, index) => {
        newCourse.chapters[0].lessons.push({
          _id: `lesson-1-${index + 1}`,
          description: `第${index + 1}课时`,
          bvid: bvid,
          page: page.page,
          order: index + 1,
          duration: page.duration,
          embedCode: `<div class="video-link-container"><a href="https://www.bilibili.com/video/${bvid}?p=${page.page}" target="_blank" class="video-link">在B站观看视频 <i class="bi bi-box-arrow-up-right"></i></a></div>`
        });
      });
    } else {
      // 如果没有分P，添加单个课时
      newCourse.chapters[0].lessons.push({
        _id: "lesson-1-1",
        description: "第1课时",
        bvid: bvid,
        page: 1,
        order: 1,
        duration: videoInfo.duration || 0,
        embedCode: `<div class="video-link-container"><a href="https://www.bilibili.com/video/${bvid}" target="_blank" class="video-link">在B站观看视频 <i class="bi bi-box-arrow-up-right"></i></a></div>`
      });
    }
    
    // 保存到文件
    const saved = saveCourseToFile(newCourse);
    
    if (!saved) {
      return res.status(500).json({
        success: false,
        message: '保存课程失败'
      });
    }
    
    res.status(201).json({
      success: true,
      message: '课程创建成功',
      data: newCourse
    });
  } catch (error) {
    console.error('快速创建课程失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法创建课程'
    });
  }
});

// @desc    获取课程章节
// @route   GET /api/courses/:id/chapters
// @access  Public
exports.getCourseChapters = asyncHandler(async (req, res, next) => {
  const courseId = req.params.id;
  
  // 从静态文件加载数据
  const courses = loadCourseData();
  
  // 查找指定ID的课程
  const course = courses.find(c => c._id === courseId);
  
  if (!course) {
    return next(new ErrorResponse(`未找到ID为${courseId}的课程`, 404));
  }
  
  // 返回课程章节信息
  res.status(200).json({
    success: true,
    data: course.chapters || []
  });
});

// @desc    获取课时详情
// @route   GET /api/courses/:courseId/chapters/:chapterId/lessons/:lessonId
// @access  Public
exports.getLessonDetails = asyncHandler(async (req, res, next) => {
  const { courseId, chapterId, lessonId } = req.params;
  
  // 从静态文件加载数据
  const courses = loadCourseData();
  
  // 查找指定ID的课程
  const course = courses.find(c => c._id === courseId);
  
  if (!course) {
    return next(new ErrorResponse(`未找到ID为${courseId}的课程`, 404));
  }
  
  // 查找章节
  const chapter = course.chapters && course.chapters.find(ch => ch._id === chapterId);
  
  if (!chapter) {
    return next(new ErrorResponse(`未找到章节ID为${chapterId}的章节`, 404));
  }
  
  // 查找课时
  const lesson = chapter.lessons && chapter.lessons.find(l => l._id === lessonId);
  
  if (!lesson) {
    return next(new ErrorResponse(`未找到课时ID为${lessonId}的课时`, 404));
  }
  
  // 添加B站视频链接
  const lessonWithVideoLink = { ...lesson };
  if (lessonWithVideoLink.bvid) {
    const page = lessonWithVideoLink.page || 1;
    lessonWithVideoLink.biliVideoLink = `https://www.bilibili.com/video/${lessonWithVideoLink.bvid}?p=${page}`;
  }
  
  // 确保课时有title字段，如果没有则使用description
  if (!lessonWithVideoLink.title && lessonWithVideoLink.description) {
    lessonWithVideoLink.title = lessonWithVideoLink.description;
  }
  
  // 返回课时详情
  res.status(200).json({
    success: true,
    courseTitle: course.title,
    chapterTitle: chapter.title,
    lesson: lessonWithVideoLink
  });
});

// @desc    获取B站视频信息
// @route   GET /api/courses/video-info
// @access  Public
exports.getVideoInfo = async (req, res) => {
  try {
    const { videoUrl } = req.query;
    
    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        message: '请提供视频URL'
      });
    }
    
    // 提取bvid
    const bvid = extractBvid(videoUrl);
    if (!bvid) {
      return res.status(400).json({
        success: false,
        message: '无效的B站视频链接'
      });
    }
    
    // 获取视频信息
    const videoInfo = await getVideoInfo(bvid);
    if (!videoInfo) {
      return res.status(400).json({
        success: false,
        message: '无法获取视频信息'
      });
    }
    
    // 返回处理后的视频信息
    res.status(200).json({
      success: true,
      data: {
        title: videoInfo.title,
        description: videoInfo.description,
        coverImage: videoInfo.coverUrl,
        author: videoInfo.author,
        duration: videoInfo.duration,
        pages: videoInfo.pages,
        tags: videoInfo.tags,
        categories: videoInfo.categories
      }
    });
  } catch (error) {
    console.error('获取视频信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取视频信息失败'
    });
  }
};

// @desc    批量创建课程（从B站视频）
// @route   POST /api/courses/batch-create
// @access  Private/Admin
exports.batchCreateCourses = asyncHandler(async (req, res) => {
  try {
    const { videoUrls, category, level, isPublished } = req.body;
    
    if (!videoUrls || !Array.isArray(videoUrls) || videoUrls.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供至少一个视频URL'
      });
    }
    
    const results = {
      success: [],
      failed: []
    };
    
    // 依次处理每个视频URL
    for (const videoUrl of videoUrls) {
      try {
        // 从视频URL提取BV号
        const bvid = extractBvid(videoUrl);
        if (!bvid) {
          results.failed.push({ url: videoUrl, reason: '无效的B站视频链接' });
          continue;
        }
        
        // 获取视频信息
        const videoInfo = await getVideoInfo(bvid);
        
        // 根据视频分类信息自动判断课程分类
        let courseCategory = category;
        if (!courseCategory && videoInfo.categories && videoInfo.categories.length > 0) {
          const categoryMap = {
            '前端开发': 'javascript',
            'Web开发': 'javascript',
            'JavaScript': 'javascript',
            'HTML': 'html_css',
            'CSS': 'html_css',
            '网页设计': 'html_css',
            'Vue': 'vue',
            'React': 'react',
            'TypeScript': 'typescript',
            'TS': 'typescript',
            'Java': 'java',
            'Python': 'python'
          };
          
          // 尝试匹配视频分类
          for (const cat of videoInfo.categories) {
            if (categoryMap[cat]) {
              courseCategory = categoryMap[cat];
              break;
            }
          }
          
          // 检查标题中是否包含TypeScript或TS关键词
          if (videoInfo.title && (
              videoInfo.title.includes('TypeScript') || 
              videoInfo.title.includes('TS') || 
              videoInfo.title.includes('typescript') || 
              videoInfo.title.includes('ts')
          )) {
            courseCategory = 'typescript';
          }
        }
        
        // 创建新课程
        const courseId = `course_${Date.now()}_${results.success.length + 1}`;
        const newCourse = {
          _id: courseId,
          title: videoInfo.title,
          description: videoInfo.description || '',
          category: courseCategory || '其他',
          level: level || '初级',
          tags: videoInfo.tags || [],
          coverImage: videoInfo.coverUrl || '/images/default-course.jpg',
          isPublished: isPublished === true,
          createdAt: new Date().toISOString(),
          chapters: [
            {
              _id: "chapter-1",
              title: "第一章",
              description: "自动从B站视频创建的章节",
              order: 1,
              lessons: []
            }
          ]
        };
        
        // 添加视频的所有分P作为课时
        if (videoInfo.pages && videoInfo.pages.length > 0) {
          // 最多只添加前2个课时
          const pagesToAdd = videoInfo.pages.slice(0, 2);
          pagesToAdd.forEach((page, index) => {
            newCourse.chapters[0].lessons.push({
              _id: `lesson-1-${index + 1}`,
              description: `第${index + 1}课时`,
              bvid: bvid,
              page: page.page,
              order: index + 1,
              duration: page.duration,
              embedCode: `<div class="video-link-container"><a href="https://www.bilibili.com/video/${bvid}?p=${page.page}" target="_blank" class="video-link">在B站观看视频 <i class="bi bi-box-arrow-up-right"></i></a></div>`
            });
          });
        } else {
          // 如果没有分P，添加单个课时
          newCourse.chapters[0].lessons.push({
            _id: "lesson-1-1",
            description: "第1课时",
            bvid: bvid,
            page: 1,
            order: 1,
            duration: videoInfo.duration || 0,
            embedCode: `<div class="video-link-container"><a href="https://www.bilibili.com/video/${bvid}" target="_blank" class="video-link">在B站观看视频 <i class="bi bi-box-arrow-up-right"></i></a></div>`
          });
        }
        
        // 保存到文件
        const saved = saveCourseToFile(newCourse);
        
        if (saved) {
          results.success.push({
            _id: newCourse._id,
            title: newCourse.title,
            category: newCourse.category
          });
        } else {
          results.failed.push({ url: videoUrl, reason: '保存课程失败' });
        }
      } catch (error) {
        console.error(`处理视频URL失败: ${videoUrl}`, error);
        results.failed.push({ url: videoUrl, reason: error.message || '处理视频失败' });
      }
    }
    
    res.status(200).json({
      success: true,
      message: `批量创建完成: ${results.success.length}个成功, ${results.failed.length}个失败`,
      data: results
    });
  } catch (error) {
    console.error('批量创建课程失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，批量创建课程失败'
    });
  }
}); 