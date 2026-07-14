<template>
  <div class="wrap">
    <div class="breadcrumb">
      <NuxtLink to="/sessions">直播场次</NuxtLink> / 场次详情
    </div>
    <p style="color: var(--txt2); font-size: 14px;">Phase 0 骨架搭建中 — 后续将在此显示场次头部 + 产品列表 + 直播模式</p>
    <p style="color: var(--txt2); font-size: 13px; margin-top: 8px;">场次 ID: {{ $route.params.id }}</p>
  </div>
</template>

<style scoped>
.breadcrumb {
  font-size: 13px;
  color: var(--txt2);
  margin-bottom: 16px;
}
.breadcrumb a {
  color: var(--pri);
}
</style>
