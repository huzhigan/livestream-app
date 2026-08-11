// GET /api/products/:id — 产品完整详情(含 htmlContent/structured,供详情弹窗按需加载)
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) {
    throw createError({ statusCode: 404, message: '产品不存在' })
  }
  return product
})
