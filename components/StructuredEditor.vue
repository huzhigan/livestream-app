<template>
  <div class="se">
    <div v-for="(sec, si) in data.sections" :key="si" class="se-sec">
      <div class="se-sec-hd">
        <span v-if="sec.icon" class="se-icon">{{ sec.icon }}</span>
        <input v-model="sec.title" class="input se-title" placeholder="板块标题">
        <button class="se-remove" title="删除板块" @click="data.sections.splice(si, 1)">&times;</button>
      </div>

      <div v-for="(b, bi) in sec.blocks" :key="bi" class="se-block">
        <div class="se-block-hd">
          <span class="se-block-type">{{ typeLabel(b.type) }}</span>
          <button class="se-remove" title="删除块" @click="sec.blocks.splice(bi, 1)">&times;</button>
        </div>

        <!-- 键值 -->
        <template v-if="b.type === 'kv'">
          <div v-for="(r, ri) in b.rows" :key="ri" class="se-kv-row">
            <input v-model="r.label" class="input" placeholder="标签">
            <input v-model="r.value" class="input" placeholder="值">
            <button class="se-remove" @click="b.rows.splice(ri, 1)">&times;</button>
          </div>
          <button class="btn btn-sm btn-outline" @click="b.rows.push({ label: '', value: '' })">+ 行</button>
        </template>

        <!-- 表格 -->
        <template v-else-if="b.type === 'table'">
          <div class="se-table">
            <div class="se-tr">
              <div v-for="(h, hi) in b.header" :key="hi" class="se-td">
                <input v-model="b.header[hi]" class="input" placeholder="表头">
                <button class="se-remove" title="删列" @click="removeCol(b, hi)">&times;</button>
              </div>
            </div>
            <div v-for="(row, ri) in b.rows" :key="ri" class="se-tr">
              <div v-for="(c, ci) in row" :key="ci" class="se-td">
                <input v-model="row[ci]" class="input">
              </div>
              <button class="se-remove" title="删行" @click="b.rows.splice(ri, 1)">&times;</button>
            </div>
            <div class="se-table-actions">
              <button class="btn btn-sm btn-outline" @click="addRow(b)">+ 行</button>
              <button class="btn btn-sm btn-outline" @click="addCol(b)">+ 列</button>
            </div>
          </div>
        </template>

        <!-- 标签 / 列表:一行一条 -->
        <template v-else-if="b.type === 'chips' || b.type === 'list'">
          <textarea class="input" rows="3" :value="b.items.join('\n')"
            :placeholder="b.type === 'chips' ? '每行一个标签' : '每行一条'"
            @input="b.items = $event.target.value.split('\n')"></textarea>
        </template>

        <!-- 卖点 -->
        <template v-else-if="b.type === 'sell'">
          <div v-for="(s, si2) in b.items" :key="si2" class="se-sell">
            <div class="se-sell-hd">
              <input v-model="s.num" class="input se-sell-num" placeholder="#">
              <input v-model="s.title" class="input" placeholder="卖点标题">
              <button class="se-remove" @click="b.items.splice(si2, 1)">&times;</button>
            </div>
            <textarea v-model="s.desc" class="input" rows="2" placeholder="卖点描述"></textarea>
          </div>
          <button class="btn btn-sm btn-outline" @click="b.items.push({ num: '', title: '', desc: '' })">+ 卖点</button>
        </template>

        <!-- 段落 -->
        <textarea v-else-if="b.type === 'text'" v-model="b.text" class="input" rows="3" placeholder="段落文字"></textarea>

        <!-- 兜底 HTML -->
        <textarea v-else v-model="b.html" class="input se-html" rows="4" placeholder="HTML"></textarea>
      </div>

      <button class="btn btn-sm btn-outline" @click="sec.blocks.push({ type: 'text', text: '' })">+ 段落</button>
    </div>

    <button class="btn btn-outline" @click="addSection">➕ 添加板块</button>
  </div>
</template>

<script setup>
const props = defineProps({
  data: { type: Object, required: true }, // reactive structured 对象,直接 mutate
})

const LABELS = { kv: '键值', table: '表格', chips: '标签', sell: '卖点', list: '列表', text: '段落', html: 'HTML' }
function typeLabel(t) { return LABELS[t] || t }

function addSection() {
  props.data.sections.push({ icon: '', title: '新板块', blocks: [{ type: 'text', text: '' }] })
}
function addRow(b) { b.rows.push(new Array(b.header.length || 1).fill('')) }
function addCol(b) { b.header.push(''); b.rows.forEach(r => r.push('')) }
function removeCol(b, ci) {
  if (b.header.length <= 1) return
  b.header.splice(ci, 1)
  b.rows.forEach(r => r.splice(ci, 1))
}
</script>

<style scoped>
.se { display: flex; flex-direction: column; gap: 16px; }
.se-sec { border: 1px solid var(--bdr); border-radius: 10px; padding: 12px; background: var(--bg); }
.se-sec-hd { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.se-icon { font-size: 15px; }
.se-title { flex: 1; font-weight: 600; }
.se-remove { background: none; border: none; color: var(--txt2); font-size: 16px; cursor: pointer; padding: 2px 6px; border-radius: 4px; line-height: 1; }
.se-remove:hover { color: #EF4444; background: #FEF2F2; }

.se-block { background: var(--card); border: 1px solid var(--bdr); border-radius: 8px; padding: 10px; margin-bottom: 8px; }
.se-block-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.se-block-type { font-size: 11px; color: var(--txt2); background: var(--bg); padding: 2px 8px; border-radius: 999px; }

.se-kv-row { display: flex; gap: 6px; align-items: center; margin-bottom: 6px; }
.se-kv-row input:first-child { width: 90px; flex-shrink: 0; }

.se-table { overflow-x: auto; }
.se-tr { display: flex; gap: 6px; align-items: center; margin-bottom: 6px; }
.se-td { display: flex; gap: 2px; align-items: center; flex: 1; }
.se-table-actions { display: flex; gap: 6px; }

.se-sell { border: 1px dashed var(--bdr); border-radius: 6px; padding: 8px; margin-bottom: 6px; }
.se-sell-hd { display: flex; gap: 6px; align-items: center; margin-bottom: 6px; }
.se-sell-num { width: 44px; flex-shrink: 0; }

.se-html { font-family: 'SF Mono', Monaco, monospace; font-size: 12px; }
</style>
