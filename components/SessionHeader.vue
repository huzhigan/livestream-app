<template>
  <div class="sess-hd card">
    <div class="sess-top">
      <div>
        <div class="sess-title">{{ session.name }}</div>
        <div class="sess-meta">
          <span :class="['tag', session.platform === 'xiaohongshu' ? 'tag-xhs' : 'tag-ks']">
            {{ session.platform === 'xiaohongshu' ? '📕 小红书' : '📹 快手' }}
          </span>
          <span>📅 {{ session.date }}</span>
          <span v-if="session.notes">📝 {{ session.notes }}</span>
        </div>
      </div>
      <div class="actions">
        <button class="btn btn-live" :disabled="!session.products.length" @click="$emit('enter-live')">🔴 直播模式</button>
        <button class="btn btn-outline" @click="$emit('copy')" :disabled="copying">{{ copying ? '复制中...' : '📋 复制场次' }}</button>
        <button class="btn btn-outline btn-danger" @click="$emit('delete')" title="删除场次">🗑 删除</button>
        <button class="btn btn-outline" @click="triggerUpload">📥 上传提报表</button>
        <button class="btn btn-outline" @click="$emit('open-add')">➕ 添加产品</button>
        <input ref="fileInput" type="file" accept=".xlsx,.xls" style="display:none" @change="onFileChange">
      </div>
    </div>
    <!-- 状态切换 -->
    <div class="status-bar">
      <span class="status-label">状态：</span>
      <button v-for="s in statusOptions" :key="s.value"
        :class="['btn btn-sm', session.status === s.value ? s.activeClass : 'btn-outline']"
        @click="$emit('change-status', s.value)">{{ s.label }}</button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  session: { type: Object, required: true },
  copying: { type: Boolean, default: false },
})

const statusOptions = [
  { value: 'prep', label: '准备中', activeClass: 'btn-pri' },
  { value: 'upcoming', label: '即将开播', activeClass: 'btn-pri' },
  { value: 'done', label: '已结束', activeClass: 'btn-pri' },
]

const fileInput = ref(null)
function triggerUpload() { fileInput.value?.click() }
function onFileChange(e) {
  const file = e.target.files?.[0]
  e.target.value = '' // 重置，允许重复选同一文件
  if (file) emit('upload-file', file)
}

const emit = defineEmits(['enter-live', 'copy', 'delete', 'change-status', 'open-add', 'upload-file'])
</script>

<style scoped>
.sess-hd { padding: 24px; margin-bottom: 20px; }
.sess-top { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
.sess-title { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
.sess-meta { display: flex; gap: 8px; align-items: center; font-size: 13px; color: var(--txt2); flex-wrap: wrap; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; }
.status-bar { margin-top: 12px; display: flex; align-items: center; gap: 6px; }
.status-label { font-size: 12px; color: var(--txt2); }
.btn-danger { color: var(--red) !important; border-color: var(--red) !important; }
.btn-danger:hover { background: #FEF2F2 !important; }
</style>
