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
        <button class="btn btn-sm btn-outline fmt-btn" @click="showFormat = true" title="提报表格式说明">📋 格式</button>
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

    <!-- 提报表格式说明弹窗 -->
    <div :class="['modal-overlay', { open: showFormat }]" @click.self="showFormat = false">
      <div class="modal" style="max-width:560px">
        <div class="modal-hd">
          <h2>提报表格式说明</h2>
          <button class="modal-close" @click="showFormat = false">&times;</button>
        </div>
        <div class="modal-bd">
          <p class="fmt-intro">上传小红书直播提报表 Excel（.xlsx），系统会自动解析并匹配到场次产品。</p>
          <div class="fmt-section">
            <div class="fmt-section-hd">Sheet 要求</div>
            <ul class="fmt-list">
              <li>优先读取名为「直播产品信息」的 Sheet，找不到则取第一个</li>
              <li>第 1 行为表头（跳过），最后一行为品牌方注意事项（跳过）</li>
            </ul>
          </div>
          <div class="fmt-section">
            <div class="fmt-section-hd">列布局（A–S 共 19 列）</div>
            <table class="fmt-table">
              <thead><tr><th>列</th><th>字段</th><th>说明</th></tr></thead>
              <tbody>
                <tr><td>A</td><td>直播顺序</td><td>数字，同一产品的多个规格合并为同一序号</td></tr>
                <tr><td>B</td><td>品牌-产品名-规格</td><td><strong>必填</strong>，用于匹配产品库</td></tr>
                <tr><td>D</td><td>日常/官方价</td><td>—</td></tr>
                <tr><td>F</td><td>直播到手价</td><td>—</td></tr>
                <tr><td>G</td><td>优惠方式</td><td>—</td></tr>
                <tr><td>H</td><td>直播赠品</td><td>—</td></tr>
                <tr><td>L</td><td>赠品配送方式</td><td>—</td></tr>
                <tr><td>M</td><td>发货地</td><td>—</td></tr>
                <tr><td>N</td><td>发货时效</td><td>—</td></tr>
                <tr><td>Q</td><td>店铺服务</td><td>—</td></tr>
                <tr><td>R</td><td>保质期/到期日期</td><td>—</td></tr>
              </tbody>
            </table>
            <p class="fmt-note">C(图片) E(卖点) I(赠品图片) J(佣金) K(邀请码) O(库存) P(不包邮地区) S(产品链接) 不导入</p>
          </div>
          <div class="fmt-section">
            <div class="fmt-section-hd">合并单元格</div>
            <ul class="fmt-list">
              <li>同一产品的多个规格，A 列（直播顺序）会合并单元格 —— 系统自动向下填充，无需手动展开</li>
              <li>每行对应一个规格，F/H 列（价格/赠品）各行独立</li>
            </ul>
          </div>
        </div>
        <div class="modal-ft">
          <button class="btn btn-pri" @click="showFormat = false">知道了</button>
        </div>
      </div>
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
const showFormat = ref(false)
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
.fmt-btn { font-size: 12px; padding: 6px 10px; }
.fmt-intro { font-size: 13px; color: var(--txt2); margin-bottom: 16px; line-height: 1.6; }
.fmt-section { margin-bottom: 16px; }
.fmt-section-hd { font-size: 13px; font-weight: 700; color: var(--txt); margin-bottom: 8px; }
.fmt-list { list-style: disc; padding-left: 20px; font-size: 13px; color: var(--txt2); line-height: 1.8; }
.fmt-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 8px; }
.fmt-table th { background: var(--bg); padding: 6px 8px; text-align: left; color: var(--txt2); border: 1px solid var(--bdr); }
.fmt-table td { padding: 6px 8px; border: 1px solid var(--bdr); }
.fmt-note { font-size: 11px; color: var(--txt2); line-height: 1.6; }
</style>
