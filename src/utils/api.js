/**
 * API 请求相关工具函数
 * 主要用于处理与 UptimeRobot API 的通信
 */

import axios from 'axios'
import { processMonitorData, generateTimeRanges } from './monitor'

/** API 配置常量 */
const API_URL = import.meta.env.VITE_UPTIMEROBOT_API_URL
const API_KEY = import.meta.env.VITE_UPTIMEROBOT_API_KEY
const DAY_MS = 24 * 60 * 60 * 1000
const API_TIMEOUT_MS = 30000
const RESPONSE_TIME_AVERAGE_MINUTES = 60
const DOWNTIME_LOG_TYPE = '1'

/**
 * 获取监控数据
 * @async
 * @returns {Promise<Array>} 处理后的监控数据数组
 * @throws {Error} 当 API 请求失败时抛出错误
 */
export const fetchMonitorData = async () => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)
  const now = Math.floor(Date.now() / 1000)
  const twentyFourHoursAgo = Math.floor((Date.now() - DAY_MS) / 1000)
  const thirtyDaysAgo = Math.floor((Date.now() - 30 * DAY_MS) / 1000)

  try {
    const response = await axios.post(
      API_URL,
      {
        api_key: API_KEY,
        format: 'json',
        response_times: 1,
        response_times_average: RESPONSE_TIME_AVERAGE_MINUTES,
        logs: 1,
        log_types: DOWNTIME_LOG_TYPE,
        logs_start_date: thirtyDaysAgo,
        logs_end_date: now,
        custom_uptime_ranges: generateTimeRanges(),
        response_times_start_date: twentyFourHoursAgo,
        response_times_end_date: now
      },
      {
        signal: controller.signal,
        timeout: API_TIMEOUT_MS
      }
    )

    if (response.data?.stat !== 'ok') {
      throw new Error('API 请求失败: ' + response.data?.message || '未知错误')
    }

    return response.data.monitors
      .sort((a, b) => b.create_datetime - a.create_datetime)
      .map(processMonitorData)

  } catch (error) {
    console.error('获取监控数据失败:', error)
    throw new Error('获取监控数据失败: ' + error.message)
  } finally {
    clearTimeout(timeoutId)
  }
}
