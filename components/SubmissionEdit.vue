<template>
  <Teleport to="body">
    <div :class="['modal-overlay', { open: show }]" @click.self="close">
      <div v-if="show" class="modal" style="max-width:560px">
        <div class="modal-hd">
          <h2>编辑提报表信息</h2>
          <button class="modal-close" @click="close">&times;</button>
        </div>
        <div class="modal-bd">
          <div v-if="productName" class="edit-product-name">{{ productName }}</div>
          <div class="form-grid">
            <div class="form-group">
              <label>直播到手价</label>
              <input v-model="form.livePrice" class="input" placeholder="例: 79.9">
            </div>
            <div class="form-group">
              <label>日常价</label>
              <input v-model="form.retailPrice" class="input" placeholder="例: 149.9">
            </div>
            <div class="form-group">
              <label>优惠方式</label>
              <input v-model="form.discountType" class="input" placeholder="例: 直播专属券">
            </div>
            <div class="form-group">
              <label>赠品</label>
              <input v-model="form.gifts" class="input" placeholder="例: 香氛卡*2">
            </div>
            <div class="form-group">
              <label>赠品配送</label>
              <input v-model="form.giftDelivery" class="input" placeholder="例: 随单">
            </div>
            <div class="form-group">
              <label>发货地</label>
              <input v-model="form.shipFrom" class="input" placeholder="例: 义乌/广州">
            </div>
            <div class="form-group">
              <label>发货时效</label>
              <input v-model="form.shipTime" class="input" placeholder="例: 48h">
            </div>
            <div class="form-group">
              <label>保质期</label>
              <input v-model="form.expiryInfo" class="input" placeholder="例: 2026年 3年">
            </div>
            <div class="form-group full-width">
              <label>店铺服务</label>
              <input v-model="form.shopService" class="input" placeholder="例: 支持7天无理由">
            </div>
          </div>
        </div>
        <div class="modal-ft">
          <button class="btn btn-outline" @click="close">取消</button>
          <button class="btn btn-pri" @click="save" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const emit = defineEmits(['close', 'saved'])

const show = ref(false)
const saving = ref(false)
const productName = ref('')
const sessionProduct = ref(null)

const FIELDS = [
  'livePrice', 'retailPrice', 'discountType', 'gifts', 'giftDelivery',
  'shipFrom', 'shipTime', 'shopService', 'expiryInfo', 'productFullName'
]

const form = reactive(Object.fromEntries(FIELDS.map(f => [f, ''])))

function open(sp) {
  sessionProduct.value = sp
  productName.value = sp.product?.name || ''
  try {
    const data = JSON.parse(sp.submissionData || '{}')
    FIELDS.forEach(f => { form[f] = data[f] || '' })
  } catch {
    FIELDS.forEach(f => { form[f] = '' })
  }
  show.value = true
}

function close() {
  show.value = false
  emit('close')
}

async function save() {
  if (!sessionProduct.value) return
  saving.value = true
  try {
    const submissionData = {}
    FIELDS.forEach(f => { if (form[f]) submissionData[f] = form[f] })
    const sessionId = sessionProduct.value.sessionId
    const productId = sessionProduct.value.productId
    await $fetch(`/api/sessions/${sessionId}/submission`, {
      method: 'PUT',
      body: { updates: [{ productId, submissionData }] }
    })
    close()
    emit('saved')
  } catch (e) {
    alert('保存失败: ' + (e.data?.message || e.message))
  } finally {
    saving.value = false
  }
}

defineExpose({ open })
</script>

<style scoped>
.edit-product-name { font-weight: 600; font-size: 15px; margin-bottom: 16px; color: var(--txt); }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-group { display: flex; flex-direction: column; }
.form-group.full-width { grid-column: 1 / -1; }
.form-group label { font-size: 12px; color: var(--txt2); margin-bottom: 4px; }
.form-group .input { font-size: 13px; padding: 8px 10px; }
</style>
