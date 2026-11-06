import type * as Room from '../src/core/room';

const page = (rid: unknown) => `<script type="application/json" id="vike_pageContext">${JSON.stringify({
  pageProps: { room: { roomInfo: { roomInfo: { rid } } } }, routeParams: { roomId: '6657' },
})}</script>`;

let room: typeof Room;
const originalFetch = global.fetch;
let fetchMock: jest.Mock;
beforeEach(() => {
  jest.resetModules();
  room = require('../src/core/room');
  fetchMock = jest.fn().mockResolvedValue({ ok: true, text: async () => page(6979222) });
  global.fetch = fetchMock;
});
afterEach(() => {
  global.fetch = originalFetch;
  jest.useRealTimers();
});

test('解析当前移动页的真实 rid，忽略 routeParams 靓号和推荐房间', () => {
  expect(room.roomIdFromHtml('"rid":123' + page(6979222))).toBe('6979222');
  expect(room.roomIdFromHtml("<script>$ROOM.room_id = '6979222';</script>")).toBe('6979222');
});

test.each(['<html>not found</html>', page(0), page('bad'), page(undefined),
  '<script id="vike_pageContext">broken json</script>'])('无效页面不静默回退：%s', html => {
  expect(() => room.roomIdFromHtml(html)).toThrow();
});

test.each([0, -1, NaN, Infinity, '6657/other', 'https://evil.test', '1.5', 9007199254740992])('拒绝无效房间号 %s', async id => {
  await expect(room.resolveRoomId(id)).rejects.toThrow('Invalid Douyu room ID');
  expect(fetchMock).not.toHaveBeenCalled();
});

test('成功查询缓存十分钟，同一个数字/字符串房间号复用', async () => {
  jest.useFakeTimers();
  expect(await room.resolveRoomId(6657)).toBe('6979222');
  expect(await room.resolveRoomId('6657')).toBe('6979222');
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0][0]).toBe('https://m.douyu.com/6657');
  jest.advanceTimersByTime(600_000);
  await room.resolveRoomId(6657);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('缓存有容量上限且命中会刷新最近使用顺序', async () => {
  for (let id = 1; id <= 256; id++) await room.resolveRoomId(id);
  await room.resolveRoomId(1);
  await room.resolveRoomId(257);
  await room.resolveRoomId(1);
  expect(fetchMock).toHaveBeenCalledTimes(257);
  await room.resolveRoomId(2);
  expect(fetchMock).toHaveBeenCalledTimes(258);
});

test('HTTP 错误和无效结果不缓存，修复后可重试', async () => {
  fetchMock.mockResolvedValueOnce({ ok: false, status: 503 });
  await expect(room.resolveRoomId(6657)).rejects.toThrow('HTTP 503');
  fetchMock.mockResolvedValueOnce({ ok: true, text: async () => '<html>not found</html>' });
  await expect(room.resolveRoomId(6657)).rejects.toThrow('real room ID');
  await expect(room.resolveRoomId(6657)).resolves.toBe('6979222');
  expect(fetchMock).toHaveBeenCalledTimes(3);
});

test('调用者中止会传递给 fetch，取消结果不缓存', async () => {
  const controller = new AbortController();
  fetchMock.mockImplementationOnce((_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('aborted')));
  }));
  const result = room.resolveRoomId(6657, controller.signal);
  controller.abort();
  await expect(result).rejects.toThrow('aborted');
  await expect(room.resolveRoomId(6657)).resolves.toBe('6979222');
});

test('中止的 signal 不读取缓存也不发送请求', async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(room.resolveRoomId(6657, controller.signal)).rejects.toThrow('aborted');
  expect(fetchMock).not.toHaveBeenCalled();
});

test('十秒超时后清理请求和计时器', async () => {
  jest.useFakeTimers();
  fetchMock.mockImplementationOnce((_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('timeout')));
  }));
  const result = expect(room.resolveRoomId(6657)).rejects.toThrow('timeout');
  await jest.advanceTimersByTimeAsync(10_000);
  await result;
  expect(jest.getTimerCount()).toBe(0);
});
