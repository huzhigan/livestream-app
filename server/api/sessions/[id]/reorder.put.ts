// PUT /api/sessions/:id/reorder — 批量更新产品排序
export default defineEventHandler(async (event) => {
  const sessionId = Number(getRouterParam(event, 'id'))
  const body = await getBody(event)

  if (!body.order || !Array.isArray(body.order)) {
    throw createError({ statusCode: 400, message: '需要 order 数组 [{productId, sortOrder}]' })
  }

  const updates = body.order.map((item: { productId: number; sortOrder: number }) =>
    prisma.sessionProduct.update({
      where: { sessionId_productId: { sessionId, productId: item.productId } },
      data: { sortOrder: item.sortOrder }
    })
  )

  await Promise.all(updates)
  return { success: true }
})
