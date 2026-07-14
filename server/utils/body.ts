// server/utils/body.ts — 兼容 H3 v2 的请求体读取工具
export async function getBody(event: any): Promise<any> {
  const raw = await new Promise<string>((resolve, reject) => {
    let data = ''
    event.node.req.on('data', (chunk: any) => data += chunk)
    event.node.req.on('end', () => resolve(data))
    event.node.req.on('error', reject)
  })
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}
