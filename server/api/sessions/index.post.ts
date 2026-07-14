// POST /api/sessions — 创建新场次

export default defineEventHandler(async (event) => {
  const body = await getBody(event)

  if (!body.name || !body.date || !body.platform) {
    throw createError({ statusCode: 400, message: '缺少必填字段: name, date, platform' })
  }

  const session = await prisma.session.create({
    data: {
      name: body.name,
      date: body.date,
      platform: body.platform,
      notes: body.notes || ''
    }
  })

  return session
})
