/**
 * 主页统计数据区域组件
 */

import { stats } from "../utils"

export function StatsSection() {
  return (
    <section className="py-12 sm:py-16 bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="text-center p-4 sm:p-6 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
              <p className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-teal-600 mb-1">
                {stat.value}
              </p>
              <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

