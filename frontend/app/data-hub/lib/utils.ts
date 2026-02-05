/**
 * 数据中心通用工具函数
 */

/**
 * 格式化数字
 * 优先使用"万"单位（符合中文习惯），回退到 K/M（国际惯例）
 *
 * @param num - 数字或字符串类型的数字
 * @returns 格式化后的字符串
 */
export function formatNumber(num: number | string): string {
  // 处理字符串输入
  if (typeof num === 'string') {
    const parsed = parseFloat(num)
    if (isNaN(parsed)) return num
    num = parsed
  }

  // 中文单位优先（用于国内社媒）
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`

  // 国际单位（用于海外信源）
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`

  return num.toString()
}

/**
 * 格式化相对时间（通用版本）
 *
 * @param dateStr - 日期字符串或 Date 对象
 * @returns 相对时间描述
 */
export function formatTime(dateStr: string | Date | number): string {
  try {
    let date: Date

    if (typeof dateStr === 'number') {
      // 时间戳
      date = new Date(dateStr)
    } else if (typeof dateStr === 'string') {
      // 字符串
      date = new Date(dateStr)
    } else {
      // Date 对象
      date = dateStr
    }

    if (isNaN(date.getTime())) return String(dateStr)

    const now = new Date()
    const diff = now.getTime() - date.getTime()

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 30) return `${days}天前`
    if (days < 365) return `${Math.floor(days / 30)}个月前`

    return date.toLocaleDateString('zh-CN')
  } catch {
    return String(dateStr)
  }
}

/**
 * 格式化相对时间（适用于时间戳）
 *
 * @param timestamp - 时间戳（毫秒）
 * @returns 相对时间描述
 */
export function formatRelativeTime(timestamp: number): string {
  return formatTime(timestamp)
}

/**
 * 格式化日期时间
 *
 * @param timestamp - 时间戳（毫秒）
 * @returns 格式化的日期时间字符串
 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 格式化日期键（YYYY-MM-DD）
 *
 * @param date - Date 对象
 * @returns YYYY-MM-DD 格式的字符串
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 格式化显示日期（中文格式）
 *
 * @param dateKey - YYYY-MM-DD 格式的日期字符串
 * @returns 中文日期格式（例如：2026年2月5日 星期三）
 */
export function formatDisplayDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const weekday = weekdays[date.getDay()]
  return `${year}年${month}月${day}日 ${weekday}`
}
