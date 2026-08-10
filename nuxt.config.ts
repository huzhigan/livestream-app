// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  ssr: false, // 内部工具无SEO需求,关闭SSR改SPA,服务器不再每次请求渲染HTML,大幅提升访问速度
  devtools: { enabled: false },
  devServer: { port: 3005 },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: '直播带货资料管理',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  }
})
