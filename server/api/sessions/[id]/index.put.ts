// PUT /api/sessions/:id — 更新场次信息（名称、日期、平台、备注、状态）
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await getBody(event)

  const existing = await prisma.session.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, message: '场次不存在' })
  }

  const session = await prisma.session.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      date: body.date ?? existing.date,
      platform: body.platform ?? existing.platform,
      notes: body.notes ?? existing.notes,
      status: body.status ?? existing.status,
    }
  })

  return session
})
