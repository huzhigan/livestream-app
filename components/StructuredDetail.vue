<template>
  <div class="sd">
    <div v-for="(sec, si) in visibleSections" :key="si" class="sd-sec">
      <div class="sd-sec-hd">
        <span v-if="sec.icon" class="sd-icon">{{ sec.icon }}</span>
        <span class="sd-title">{{ sec.title }}</span>
      </div>

      <template v-for="(b, bi) in sec.blocks" :key="bi">
        <!-- 键值表 -->
        <table v-if="b.type === 'kv'" class="sd-kv">
          <tbody>
            <tr v-for="(r, ri) in b.rows" :key="ri">
              <td class="sd-kv-label">{{ r.label }}</td>
              <td class="sd-kv-val">{{ r.value }}</td>
            </tr>
          </tbody>
        </table>

        <!-- 价格/通用表格 -->
        <div v-else-if="b.type === 'table'" class="sd-table-wrap">
          <table class="sd-table">
            <thead v-if="b.header.length"><tr><th v-for="(h, hi) in b.header" :key="hi">{{ h }}</th></tr></thead>
            <tbody>
              <tr v-for="(row, ri) in b.rows" :key="ri">
                <td v-for="(cell, ci) in row" :key="ci" :class="{ 'sd-price': isPrice(cell) }">{{ cell }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 人群标签 -->
        <div v-else-if="b.type === 'chips'" class="sd-chips">
          <span v-for="(c, ci) in b.items" :key="ci" class="sd-chip">{{ c }}</span>
        </div>

        <!-- 卖点卡片 -->
        <div v-else-if="b.type === 'sell'" class="sd-sell">
          <div v-for="(s, si2) in b.items" :key="si2" class="sd-sell-item">
            <div class="sd-sell-hd"><span v-if="s.num" class="sd-sell-num">{{ s.num }}</span><span class="sd-sell-title">{{ s.title }}</span></div>
            <div v-if="s.desc" class="sd-sell-desc">{{ s.desc }}</div>
          </div>
        </div>

        <!-- 列表 -->
        <ul v-else-if="b.type === 'list'" class="sd-list">
          <li v-for="(it, li) in b.items" :key="li">{{ it }}</li>
        </ul>

        <!-- 段落 -->
        <p v-else-if="b.type === 'text'" class="sd-text">{{ b.text }}</p>

        <!-- 兜底 HTML -->
        <div v-else class="sd-html" v-html="b.html"></div>
      </template>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  data: { type: Object, required: true },
})

const visibleSections = computed(() =>
  (props.data.sections || []).filter(s => s.blocks && s.blocks.length)
)

function isPrice(cell) {
  return /[¥元]/.test(cell) && /\d/.test(cell)
}
</script>

<style scoped>
.sd { display: flex; flex-direction: column; gap: 20px; max-width: 960px; }
.sd-sec-hd { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.sd-icon { font-size: 16px; }
.sd-title { font-size: 15px; font-weight: 700; color: var(--txt); }

/* 键值表 */
.sd-kv { width: 100%; border-collapse: collapse; font-size: 13px; }
.sd-kv td { padding: 8px 10px; border: 1px solid var(--bdr); vertical-align: top; }
.sd-kv-label { color: var(--txt2); width: 90px; background: var(--bg); font-weight: 500; white-space: nowrap; }
.sd-kv-val { color: var(--txt); }

/* 通用表格 */
.sd-table-wrap { overflow-x: auto; }
.sd-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.sd-table th { background: var(--bg); padding: 8px 10px; text-align: left; font-size: 12px; color: var(--txt2); border: 1px solid var(--bdr); }
.sd-table td { padding: 8px 10px; border: 1px solid var(--bdr); vertical-align: top; }
.sd-price { color: var(--red); font-weight: 700; white-space: nowrap; }

/* 人群标签 */
.sd-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.sd-chip { background: var(--pri-l); color: var(--pri); font-size: 12px; padding: 4px 10px; border-radius: 999px; font-weight: 500; }

/* 卖点卡片 */
.sd-sell { display: flex; flex-direction: column; gap: 8px; }
.sd-sell-item { background: var(--bg); border: 1px solid var(--bdr); border-radius: 8px; padding: 10px 14px; }
.sd-sell-hd { display: flex; align-items: center; gap: 8px; }
.sd-sell-num { background: var(--pri); color: #fff; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
.sd-sell-title { font-size: 13px; font-weight: 600; color: var(--txt); }
.sd-sell-desc { font-size: 12px; color: var(--txt2); margin-top: 4px; line-height: 1.6; }

/* 列表 / 段落 */
.sd-list { list-style: disc; padding-left: 20px; display: flex; flex-direction: column; gap: 4px; }
.sd-list li { font-size: 13px; color: var(--txt); line-height: 1.7; }
.sd-text { font-size: 13px; color: var(--txt); line-height: 1.8; }

/* 兜底 HTML */
.sd-html { font-size: 13px; line-height: 1.7; }
.sd-html :deep(table) { width: 100%; border-collapse: collapse; }
.sd-html :deep(th), .sd-html :deep(td) { padding: 6px 8px; border: 1px solid var(--bdr); }
.sd-html :deep(img) { max-width: 100%; height: auto; border-radius: 8px; }
</style>
