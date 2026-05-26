<template>
  <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
    <div 
      v-for="(item, index) in overviewItems" 
      :key="index"
      class="card-base animated-border animate-fade overflow-hidden"
      :class="[item.containerClass]"
      @mouseenter="$event.currentTarget.classList.add('hovered')"
    >
      <div class="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/80 to-transparent dark:via-sky-200/30" />
      <div class="relative flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="text-xs font-semibold text-slate-500 dark:text-sky-100/70 sm:text-sm">
            {{ item.label }}
          </div>
          <div class="mt-2 flex items-baseline gap-1 text-xl font-bold text-slate-950 dark:text-sky-50 sm:text-2xl">
            <span class="tabular-nums">{{ displayValues[index] }}</span><span v-if="item.unit" class="text-sm text-slate-500 dark:text-sky-100/65">{{ item.unit }}</span>
          </div>
          <div class="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {{ item.desc }}
          </div>
        </div>
        <div class="shrink-0 rounded-lg border p-2.5 shadow-sm" :class="item.iconFrame">
          <Icon 
            :icon="item.icon" 
            class="h-6 w-6 transition-colors duration-200" 
            :class="item.iconColor" 
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  monitors: {
    type: Array,
    default: () => []
  }
})

/**
 * 计算网站总数
 */
const total = computed(() => props.monitors.length)

/**
 * 计算正常网站数
 */
const normal = computed(() => props.monitors.filter(m => m.status === 2 || m.status === 1).length)

/**
 * 计算异常网站数
 */
const abnormal = computed(() => props.monitors.filter(m => m.status === 9 || m.status === 0).length)
const avgResponse = computed(() => {
  if (!props.monitors?.length) return 0
  const onlineMonitors = props.monitors.filter(m => 
    m.status === 2 && m.stats?.avgResponseTime > 0
  )
  if (!onlineMonitors.length) return 0
  return Math.round(
    onlineMonitors.reduce((acc, m) => acc + m.stats.avgResponseTime, 0) / onlineMonitors.length
  )
})

/**
 * 显示值
 */
const displayValues = ref([0, 0, 0, 0])

/**
 * 动画值
 */
const animateValue = (start, end, duration, index) => {
  const startTime = performance.now()
  const updateValue = (currentTime) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    displayValues.value[index] = Math.floor(start + (end - start) * progress)

    if (progress < 1) {
      requestAnimationFrame(updateValue)
    }
  }
  requestAnimationFrame(updateValue)
}

/**
 * 概览项
 */
const overviewItems = computed(() => [
  {
    label: '监控网站',
    value: total.value,
    desc: '全部网站',
    icon: 'carbon:dashboard',
    iconColor: 'text-sky-500 dark:text-sky-300',
    iconFrame: 'border-sky-200/70 bg-sky-50/80 dark:border-sky-300/20 dark:bg-sky-950/40',
    containerClass: 'after:border-sky-500/50 dark:after:border-sky-300/50'
  },
  {
    label: '正常网站',
    value: normal.value,
    desc: '访问正常',
    icon: 'bi:check-circle-fill',
    iconColor: 'text-teal-500 dark:text-teal-300',
    iconFrame: 'border-teal-200/70 bg-teal-50/80 dark:border-teal-300/20 dark:bg-teal-950/40',
    containerClass: 'after:border-green-500/50 dark:after:border-green-400/50'
  },
  {
    label: '异常网站',
    value: abnormal.value,
    desc: '访问异常',
    icon: 'bi:x-circle-fill',
    iconColor: 'text-rose-500 dark:text-rose-300',
    iconFrame: 'border-rose-200/70 bg-rose-50/80 dark:border-rose-300/20 dark:bg-rose-950/40',
    containerClass: 'after:border-rose-500/50 dark:after:border-rose-400/50'
  },
  {
    label: '平均响应',
    value: avgResponse.value,
    unit: 'ms',
    desc: '网络延迟',
    icon: 'bi:clock',
    iconColor: 'text-indigo-500 dark:text-indigo-300',
    iconFrame: 'border-indigo-200/70 bg-indigo-50/80 dark:border-indigo-300/20 dark:bg-indigo-950/40',
    containerClass: 'after:border-indigo-500/50 dark:after:border-indigo-400/50'
  }
])

/**
 * 监听每个值的变化
 */
watch(() => overviewItems.value.map(item => item.value), (newValues, oldValues) => {
  newValues.forEach((newVal, index) => {
    const oldVal = oldValues?.[index] ?? 0
    if (newVal !== oldVal) {
      animateValue(oldVal, newVal, 1000, index)
    }
  })
}, { immediate: true })

/**
 * 组件挂载时启动动画
 */
onMounted(() => {
  overviewItems.value.forEach((item, index) => {
    animateValue(0, item.value, 1000, index)
  })
})
</script>
