/** 验证房间号，避免把页面中的无效值或 URL 当作 rid。 */
export function normalizeRoomId(roomId: string | number): string {
  const id = String(roomId);
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    throw new Error(`Invalid Douyu room ID: ${id}`);
  }
  return id;
}

/** 仅读取房间自身的元数据，不能误取推荐直播间或 routeParams 中的靓号。 */
export function roomIdFromHtml(html: string): string {
  const script = html.match(/<script\b(?=[^>]*\bid=["']vike_pageContext["'])[^>]*>([\s\S]*?)<\/script\s*>/i);
  if (script) {
    const context = JSON.parse(script[1]);
    return normalizeRoomId(context?.pageProps?.room?.roomInfo?.roomInfo?.rid);
  }
  // 兼容使用 $ROOM 注入房间信息的旧移动页。
  const legacy = html.match(/\$ROOM\.room_id\s*=\s*["']?([1-9]\d*)["']?\s*;/);
  if (legacy) return normalizeRoomId(legacy[1]);
  throw new Error('Douyu page does not contain a real room ID');
}

const CACHE_TTL = 10 * 60 * 1000;
const CACHE_LIMIT = 256;
const cache = new Map<string, { rid: string; expiresAt: number }>();

/** 从斗鱼移动页解析靓号；成功结果在进程内缓存 10 分钟，最多 256 项。 */
export async function resolveRoomId(roomId: string | number, signal?: AbortSignal): Promise<string> {
  const id = normalizeRoomId(roomId);
  if (signal?.aborted) throw new Error('Room lookup aborted');
  const cached = cache.get(id);
  if (cached && cached.expiresAt > Date.now()) {
    cache.delete(id);
    cache.set(id, cached);
    return cached.rid;
  }
  cache.delete(id);
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`https://m.douyu.com/${id}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`Douyu room lookup returned HTTP ${response.status}`);
    const rid = roomIdFromHtml(await response.text());
    if (controller.signal.aborted) throw new Error('Room lookup aborted or timed out');
    cache.delete(id);
    cache.set(id, { rid, expiresAt: Date.now() + CACHE_TTL });
    if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!);
    return rid;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Cannot resolve Douyu room ${id}: ${detail}`);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
