// DELETE /api/sessions/:id/products/:productId — 从场次中移除产品
export default defineEventHandler(async (event) => {
  const sessionId = Number(getRouterParam(event, 'id'))
  const productId = Number(getRouterParam(event, 'productId'))

  const existing = await prisma.sessionProduct.findUnique({
    where: { sessionId_productId: { sessionId, productId } }
  })
  if (!existing) {
    throw createError({ statusCode: 404, message: '该产品不在此场次中' })
  }

  await prisma.sessionProduct.delete({
    where: { sessionId_productId: { sessionId, productId } }
  })

  return { success: true }
})
