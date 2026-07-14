<template>
  <div class="wrap">
    <div class="hero">
      <h1>直播带货资料管理系统</h1>
      <p>集中管理产品资料 · 快速组建直播场次 · 智能匹配提报表信息</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats">
      <div class="stat card">
        <div class="stat-label">产品总数</div>
        <div class="stat-val pri">{{ products?.length || 0 }}</div>
      </div>
      <div class="stat card">
        <div class="stat-label">本月场次</div>
        <div class="stat-val">{{ thisMonthCount }}</div>
      </div>
      <div class="stat card">
        <div class="stat-label">下场直播</div>
        <div class="stat-val ok">{{ nextSessionDate }}</div>
      </div>
      <div class="stat card">
        <div class="stat-label">历史场次</div>
        <div class="stat-val">{{ sessions?.length || 0 }}</div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <NuxtLink to="/sessions?new=1" class="qa-card card card-hover">
        <h3>➕ 新建直播场次</h3>
        <p>创建新场次，选择平台，添加产品并排列讲解顺序</p>
      </NuxtLink>
      <NuxtLink to="/products" class="qa-card card card-hover">
        <h3>📦 浏览产品库</h3>
        <p>查看和管理所有产品资料，支持按品类和品牌搜索</p>
      </NuxtLink>
    </div>

    <!-- 近期场次 -->
    <div class="section-title">
      <span>近期场次</span>
      <NuxtLink to="/sessions">查看全部 →</NuxtLink>
    </div>
    <div v-if="!sessions?.length" class="empty-note">还没有场次，先去创建一个吧</div>
    <div v-else class="session-list">
      <NuxtLink v-for="s in recentSessions" :key="s.id" :to="`/sessions/${s.id}`" class="s-card card card-hover">
        <div class="s-date">
          <div class="d">{{ dayOf(s.date) }}</div>
          <div class="m">{{ monthOf(s.date) }}</div>
        </div>
        <div class="s-info">
          <h4>{{ s.name }}</h4>
          <span :class="['tag', s.platform === 'xiaohongshu' ? 'tag-xhs' : 'tag-ks']">
            {{ s.platform === 'xiaohongshu' ? '小红书' : '快手' }}
          </span>
          <span :class="['tag', statusTag(s)]">{{ statusLabel(s) }}</span>
        </div>
        <div class="s-count">{{ s._count?.products || 0 }} 品</div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
const { data: products } = await useFetch('/api/products')
const { data: sessions } = await useFetch('/api/sessions')

const today = () => new Date().toISOString().slice(0, 10)

// 本月场次数量
const thisMonthCount = computed(() => {
  if (!sessions.value) return 0
  const ym = new Date().toISOString().slice(0, 7)
  return sessions.value.filter(s => s.date?.startsWith(ym)).length
})

// 下场直播日期
const nextSessionDate = computed(() => {
  if (!sessions.value) return '—'
  const now = today()
  const upcoming = sessions.value
    .filter(s => s.date >= now)
    .sort((a, b) => a.date.localeCompare(b.date))
  if (!upcoming.length) return '暂无'
  const d = upcoming[0].date
  const [, m, day] = d.split('-')
  return `${parseInt(m)}月${parseInt(day)}日`
})

// 最近 5 个场次
const recentSessions = computed(() => {
  if (!sessions.value) return []
  return sessions.value.slice(0, 5)
})

// 日期解析
function dayOf(dateStr) {
  if (!dateStr) return '—'
  return parseInt(dateStr.split('-')[2] || '—')
}
function monthOf(dateStr) {
  if (!dateStr) return ''
  const m = parseInt(dateStr.split('-')[1] || 0)
  return m ? `${m}月` : ''
}

// 场次状态
function statusTag(s) {
  const now = today()
  if (s.date > now) return 'tag-upcoming'
  if (s.date === now) return 'tag-live'
  return 'tag-done'
}
function statusLabel(s) {
  const now = today()
  if (s.date > now) return '即将开播'
  if (s.date === now) return '直播中'
  return '已结束'
}
</script>

<style scoped>
.hero {
  background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
  border-radius: 16px; padding: 40px; color: #fff; margin-bottom: 24px;
}
.hero h1 { font-size: 28px; margin-bottom: 8px; }
.hero p { opacity: 0.85; font-size: 15px; }

.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
.stat { padding: 20px; }
.stat-label { font-size: 13px; color: var(--txt2); }
.stat-val { font-size: 28px; font-weight: 700; margin-top: 4px; }
.stat-val.pri { color: var(--pri); }
.stat-val.ok { color: var(--ok); }

.quick-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
.qa-card { padding: 20px; cursor: pointer; text-decoration: none; color: var(--txt); }
.qa-card h3 { font-size: 15px; margin-bottom: 6px; }
.qa-card p { font-size: 13px; color: var(--txt2); }

.section-title {
  font-size: 16px; font-weight: 600; margin-bottom: 14px;
  display: flex; align-items: center; justify-content: space-between;
}
.section-title a { font-size: 13px; color: var(--pri); font-weight: 400; }

.session-list { display: flex; flex-direction: column; gap: 10px; }
.s-card {
  padding: 16px 20px; display: flex; align-items: center; gap: 16px;
  cursor: pointer; text-decoration: none; color: var(--txt);
}
.s-date { text-align: center; min-width: 50px; }
.s-date .d { font-size: 22px; font-weight: 700; color: var(--pri); }
.s-date .m { font-size: 12px; color: var(--txt2); }
.s-info { flex: 1; }
.s-info h4 { font-size: 14px; margin-bottom: 2px; }
.s-info .tag { margin-right: 4px; }
.s-count { font-size: 13px; color: var(--txt2); min-width: 50px; text-align: right; }

.empty-note { text-align: center; padding: 32px; color: var(--txt2); font-size: 14px; background: var(--card); border-radius: var(--radius); border: 1px dashed var(--bdr); }

.tag-upcoming { background: #ECFDF5; color: var(--ok); }
.tag-live { background: #FEF2F2; color: var(--red); }
.tag-done { background: var(--bg); color: var(--txt2); }

@media (max-width: 768px) {
  .stats { grid-template-columns: 1fr 1fr; }
  .quick-actions { grid-template-columns: 1fr; }
}
</style>
