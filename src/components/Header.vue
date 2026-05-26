<template>
  <div class="ice-panel sticky top-4 z-30 flex items-center justify-between gap-3 rounded-lg px-4 py-4 sm:px-5">
    <div class="flex min-w-0 items-center gap-3">
      <img 
        src="/logo.svg" 
        alt="Logo" 
        class="h-11 w-11 rounded-lg border border-sky-200/70 bg-white/80 p-1.5 shadow-sm shadow-sky-500/10 dark:border-sky-300/20 dark:bg-slate-900/60"
      />
      <div class="min-w-0">
        <h1 class="truncate text-xl font-bold text-slate-900 dark:text-sky-50 sm:text-2xl">
          {{ title }}
        </h1>
        <div class="mt-1 h-1 w-24 rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-transparent" />
      </div>
    </div>
    <div class="flex shrink-0 items-center gap-3">
      <button
        @click="refreshData"
        :disabled="isRefreshing"
        aria-label="刷新监控数据"
        class="frost-button group"
      >
        <Icon 
          icon="ph:arrows-counter-clockwise-bold" 
          class="h-4 w-4 transition-all group-hover:rotate-45"
          :class="isRefreshing ? 'animate-spin' : ''"
        />
        <span class="hidden text-sm tabular-nums sm:block">
          {{ `${formatTime(countdown)}后刷新` }}
        </span>
      </button>
      <button
        @click="toggleTheme"
        aria-label="切换明暗主题"
        class="icon-button group overflow-hidden border border-sky-200/70 bg-white/85 text-sky-700 shadow-sm shadow-sky-500/10 hover:border-sky-300 hover:bg-sky-50 dark:border-sky-300/20 dark:bg-slate-900/70 dark:text-sky-100 dark:hover:bg-sky-950/70"
      >
        <div class="relative h-5 w-5">
          <Icon 
            icon="bi:sun" 
            class="absolute h-5 w-5 transition-all duration-500 transform"
            :class="isDark ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'"
          />
          <Icon 
            icon="bi:moon"
            class="absolute h-5 w-5 transition-all duration-500 transform"
            :class="isDark ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'"
          />
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  isRefreshing: {
    type: Boolean,
    default: false
  },
  isDark: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['refresh', 'toggle-theme'])

/**
 * 刷新间隔
 */
const REFRESH_INTERVAL = 300 // 5分钟 = 300秒
const countdown = ref(REFRESH_INTERVAL)
let timer = null

/**
 * 启动计时器
 */
const startTimer = () => {
  clearInterval(timer) // 确保只有一个计时器在运行
  countdown.value = REFRESH_INTERVAL
  timer = setInterval(() => {
    if (!props.isRefreshing && countdown.value > 0) {
      countdown.value--
      if (countdown.value === 0) {
        emit('refresh')
        countdown.value = REFRESH_INTERVAL
      }
    }
  }, 1000)
}

/**
 * 刷新数据
 */
const refreshData = () => (emit('refresh'), countdown.value = REFRESH_INTERVAL)

/**
 * 切换主题
 */
const toggleTheme = () => {
  emit('toggle-theme')
}

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>
