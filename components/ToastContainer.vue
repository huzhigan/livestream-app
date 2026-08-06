<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div v-for="t in toasts" :key="t.id" :class="['toast', t.type]">
          {{ t.message }}
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
const { toasts } = useToast()
</script>

<style scoped>
.toast-container {
  position: fixed; top: 20px; right: 20px; z-index: 9999;
  display: flex; flex-direction: column; gap: 8px; pointer-events: none;
}
.toast {
  padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 500;
  color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  pointer-events: auto; max-width: 320px;
}
.toast.success { background: var(--ok); }
.toast.error { background: var(--red); }
.toast.info { background: var(--pri); }

.toast-enter-active { transition: all 0.3s ease-out; }
.toast-leave-active { transition: all 0.3s ease-in; }
.toast-enter-from { opacity: 0; transform: translateX(40px); }
.toast-leave-to { opacity: 0; transform: translateX(40px); }
</style>
