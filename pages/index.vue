<template>
  <div class="wrap">
    <div class="hero">
      <h1>直播带货资料管理系统</h1>
      <p>集中管理产品资料 · 快速组建直播场次 · 智能匹配提报表信息</p>
    </div>
    <div class="stats">
      <div class="stat card">
        <div class="stat-label">产品总数</div>
        <div class="stat-val pri">{{ stats.products }}</div>
      </div>
      <div class="stat card">
        <div class="stat-label">本月场次</div>
        <div class="stat-val">{{ stats.sessionsThisMonth }}</div>
      </div>
      <div class="stat card">
        <div class="stat-label">下场直播</div>
        <div class="stat-val ok">{{ stats.nextSession }}</div>
      </div>
      <div class="stat card">
        <div class="stat-label">历史场次</div>
        <div class="stat-val">{{ stats.totalSessions }}</div>
      </div>
    </div>
    <p style="color: var(--txt2); font-size: 14px;">Phase 0 骨架搭建中 — 后续将在此显示数据概览和快捷操作</p>
  </div>
</template>

<script setup>
// Phase 0: 静态占位数据，Phase 6 接真实 API
const stats = reactive({
  products: 0,
  sessionsThisMonth: 0,
  nextSession: '—',
  totalSessions: 0
})
</script>

<style scoped>
.hero {
  background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
  border-radius: 16px;
  padding: 40px;
  color: #fff;
  margin-bottom: 24px;
}
.hero h1 { font-size: 28px; margin-bottom: 8px; }
.hero p { opacity: 0.85; font-size: 15px; }
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}
.stat { padding: 20px; }
.stat-label { font-size: 13px; color: var(--txt2); }
.stat-val { font-size: 28px; font-weight: 700; margin-top: 4px; }
.stat-val.pri { color: var(--pri); }
.stat-val.ok { color: var(--ok); }
</style>
