<template>
  <div class="wrap">
    <div class="page-hd">
      <h1>产品库</h1>
      <span class="count">共 {{ products?.length || 0 }} 个产品</span>
    </div>
    <div v-if="pending" class="loading">加载中...</div>
    <div v-else class="grid">
      <div v-for="p in products" :key="p.id" class="p-card card card-hover">
        <div :class="['p-thumb', colorMap[p.category] || 'c4']">{{ emojiMap[p.category] || '📦' }}</div>
        <div class="p-body">
          <div class="p-name">{{ p.name }}</div>
          <div class="p-brand">{{ p.brand }} · {{ p.spec }}</div>
          <div class="p-tags">
            <span v-for="t in parseTags(p.tags)" :key="t" class="tag">{{ t }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const { data: products, pending } = await useFetch('/api/products')

const colorMap = { '保健品': 'c4', '护肤品': 'c1', '彩妆': 'c5', '个护清洁': 'c2' }
const emojiMap = { '保健品': '💊', '护肤品': '🧴', '彩妆': '💄', '个护清洁': '🧼' }

function parseTags(tags) {
  try { return JSON.parse(tags) } catch { return [] }
}
</script>

<style scoped>
.page-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-hd h1 { font-size: 22px; }
.count { font-size: 13px; color: var(--txt2); }
.loading { text-align: center; padding: 40px; color: var(--txt2); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
.p-card { overflow: hidden; cursor: pointer; }
.p-thumb { height: 140px; display: flex; align-items: center; justify-content: center; font-size: 48px; }
.p-thumb.c1 { background: linear-gradient(135deg, #FDF4FF, #FAE8FF); }
.p-thumb.c2 { background: linear-gradient(135deg, #FFF7ED, #FFEDD5); }
.p-thumb.c4 { background: linear-gradient(135deg, #EFF6FF, #DBEAFE); }
.p-thumb.c5 { background: linear-gradient(135deg, #FEF2F2, #FECACA); }
.p-body { padding: 14px; }
.p-name { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
.p-brand { font-size: 12px; color: var(--txt2); margin-bottom: 8px; }
.p-tags { display: flex; flex-wrap: wrap; gap: 4px; }
</style>
