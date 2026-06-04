# 在线考试平台

一个功能完整的在线考试系统，支持用户考试、自动判分、错题本、成绩记录等功能，同时提供管理员后台进行题库、试卷、考试管理和成绩统计。

## 技术栈

- **前端**: React 18 + TypeScript + Tailwind CSS + Vite
- **后端**: Python 3 + Flask + SQLite
- **认证**: JWT (JSON Web Token)

## 端口配置

- 后端服务: http://localhost:8001
- 前端服务: http://localhost:5101

## 项目结构

```
.
├── backend/                    # Flask 后端服务
│   ├── app.py                  # 应用主入口
│   ├── models.py               # 数据模型定义
│   ├── routes/                 # 路由模块
│   │   ├── __init__.py
│   │   ├── auth.py             # 认证相关路由
│   │   ├── questions.py        # 题库管理路由
│   │   ├── papers.py           # 试卷管理路由
│   │   ├── exams.py            # 考试相关路由
│   │   ├── scores.py           # 成绩统计路由
│   │   └── admin.py            # 管理员专用路由
│   ├── utils/                  # 工具函数
│   │   ├── __init__.py
│   │   ├── database.py         # 数据库连接工具
│   │   └── helpers.py          # 通用辅助函数
│   ├── requirements.txt        # Python 依赖
│   ├── init_db.py              # 数据库初始化脚本
│   └── instance/               # SQLite 数据库文件目录
├── frontend/                   # React 前端应用
│   ├── src/
│   │   ├── api/                # API 服务层
│   │   │   ├── index.ts
│   │   │   ├── auth.ts
│   │   │   ├── question.ts
│   │   │   ├── paper.ts
│   │   │   ├── exam.ts
│   │   │   └── score.ts
│   │   ├── components/         # 公共组件
│   │   ├── pages/              # 页面组件
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── student/        # 学生端页面
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── QuestionBank.tsx
│   │   │   │   ├── ExamList.tsx
│   │   │   │   ├── ExamPage.tsx
│   │   │   │   ├── ExamReport.tsx
│   │   │   │   ├── WrongBook.tsx
│   │   │   │   └── ScoreHistory.tsx
│   │   │   └── admin/          # 管理员端页面
│   │   │       ├── Dashboard.tsx
│   │   │       ├── QuestionManage.tsx
│   │   │       ├── PaperManage.tsx
│   │   │       ├── ExamManage.tsx
│   │   │       └── Statistics.tsx
│   │   ├── types/              # TypeScript 类型定义
│   │   ├── utils/              # 工具函数
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md                   # 本文档
```

## 快速开始

### 1. 环境要求

- Python >= 3.8
- Node.js >= 16
- npm 或 yarn

### 2. 后端启动

#### 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

#### 数据库初始化

```bash
python init_db.py
```

该脚本会自动创建 SQLite 数据库文件 `instance/exam.db`，并初始化测试数据：
- 管理员账号: admin / 123456
- 学生账号: student / 123456
- 示例题库和试卷

#### 启动后端服务

```bash
python app.py
```

服务将在 http://localhost:8001 启动

### 3. 前端启动

#### 安装依赖

```bash
cd frontend
npm install
```

#### 启动开发服务

```bash
npm run dev
```

服务将在 http://localhost:5101 启动

## 功能说明

### 用户模块
- **登录注册**: 支持学生和管理员两种角色登录
- **题库浏览**: 按科目、题型查看所有公开题目
- **模拟考试**: 选择试卷进行限时考试
- **自动判分**: 客观题自动评分，考试结束即时出分
- **错题本**: 记录答错的题目，支持复习
- **成绩记录**: 查看历史考试成绩和详细报告

### 管理员模块
- **题库管理**: 题目的增删改查，支持单选题、多选题、判断题
- **试卷管理**: 从题库选题组卷，设置考试时长和总分
- **考试管理**: 发布考试，指定参考学生和考试时间
- **成绩统计**: 查看班级成绩分布、平均分、及格率等统计数据

### 成绩报告
考试结束后自动生成详细报告，包含：
- 总分及各题型得分
- 正确率分析
- 错题详解
- 知识点薄弱项分析
