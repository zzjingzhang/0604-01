import React, { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface LayoutProps {
  children: ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const studentMenu = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/questions', label: '题库浏览', icon: '📚' },
    { path: '/exams', label: '我的考试', icon: '📝' },
    { path: '/wrong-book', label: '错题本', icon: '❌' },
    { path: '/scores', label: '成绩记录', icon: '📊' }
  ]

  const adminMenu = [
    { path: '/admin', label: '管理首页', icon: '📊' },
    { path: '/admin/questions', label: '题库管理', icon: '📚' },
    { path: '/admin/papers', label: '试卷管理', icon: '📄' },
    { path: '/admin/exams', label: '考试管理', icon: '📝' },
    { path: '/admin/statistics', label: '成绩统计', icon: '📈' }
  ]

  const menu = isAdmin ? adminMenu : studentMenu

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white shadow-lg fixed h-full">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-blue-600">在线考试平台</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin ? '管理后台' : '学生端'}
          </p>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-1">
            {menu.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="absolute bottom-0 w-full border-t p-4">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              {user?.real_name?.charAt(0) || user?.username?.charAt(0)}
            </div>
            <div className="ml-3">
              <p className="font-medium text-gray-800">{user?.real_name || user?.username}</p>
              <p className="text-sm text-gray-500">{isAdmin ? '管理员' : '学生'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            退出登录
          </button>
        </div>
      </aside>
      
      <main className="ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
