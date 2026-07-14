// PUT /api/sessions/:id/submission — 批量更新提报表数据
export default defineEventHandler(async (event) => {
  const sessionId = Number(getRouterParam(event, 'id'))
  const body = await getBody(event)

  if (!body.updates || !Array.isArray(body.updates)) {
    throw createError({ statusCode: 400, message: '需要 updates 数组 [{productId, submissionData}]' })
  }

  const session = await prisma.session.findUnique({ where: { id: sessionId } })
  if (!session) {
    throw createError({ statusCode: 404, message: '场次不存在' })
  }

  await Promise.all(
    body.updates.map((item: { productId: number; submissionData: object }) =>
      prisma.sessionProduct.updateMany({
        where: { sessionId, productId: item.productId },
        data: { submissionData: JSON.stringify(item.submissionData) }
      })
    )
  )

  return { success: true, updated: body.updates.length }
})
