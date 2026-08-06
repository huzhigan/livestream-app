<template>
  <div>
    <nav class="nav">
      <NuxtLink to="/" class="nav-logo">📺 播控台</NuxtLink>
      <NuxtLink to="/" :class="{ active: route.path === '/' }">首页</NuxtLink>
      <NuxtLink to="/products" :class="{ active: route.path === '/products' }">产品库</NuxtLink>
      <NuxtLink to="/sessions" :class="{ active: route.path.startsWith('/sessions') }">直播场次</NuxtLink>
    </nav>
    <slot />
    <ToastContainer />
  </div>
</template>

<script setup>
const route = useRoute()
</script>

<style scoped>
.nav {
  background: var(--card);
  border-bottom: 1px solid var(--bdr);
  padding: 0 24px;
  display: flex;
  align-items: center;
  height: 56px;
  position: sticky;
  top: 0;
  z-index: 100;
}
.nav-logo {
  font-size: 18px;
  font-weight: 700;
  color: var(--pri);
  margin-right: 32px;
}
.nav a {
  color: var(--txt2);
  padding: 16px 12px;
  font-size: 14px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}
.nav a:hover,
.nav a.active {
  color: var(--pri);
  border-bottom-color: var(--pri);
}
</style>
