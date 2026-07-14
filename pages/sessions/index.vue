<template>
  <div class="wrap">
    <div class="page-hd">
      <h1>直播场次</h1>
      <button class="btn btn-pri" @click="showCreate = true">➕ 新建场次</button>
    </div>

    <div v-if="pending" class="loading">加载中...</div>
    <div v-else-if="!sessions?.length" class="empty">
      <div class="empty-icon">📺</div>
      <p>还没有直播场次，点击上方按钮创建第一个</p>
    </div>
    <div v-else class="list">
      <NuxtLink v-for="s in sessions" :key="s.id" :to="`/sessions/${s.id}`" class="s-card card card-hover">
        <div class="s-date">
          <div class="d">{{ dayOf(s.date) }}</div>
          <div class="m">{{ monthOf(s.date) }}月</div>
        </div>
        <div class="s-info">
          <h4>{{ s.name }}</h4>
          <div class="s-meta">
            <span :class="['tag', s.platform === 'xiaohongshu' ? 'tag-xhs' : 'tag-ks']">
              {{ s.platform === 'xiaohongshu' ? '📕 小红书' : '📹 快手' }}
            </span>
            <span :class="['tag', statusTag(s.status)]">{{ statusLabel(s.status) }}</span>
          </div>
        </div>
        <div class="s-right">
          <div class="s-count"><strong>{{ s._count.products }}</strong>产品</div>
          <div class="s-arrow">›</div>
        </div>
      </NuxtLink>
    </div>

    <!-- 新建场次弹窗 -->
    <div :class="['modal-overlay', { open: showCreate }]" @click.self="showCreate = false">
      <div class="modal">
        <div class="modal-hd">
          <h2>新建直播场次</h2>
          <button class="modal-close" @click="showCreate = false">&times;</button>
        </div>
        <div class="modal-bd">
          <div class="form-group">
            <label>场次名称</label>
            <input v-model="form.name" class="input" placeholder="例：绽家专场 · 夏日清洁好物">
          </div>
          <div class="form-group">
            <label>直播日期</label>
            <input v-model="form.date" type="date" class="input">
          </div>
          <div class="form-group">
            <label>直播平台</label>
            <div class="platform-pick">
              <div :class="['platform-opt', { selected: form.platform === 'xiaohongshu' }]" @click="form.platform = 'xiaohongshu'">
                <div class="p-icon">📕</div><div class="p-name">小红书</div>
              </div>
              <div :class="['platform-opt', { selected: form.platform === 'kuaishou' }]" @click="form.platform = 'kuaishou'">
                <div class="p-icon">📹</div><div class="p-name">快手</div>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>备注（选填）</label>
            <textarea v-model="form.notes" class="input" placeholder="例：主打清洁品类，配合夏日主题" rows="2"></textarea>
          </div>
        </div>
        <div class="modal-ft">
          <button class="btn btn-outline" @click="showCreate = false">取消</button>
          <button class="btn btn-pri" @click="createSession" :disabled="creating">{{ creating ? '创建中...' : '创建场次' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const { data: sessions, pending, refresh } = await useFetch('/api/sessions')

const showCreate = ref(false)
const creating = ref(false)
const form = reactive({ name: '', date: '', platform: 'xiaohongshu', notes: '' })

// 从首页快捷入口跳转时自动打开创建弹窗
onMounted(() => {
  if (route.query.new === '1') showCreate.value = true
})

function dayOf(d) { return d ? d.split('-')[2] : '' }
function monthOf(d) { return d ? parseInt(d.split('-')[1]) : '' }
function statusLabel(s) { return { prep: '准备中', upcoming: '即将开播', done: '已结束' }[s] || s }
function statusTag(s) { return { prep: 'tag-prep', upcoming: 'tag-upcoming', done: 'tag-done' }[s] || '' }

async function createSession() {
  if (!form.name || !form.date) return
  creating.value = true
  try {
    await $fetch('/api/sessions', { method: 'POST', body: { ...form } })
    showCreate.value = false
    form.name = ''; form.date = ''; form.platform = 'xiaohongshu'; form.notes = ''
    await refresh()
  } catch (e) {
    alert('创建失败: ' + (e.data?.message || e.message))
  } finally {
    creating.value = false
  }
}
</script>

<style scoped>
.page-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-hd h1 { font-size: 22px; }
.loading, .empty { text-align: center; padding: 60px 20px; color: var(--txt2); }
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.list { display: flex; flex-direction: column; gap: 10px; }
.s-card { padding: 18px 22px; display: flex; align-items: center; gap: 18px; cursor: pointer; color: var(--txt); }
.s-date { text-align: center; min-width: 52px; padding: 8px 0; background: var(--pri-l); border-radius: 8px; }
.s-date .d { font-size: 24px; font-weight: 700; color: var(--pri); line-height: 1; }
.s-date .m { font-size: 11px; color: var(--txt2); margin-top: 2px; }
.s-info { flex: 1; }
.s-info h4 { font-size: 15px; margin-bottom: 4px; }
.s-meta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.s-right { display: flex; align-items: center; gap: 16px; }
.s-count { font-size: 13px; color: var(--txt2); text-align: right; }
.s-count strong { font-size: 18px; color: var(--txt); display: block; }
.s-arrow { color: var(--bdr); font-size: 20px; }
.form-group { margin-bottom: 18px; }
.form-group label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; color: var(--txt2); }
.platform-pick { display: flex; gap: 10px; }
.platform-opt { flex: 1; padding: 14px; border: 2px solid var(--bdr); border-radius: 10px; text-align: center; cursor: pointer; transition: all 0.2s; }
.platform-opt:hover { border-color: var(--pri); }
.platform-opt.selected { border-color: var(--pri); background: var(--pri-l); }
.p-icon { font-size: 24px; margin-bottom: 4px; }
.p-name { font-size: 13px; font-weight: 500; }
</style>
