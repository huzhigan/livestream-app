// https://nuxt.com/docs/api/configuration/nuxt-config
import { execSync } from 'node:child_process'

// 构建时生成版本标识:包版本 + git 短提交号(如 v0.1.0 (f6df8f5)),便于判断线上是哪个构建
function buildVersion() {
  const ver = process.env.npm_package_version || '0.0.0'
  try {
    const sha = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
    return `v${ver} (${sha})`
  } catch {
    return `v${ver}`
  }
}

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  devServer: { port: 3005 },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: `直播带货资料管理 ${buildVersion()}`,
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  }
})
