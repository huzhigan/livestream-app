// PUT /api/products/:id — 编辑产品
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await getBody(event)

  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, message: '产品不存在' })
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      brand: body.brand ?? existing.brand,
      spec: body.spec ?? existing.spec,
      category: body.category ?? existing.category,
      tags: body.tags ?? existing.tags,
      htmlContent: body.htmlContent ?? existing.htmlContent,
    }
  })

  return product
})
