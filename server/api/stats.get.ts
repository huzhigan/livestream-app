// GET /api/stats — 首页统计(轻量,避免首页拉全量产品列表)
export default defineEventHandler(async () => {
  const [productCount, sessionCount] = await Promise.all([
    prisma.product.count(),
    prisma.session.count(),
  ])
  return { productCount, sessionCount }
})
