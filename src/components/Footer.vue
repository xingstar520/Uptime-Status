<template>
  <footer class="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 text-center sm:px-8">
    <!-- 返回顶部按钮 -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-4"
    >
      <button 
        v-show="showBackToTop"
        @click="scrollToTop"
        aria-label="返回顶部"
        class="icon-button fixed bottom-20 right-6 z-50 border border-sky-200/70 bg-white/90 text-sky-700 shadow-lg shadow-sky-500/15 hover:bg-sky-50 dark:border-sky-300/20 dark:bg-slate-900/85 dark:text-sky-100 dark:hover:bg-sky-950/70 group"
      >
        <Icon 
          icon="carbon:arrow-up" 
          class="h-6 w-6 transition-transform duration-200 
            group-hover:-translate-y-0.5
            group-hover:text-sky-500 dark:group-hover:text-sky-200" 
        />
      </button>
    </Transition>

    <div class="flex flex-col items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
      <div class="flex items-center gap-6">
        <a 
          :href="pkg.repository.url"
          target="_blank"
          rel="noopener noreferrer"
          class="icon-button border border-transparent text-slate-400 hover:border-sky-200/70 hover:bg-sky-50 hover:text-sky-700 dark:text-slate-500 dark:hover:border-sky-300/20 dark:hover:bg-sky-950/50 dark:hover:text-sky-100"
        >
          <Icon icon="ri:github-line" class="h-5 w-5" />
        </a>
        <a 
          :href="pkg.url"
          target="_blank"
          rel="noopener noreferrer"
          class="icon-button border border-transparent text-slate-400 hover:border-sky-200/70 hover:bg-sky-50 hover:text-sky-700 dark:text-slate-500 dark:hover:border-sky-300/20 dark:hover:bg-sky-950/50 dark:hover:text-sky-100"
        >
          <Icon icon="carbon:home" class="h-5 w-5" />
        </a>
        <a 
          :href="`mailto:${pkg.email}`"
          class="icon-button border border-transparent text-slate-400 hover:border-sky-200/70 hover:bg-sky-50 hover:text-sky-700 dark:text-slate-500 dark:hover:border-sky-300/20 dark:hover:bg-sky-950/50 dark:hover:text-sky-100"
        >
          <Icon icon="carbon:email" class="h-5 w-5" />
        </a>
      </div>
      <div class="flex flex-col items-center gap-1">
        <div>
          <a 
            :href="pkg.repository.url" 
            target="_blank" 
            rel="noopener noreferrer"
            class="font-semibold text-slate-700 transition-colors hover:text-sky-600 dark:text-sky-100 dark:hover:text-sky-300"
          >Uptime-Status</a> Version {{ pkg.version }}
        </div>
        <div>
          基于 <a 
            href="https://uptimerobot.com" 
            target="_blank" 
            rel="noopener noreferrer"
            class="font-semibold text-slate-700 transition-colors hover:text-sky-600 dark:text-sky-100 dark:hover:text-sky-300"
          >UptimeRobot</a> 接口 | 检测频率 5 分钟
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import pkg from '../../package.json'

/**
 * 控制返回顶部按钮的显示
 */
const showBackToTop = ref(false)
const SCROLL_THRESHOLD = 300

/**
 * 监听滚动事件
 */
const handleScroll = () => {
  showBackToTop.value = window.scrollY > SCROLL_THRESHOLD
}

/**
 * 平滑滚动到顶部
 */
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script> 
