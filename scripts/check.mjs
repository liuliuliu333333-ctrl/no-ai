import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const data = JSON.parse(read('data/accounts.json'));
const removed = JSON.parse(read('data/removed.json'));
const uidPattern = /^[a-f0-9]{24}$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
function date(value) {
  assert.equal(typeof value, 'string');
  assert.match(value, datePattern);
  assert.equal(new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10), value);
}
function cleanURL(value, host) {
  const u = new URL(value);
  assert.equal(u.protocol, 'https:');
  assert.equal(u.hostname, host);
  assert(!u.username && !u.password && !u.port && !u.search && !u.hash, '链接不能带凭证、查询参数或片段');
  return u;
}
assert.equal(data.schema_version, 1);
assert.equal(data.platform, 'xiaohongshu');
date(data.updated_at);
assert(Array.isArray(data.accounts));
assert.equal(removed.schema_version, 1);
assert(Array.isArray(removed.removed));
const seen = new Set();
for (const a of data.accounts) {
  assert.match(a.uid, uidPattern);
  assert(!seen.has(a.uid), `重复 UID：${a.uid}`);
  seen.add(a.uid);
  assert.equal(cleanURL(a.profile_url, 'www.xiaohongshu.com').pathname, `/user/profile/${a.uid}`);
  assert.equal(a.status, 'reviewed');
  for (const key of ['name', 'category', 'reason', 'counterevidence', 'reviewer']) {
    assert.equal(typeof a[key], 'string', `缺少 ${key}`);
    assert(a[key].trim(), `${key} 不能为空`);
  }
  date(a.reviewed_at);
  assert(a.reviewed_at <= data.updated_at);
  const issue = cleanURL(a.review_issue, 'github.com');
  assert.match(issue.pathname, /^\/[^/]+\/[^/]+\/issues\/\d+$/);
  assert(Array.isArray(a.evidence) && a.evidence.length >= 2);
  const evidenceIDs = new Set();
  for (const e of a.evidence) {
    const u = cleanURL(e.url, 'www.xiaohongshu.com');
    const match = /^\/(?:explore|discovery\/item)\/([a-f0-9]{24})$/.exec(u.pathname);
    assert(match, '证据必须是干净的官方笔记链接');
    evidenceIDs.add(match[1]);
    date(e.observed_at);
    assert(e.observed_at <= a.reviewed_at);
    assert.equal(typeof e.observation, 'string');
    assert(e.observation.trim());
  }
  assert(evidenceIDs.size >= 2, '需两条不同笔记，不能用不同路径重复同一笔记');
}
for (const r of removed.removed) {
  assert.match(r.uid, uidPattern);
  assert(!seen.has(r.uid), '移出账号不得仍在执行名单中');
  date(r.removed_at);
  assert(typeof r.reason === 'string' && r.reason.trim());
}
const expected = data.accounts.map(a => a.uid).join('\n') + (data.accounts.length ? '\n' : '');
assert.equal(read('data/user-ids.txt'), expected, 'UID 导出必须与正式名单完全一致');
for (const file of ['README.md','AGENTS.md','CONTRIBUTING.md','docs/blocking-workflow.md','docs/verification.md','docs/methodology.md']) {
  assert(read(file).trim(), `缺少文档：${file}`);
}
console.log(`通过：数据结构、干净链接、证据去重、日期、移出状态及 UID 导出。正式名单 ${seen.size} 个。事实仍须人工复核。`);
