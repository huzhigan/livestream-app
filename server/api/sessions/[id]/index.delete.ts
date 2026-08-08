// DELETE /api/sessions/:id — 删除场次（SessionProduct 级联删除）
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  const existing = await prisma.session.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, message: '场次不存在' })
  }

  await prisma.session.delete({ where: { id } })
  return { success: true }
})
