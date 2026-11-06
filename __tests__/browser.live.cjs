const { chromium } = require('playwright');
const assert = require('assert/strict');
const fs = require('fs');
const { resolve, join } = require('path');
const { tmpdir } = require('os');
const { test } = require('node:test');
const root = resolve(__dirname, '..');
const room = process.env.DOUYUDM_TEST_ROOM || '138243';
const bundle = join(root, 'dist/douyudm.browser.min.js');
const example = join(root, 'examples/browser/index.html');
test(
  'real browser: connect, record, reload, download, convert, delete',
  { timeout: 150000 },
  async (t) => {
    const artifacts = fs.mkdtempSync(join(tmpdir(), 'douyudm-browser-'));
    const browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH,
      headless: true,
      args: ['--no-sandbox'],
      proxy:
        process.env.HTTPS_PROXY || process.env.HTTP_PROXY
          ? { server: process.env.HTTPS_PROXY || process.env.HTTP_PROXY }
          : undefined,
    });
    const results = {
      browser: browser.version(),
      pageErrors: [],
      networkErrors: [],
      mobileRequests: [],
    };
    try {
      const page = await browser.newPage({ acceptDownloads: true });
      page.on('pageerror', (e) => results.pageErrors.push(e.message));
      page.on('request', (r) => {
        if (r.url().startsWith('https://m.douyu.com/')) results.mobileRequests.push(r.url());
      });
      page.on('response', (r) => {
        if (r.status() >= 400) results.networkErrors.push(`${r.status()} ${r.url()}`);
      });
      await page.route('https://unpkg.com/douyudm/dist/douyudm.browser.min.js', (r) =>
        r.fulfill({ path: bundle, contentType: 'application/javascript' }),
      );
      await page.route('https://douyudm.test/**', (r) =>
        r.fulfill({ path: example, contentType: 'text/html' }),
      );
      await page.goto('https://douyudm.test/', { waitUntil: 'networkidle', timeout: 45000 });
      await page.getByRole('button', { name: '连接', exact: true }).waitFor();
      results.pageLoads = true;
      await page.getByPlaceholder('输入房间号').fill(room);
      await page.getByRole('checkbox', { name: /录制弹幕/ }).check();
      await page.getByRole('button', { name: '连接', exact: true }).click();
      await page.getByText(`已连接到房间 ${room}`, { exact: true }).waitFor({ timeout: 20000 });
      results.liveConnected = true;
      let count = 0;
      for (const deadline = Date.now() + 60000; Date.now() < deadline; ) {
        count = await page.evaluate(
          () =>
            new Promise((resolve, reject) => {
              const q = indexedDB.open('douyudm-records');
              q.onsuccess = () => {
                const db = q.result;
                const r = db.transaction('messages').objectStore('messages').count();
                r.onsuccess = () => {
                  resolve(r.result);
                  db.close();
                };
                r.onerror = () => reject(r.error);
              };
            }),
        );
        if (count > 0) break;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      assert(count > 0, 'No chatmsg recorded from live room within 60 seconds');
      await page.getByRole('button', { name: '断开', exact: true }).click();
      await page.getByText('未连接', { exact: true }).waitFor();
      await page.getByText(/历史录制/).waitFor();
      results.recorded = true;
      await page.reload({ waitUntil: 'networkidle' });
      await page.getByText(/历史录制/).waitFor();
      results.persistedAfterReload = true;
      await page.locator('summary').click();
      const downloadEvent = page.waitForEvent('download');
      await page.getByRole('button', { name: '下载', exact: true }).click();
      const download = await downloadEvent;
      const recordPath = join(artifacts, 'record.jsonl');
      await download.saveAs(recordPath);
      const rows = fs.readFileSync(recordPath, 'utf8').trim().split('\n').map(JSON.parse);
      assert.equal(rows[0].rid, room);
      assert(rows.slice(1).every((r) => r.type === 'chatmsg'));
      assert(rows.length > 1);
      results.recordedChatMessages = rows.length - 1;
      results.downloadedJsonl = true;
      await page.getByRole('button', { name: /JSONL → ASS/ }).click();
      await page.locator('input[type=file]').setInputFiles(recordPath);
      const assDownload = page.waitForEvent('download');
      await page.getByRole('button', { name: '转换并下载 .ass', exact: true }).click();
      const ass = await assDownload;
      await ass.saveAs(join(artifacts, 'record.ass'));
      const text = fs.readFileSync(join(artifacts, 'record.ass'), 'utf8');
      assert.match(text, /\[Script Info\]/);
      assert(text.split('\n').filter((l) => l.startsWith('Dialogue:')).length > 0);
      results.convertedToAss = true;
      await page.screenshot({ path: join(artifacts, 'verified.png'), fullPage: true });
      await page.getByRole('button', { name: '删除', exact: true }).click();
      await page.getByText(/历史录制/).waitFor({ state: 'hidden' });
      results.deletedRecording = true;
      assert.equal(
        results.mobileRequests.length,
        0,
        'Browser default should not request mobile page',
      );
      assert.deepEqual(results.pageErrors, []);
      assert.deepEqual(results.networkErrors, []);
      await t.test('direct HTML file startup and conversion', async (fileTest) => {
        const filePage = await browser.newPage({ acceptDownloads: true });
        filePage.on('pageerror', (error) => results.pageErrors.push(error.message));
        await filePage.route('https://unpkg.com/douyudm/dist/douyudm.browser.min.js', (r) =>
          r.fulfill({ path: bundle, contentType: 'application/javascript' }),
        );
        try {
          await filePage.goto(require('url').pathToFileURL(example).href, {
            waitUntil: 'networkidle',
            timeout: 45000,
          });
        } catch (error) {
          if (!error.message.includes('ERR_BLOCKED_BY_ADMINISTRATOR')) throw error;
          results.fileModeBlockedByPolicy = true;
          fileTest.skip('Browser administrator policy blocks file:// navigation');
          await filePage.close();
          return;
        }
        await filePage.getByRole('button', { name: '连接', exact: true }).waitFor();
        results.filePageLoads = true;
        await filePage.getByRole('button', { name: /JSONL → ASS/ }).click();
        await filePage.locator('input[type=file]').setInputFiles(recordPath);
        const fileDownload = filePage.waitForEvent('download');
        await filePage.getByRole('button', { name: '转换并下载 .ass', exact: true }).click();
        await (await fileDownload).saveAs(join(artifacts, 'file-mode.ass'));
        assert.match(fs.readFileSync(join(artifacts, 'file-mode.ass'), 'utf8'), /Dialogue:/);
        results.fileModeConversion = true;
        assert.deepEqual(results.pageErrors, []);
        await filePage.close();
      });
      results.passed = true;
    } finally {
      console.log(JSON.stringify(results, null, 2));
      await browser.close();
      fs.rmSync(artifacts, { recursive: true, force: true });
    }
  },
);
