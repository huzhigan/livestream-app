// composables/useToast.ts — 全局 Toast 通知系统
interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

const toasts = ref<ToastItem[]>([])
let nextId = 1

export function useToast() {
  function toast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    const id = nextId++
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, 3000)
  }

  return { toasts: readonly(toasts), toast }
}
