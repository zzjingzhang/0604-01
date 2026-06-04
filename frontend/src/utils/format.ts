import dayjs from 'dayjs'

export const formatDate = (date?: string | Date, format: string = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes}分钟`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
}

export const getQuestionTypeName = (type: string) => {
  const types: Record<string, string> = {
    single: '单选题',
    multiple: '多选题',
    judge: '判断题'
  }
  return types[type] || type
}

export const getDifficultyName = (difficulty: string) => {
  const levels: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return levels[difficulty] || difficulty
}

export const getDifficultyColor = (difficulty: string) => {
  const colors: Record<string, string> = {
    easy: 'text-green-600 bg-green-100',
    medium: 'text-yellow-600 bg-yellow-100',
    hard: 'text-red-600 bg-red-100'
  }
  return colors[difficulty] || 'text-gray-600 bg-gray-100'
}

export const getStatusName = (status: string) => {
  const statuses: Record<string, string> = {
    draft: '草稿',
    published: '已发布',
    ended: '已结束',
    in_progress: '进行中',
    submitted: '已提交'
  }
  return statuses[status] || status
}

export const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    draft: 'text-gray-600 bg-gray-100',
    published: 'text-blue-600 bg-blue-100',
    ended: 'text-red-600 bg-red-100',
    in_progress: 'text-green-600 bg-green-100',
    submitted: 'text-purple-600 bg-purple-100'
  }
  return colors[status] || 'text-gray-600 bg-gray-100'
}
