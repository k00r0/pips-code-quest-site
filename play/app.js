// ===== APP =====
(() => {
'use strict';

// ---------- config ----------
const TRACKS = {
  hatch:    { name: 'Hatchling', emoji: '🥚', ages: '5–7',  goal: 20, note: 'Big buttons, read-aloud, and code built from tap-blocks. No typing needed.' },
  explorer: { name: 'Explorer',  emoji: '🧭', ages: '8–11', goal: 30, note: 'Tap-blocks plus real typing, with starter code and hints after a slip.' },
  coder:    { name: 'Coder',     emoji: '💻', ages: '12–15', goal: 50, note: 'Full typing challenges, and you can test out of units you already know.' },
};
const trackFor = age => age <= 7 ? 'hatch' : age <= 11 ? 'explorer' : 'coder';
const AVATARS = ['🦊', '🐼', '🐯', '🦄', '🐸', '🐙', '🦖', '🐝'];
const BADGES = [
  { id: 'first',    em: '🐣', name: 'First steps',   desc: 'Finish your first lesson' },
  { id: 'perfect',  em: '💯', name: 'Flawless',      desc: 'A lesson with zero slips' },
  { id: 'streak3',  em: '🔥', name: 'On fire',       desc: '3-day streak' },
  { id: 'streak7',  em: '🌟', name: 'Week warrior',  desc: '7-day streak' },
  { id: 'xp100',    em: '⭐', name: 'Star collector', desc: 'Earn 100 XP' },
  { id: 'xp500',    em: '🏆', name: 'Super star',    desc: 'Earn 500 XP' },
  { id: 'boss',     em: '👑', name: 'Boss beater',   desc: 'Win a unit challenge' },
  { id: 'bugs',     em: '🐞', name: 'Bug hunter',    desc: 'Squash 5 bugs' },
  { id: 'coder',    em: '⌨️', name: 'Real coder',    desc: 'Pass 5 typing challenges' },
  { id: 'play',     em: '🧪', name: 'Tinkerer',      desc: 'Run code in the Playground' },
  { id: 'practice', em: '💪', name: 'Practice pro',  desc: 'Finish 3 practice rounds' },
  { id: 'loops',    em: '🔁', name: 'Loop de loop',  desc: 'Finish the Loops unit' },
  { id: 'jump',     em: '🚀', name: 'Rocket jump',   desc: 'Test out of a unit' },
  { id: 'all',      em: '🐍', name: 'Python pal',    desc: 'Finish the whole path' },
];
const KEY = 'pips-code-quest.v1';
// window.Native comes from native.js (iOS bridge). If it's missing (plain browser file), use harmless stand-ins.
const NATIVE = window.Native || (() => { const no = async () => null; return {
  isNative: false, config: { iap: { fallbackPrice: '$2.99' } },
  storage: { get: async k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: async (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } },
  haptic: { tap: no, ok: no, bad: no }, ads: { show: no, hide: no, remove: no, init: no, onHeight: () => {} },
  iap: { available: false, price: async () => '$2.99', buy: async () => 'bought', owned: no, restore: no },
  reminders: { permission: async () => false, schedule: no, cancel: no }, shell: { ready: no } }; })();

// ---------- path ----------
const PATH = [];
UNITS.forEach((u, ui) => {
  u.lessons.forEach((l, li) => PATH.push({ id: l.id, kind: 'lesson', unit: u, ui, lesson: l, num: li + 1 }));
  PATH.push({ id: u.id + '-boss', kind: 'boss', unit: u, ui });
});
const EX_INDEX = {};
UNITS.forEach(u => u.lessons.forEach(l => l.ex.forEach((e, i) => { e.key = l.id + ':' + i; e.unit = u.id; EX_INDEX[e.key] = e; })));

// ---------- state ----------
const fresh = () => ({ onboarded: false, name: '', avatar: '🦊', age: 8, track: 'explorer', xp: 0, xpToday: 0, xpDay: '',
  streak: 0, best: 0, lastDay: '', shields: 0, done: {}, stats: {}, badges: {},
  count: { lessons: 0, bugs: 0, codes: 0, practice: 0 }, settings: { sound: true, voice: null }, adFree: false });
let S;
async function load() {
  try { const raw = await NATIVE.storage.get(KEY); S = raw ? Object.assign(fresh(), JSON.parse(raw)) : fresh(); }
  catch (e) { S = fresh(); }
  S.settings = Object.assign({ sound: true, voice: null, remind: true }, S.settings);
}
function save() { NATIVE.storage.set(KEY, JSON.stringify(S)); }

// ---------- dates & streak ----------
const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const today = () => ymd(new Date());
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return ymd(d); };
const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 86400000);
function checkStreakOnOpen() {
  if (!S.lastDay || S.lastDay === today() || S.lastDay === yesterday()) return;
  const gap = daysBetween(S.lastDay, today());
  if (gap === 2 && S.shields > 0) { S.shields--; S.lastDay = yesterday(); save(); setTimeout(() => toast('🛡️ A streak shield saved your streak!'), 600); }
  else { S.streak = 0; save(); }
}
function touchStreak() {
  const t = today();
  if (S.lastDay === t) return false;
  S.streak = S.lastDay === yesterday() ? S.streak + 1 : 1;
  S.lastDay = t; S.best = Math.max(S.best, S.streak);
  if (S.streak % 7 === 0 && S.shields < 2) S.shields++;
  return true;
}
function addXP(n) {
  if (S.xpDay !== today()) { S.xpDay = today(); S.xpToday = 0; }
  S.xp += n; S.xpToday += n;
}
const xpToday = () => S.xpDay === today() ? S.xpToday : 0;
const voiceOn = () => S.settings.voice === null ? S.track === 'hatch' : S.settings.voice;

// ---------- helpers ----------
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const isDone = id => !!S.done[id];
const nodeIndex = id => PATH.findIndex(n => n.id === id);
const unlocked = i => i === 0 || isDone(PATH[i - 1].id);
const currentIndex = () => { const i = PATH.findIndex(n => !isDone(n.id)); return i; };

function hl(src) { // tiny Python highlighter
  const KW = /\b(def|return|if|elif|else|for|while|in|and|or|not|True|False|None|import|from|class|break|continue|pass)\b/;
  const re = /("[^"\n]*"?|'[^'\n]*'?|#[^\n]*|\b\d+(?:\.\d+)?\b|\b[A-Za-z_]\w*(?=\()|\b[A-Za-z_]\w*\b)/g;
  return esc(src).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(re, m => {
    if (m[0] === '"' || m[0] === "'") return '<span class="st">' + m + '</span>';
    if (m[0] === '#') return '<span class="cm">' + m + '</span>';
    if (/^\d/.test(m)) return '<span class="nu">' + m + '</span>';
    if (KW.test(m) && new RegExp('^' + KW.source + '$').test(m)) return '<span class="kw">' + m + '</span>';
    return m;
  }).replace(/\b(print|len|range|max|min|sum|upper|append|input|str|int)(?=\()/g, '<span class="fn">$1</span>');
}
const looksCode = s => /[()"'=\[\]*+%]|^\d+(\.\d+)?$|\n/.test(s) && !/^[A-Z][a-z]+ [a-z]/.test(s);

// ---------- Pip the mascot ----------
function pip(mood = 'happy', cls = '') {
  const mouth = mood === 'sad' ? '<path d="M64 46 Q72 40 80 46" stroke="#1d2b53" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
    : mood === 'wow' ? '<ellipse cx="72" cy="45" rx="5" ry="6" fill="#1d2b53"/><ellipse cx="72" cy="47" rx="3" ry="2.6" fill="#ff7a8a"/>'
    : '<path d="M62 41 Q72 52 82 41" stroke="#1d2b53" stroke-width="3.5" fill="#fff" stroke-linecap="round"/>';
  const lid = mood === 'sad' ? '<path d="M53 22 L67 26 M91 22 L77 26" stroke="#1d2b53" stroke-width="3" stroke-linecap="round"/>' : '';
  return `<svg class="${cls}" viewBox="0 0 120 120" role="img" aria-label="Pip the snake">
    <path d="M18 108 C10 84 52 92 58 76 C64 60 30 58 40 44" stroke="#1f4fb0" stroke-width="22" fill="none" stroke-linecap="round" transform="translate(0 3)"/>
    <path d="M18 108 C10 84 52 92 58 76 C64 60 30 58 40 44" stroke="#2f6fe4" stroke-width="22" fill="none" stroke-linecap="round"/>
    <path d="M18 108 C10 84 52 92 58 76 C64 60 30 58 40 44" stroke="#ffcf3a" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="2 11"/>
    <ellipse cx="72" cy="34" rx="30" ry="24" fill="#2f6fe4"/>
    <ellipse cx="72" cy="44" rx="20" ry="11" fill="#ffcf3a"/>
    <circle cx="60" cy="28" r="9" fill="#fff"/><circle cx="84" cy="28" r="9" fill="#fff"/>
    <circle cx="62" cy="29" r="4.6" fill="#1d2b53"/><circle cx="86" cy="29" r="4.6" fill="#1d2b53"/>
    <circle cx="63.5" cy="27" r="1.6" fill="#fff"/><circle cx="87.5" cy="27" r="1.6" fill="#fff"/>
    ${lid}${mouth}
    <circle cx="49" cy="40" r="4" fill="#ff8fb1" opacity=".55"/><circle cx="95" cy="40" r="4" fill="#ff8fb1" opacity=".55"/>
  </svg>`;
}

// ---------- sound, voice, confetti, toast ----------
let actx;
function tone(notes) {
  if (!S.settings.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    notes.forEach(([f, t, d]) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'triangle'; o.frequency.value = f; o.connect(g); g.connect(actx.destination);
      const s = actx.currentTime + t; g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.18, s + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, s + d);
      o.start(s); o.stop(s + d + 0.05);
    });
  } catch (e) {}
}
const sfx = { ok: () => { NATIVE.haptic.ok(); tone([[660, 0, .12], [990, .1, .2]]); }, bad: () => { NATIVE.haptic.bad(); tone([[260, 0, .18], [200, .14, .25]]); },
  win: () => { NATIVE.haptic.ok(); tone([[523, 0, .15], [659, .13, .15], [784, .26, .15], [1047, .4, .35]]); }, tap: () => { NATIVE.haptic.tap(); tone([[520, 0, .05]]); } };
function say(text) {
  try {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text).replace(/[_*#()\[\]{}"]/g, ' ').replace(/\s+/g, ' '));
    u.rate = 0.92; u.pitch = 1.15; speechSynthesis.speak(u);
  } catch (e) {}
}
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas'); c.id = 'confetti'; document.body.appendChild(c);
  const x = c.getContext('2d'); const W = c.width = innerWidth, H = c.height = innerHeight;
  const cols = ['#2f6fe4', '#ffcf3a', '#1fb36f', '#ff5f57', '#d94a8c', '#0f9fb0'];
  const P = Array.from({ length: 140 }, () => ({ x: W / 2 + (Math.random() - .5) * 80, y: H * .35, vx: (Math.random() - .5) * 13, vy: -Math.random() * 13 - 4, r: Math.random() * 6 + 4, c: cols[Math.random() * 6 | 0], a: Math.random() * 6 }));
  let f = 0; (function step() {
    x.clearRect(0, 0, W, H);
    P.forEach(p => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.a += .2; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); });
    if (++f < 150) requestAnimationFrame(step); else c.remove();
  })();
}

// ---------- Python engine (Skulpt, runs entirely in the browser) ----------
let engine = 'loading';
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
const SK = 'vendor/skulpt/';
loadScript(SK + 'skulpt.min.js').then(() => loadScript(SK + 'skulpt-stdlib.js')).then(() => { engine = 'ready'; }).catch(() => { engine = 'failed'; });
async function waitEngine() { for (let i = 0; i < 80 && engine === 'loading'; i++) await new Promise(r => setTimeout(r, 100)); return engine === 'ready'; }
async function runPython(src) {
  if (!(await waitEngine())) return { ok: false, out: '', err: 'The Python engine couldn\'t load. Check your internet connection and try again.' };
  let out = '';
  Sk.configure({
    output: t => { out += t; }, __future__: Sk.python3, execLimit: 4000,
    read: f => { if (!Sk.builtinFiles || !Sk.builtinFiles.files[f]) throw 'File not found: ' + f; return Sk.builtinFiles.files[f]; },
    inputfun: p => { try { return window.prompt(p) || ''; } catch (e) { return ''; } }, inputfunTakesPrompt: true,
  });
  try { await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody('<stdin>', false, src, true)); return { ok: true, out }; }
  catch (e) { return { ok: false, out, err: friendlyError(String(e), src) }; }
}
function friendlyError(raw, src) {
  const lineM = raw.match(/on line (\d+)/); const ln = lineM ? +lineM[1] : 0;
  const lines = src.split('\n'); const L = (lines[ln - 1] || '').trim(); const prev = (lines[ln - 2] || '').trimEnd();
  const at = ln ? ` (line ${ln})` : '';
  let m;
  if ((m = raw.match(/NameError: name '(\w+)'/))) return `Python doesn't know anything called "${m[1]}"${at}. Check the spelling, or if it's a word, put quotes around it.`;
  if (/TimeLimitError/.test(raw)) return 'Your code ran for too long. A loop might never stop. Make sure something changes so the loop can end.';
  if (/IndexError/.test(raw)) return `That list position doesn't exist${at}. Remember: counting starts at 0.`;
  if (/TypeError.*concatenate|TypeError.*must be str/.test(raw)) return `You can't glue text and a number with +${at}. Try str(number) or an f-string.`;
  if (/ZeroDivisionError/.test(raw)) return `Dividing by zero isn't allowed${at}. Not even Python can do that!`;
  if (/SyntaxError|IndentationError|ParseError/.test(raw)) {
    if (/^(if|elif|else|for|while|def)\b/.test(L) && !L.endsWith(':')) return `This line needs a colon : at the end${at}.`;
    if ((L.match(/"/g) || []).length % 2 || (L.match(/'/g) || []).length % 2) return `A quote is missing${at}. Quotes come in pairs: "like this".`;
    const open = (L.match(/[(\[]/g) || []).length, close = (L.match(/[)\]]/g) || []).length;
    if (open !== close) return `Your brackets don't match${at}. Every ( needs a ).`;
    if (prev.endsWith(':') && !/^\s/.test(lines[ln - 1] || '')) return `The line after a colon needs 4 spaces in front${at}.`;
    return `Python couldn't understand this${at}. Check for missing colons, quotes, or brackets.`;
  }
  return raw.replace(/ on line \d+/, at);
}

// ---------- adapting exercises to the learner ----------
function tokenize(line) { return line.match(/"[^"]*"|'[^']*'|\d+(?:\.\d+)?|\w+|==|!=|<=|>=|\*\*|\/\/|\S/g) || []; }
function adapt(e) {
  if (e.t === 'code' && S.track === 'hatch') {
    const lines = e.solution.trim().split('\n');
    if (lines.length !== 1) return null; // multi-line typing is too much for little ones
    const toks = tokenize(lines[0]);
    const pool = ['"', 'x', '+', '(', 'print', '5'].filter(p => !toks.includes(p)).slice(0, 2);
    return Object.assign({}, e, { t: 'blocks', tokens: toks, extra: pool, hint: e.hint });
  }
  return e;
}
function prepare(list) { return list.map(adapt).filter(Boolean); }

// ---------- navigation ----------
let view = { name: 'home' };
let L = null; // active lesson session
let modal = null;
function go(name, extra = {}) { view = Object.assign({ name }, extra); render(); window.scrollTo(0, 0); }

// ---------- sessions ----------
function startNode(i) {
  const n = PATH[i];
  if (n.kind === 'lesson') startSession({ kind: 'lesson', nodeId: n.id, title: n.lesson.title, unit: n.unit, items: prepare(n.lesson.ex) });
  else {
    const pool = shuffle(n.unit.lessons.flatMap(l => l.ex).filter(e => e.t !== 'learn'));
    startSession({ kind: 'boss', nodeId: n.id, title: n.unit.title + ' challenge', unit: n.unit, items: prepare(pool).slice(0, 7) });
  }
}
function startPractice() {
  const doneEx = UNITS.flatMap(u => u.lessons.filter(l => isDone(l.id)).flatMap(l => l.ex)).filter(e => e.t !== 'learn');
  const now = Date.now();
  const weighted = doneEx.map(e => { const s = S.stats[e.key] || { r: 0, w: 0, t: 0 };
    const age = s.t ? (now - s.t) / 86400000 : 3; return { e, w: Math.max(.3, 1 + s.w * 2 - s.r * .4 + Math.min(age, 7) * .4) * Math.random() }; });
  weighted.sort((a, b) => b.w - a.w);
  startSession({ kind: 'practice', title: 'Practice', items: prepare(weighted.map(x => x.e)).slice(0, 8) });
}
function startJump(ui) {
  const firstOpen = PATH.findIndex(n => !isDone(n.id));
  const targetStart = PATH.findIndex(n => n.ui === ui);
  const skip = PATH.slice(firstOpen, targetStart);
  const units = [...new Set(skip.map(n => n.unit))];
  const pool = shuffle(units.flatMap(u => u.lessons.flatMap(l => l.ex)).filter(e => e.t !== 'learn'));
  startSession({ kind: 'jump', title: 'Jump to ' + UNITS[ui].title, items: prepare(pool).slice(0, 8), skip: skip.map(n => n.id), unitIndex: ui });
}
function startSession(o) {
  L = Object.assign({ idx: 0, queue: o.items.slice(), total: o.items.length, solved: 0, mistakes: 0, firstTry: 0, requeued: new Set(), cur: null, started: Date.now() }, o);
  newCur(); go('lesson');
}
function newCur() {
  const e = L.queue[L.idx]; if (!e) return;
  L.cur = { sel: null, picked: [], code: e.t === 'code' ? (e.start || '') : '', status: null, out: '', err: '', slipped: false, bank: e.t === 'blocks' ? shuffle(e.tokens.concat(e.extra || []).map((t, i) => ({ t, i }))) : null };
  if (voiceOn()) setTimeout(() => say(e.t === 'learn' ? e.title + '. ' + e.text : e.q), 250);
}
function record(e, ok) {
  if (!e.key) return;
  const s = S.stats[e.key] || { r: 0, w: 0, t: 0 }; ok ? s.r++ : s.w++; s.t = Date.now(); S.stats[e.key] = s;
}
async function check() {
  const e = L.queue[L.idx], c = L.cur;
  let ok = false;
  if (e.t === 'mc' || e.t === 'predict' || e.t === 'fill' || e.t === 'bug') ok = c.sel === e.a;
  else if (e.t === 'blocks') ok = c.picked.map(p => p.t).join('\u0001') === e.tokens.join('\u0001');
  else if (e.t === 'code') {
    c.status = 'running'; render();
    const r = await runPython(c.code);
    const norm = s => s.replace(/\r/g, '').split('\n').map(x => x.trimEnd()).join('\n').trim();
    c.out = r.out; c.err = r.ok ? '' : r.err;
    const hasMust = e.must.every(m => c.code.includes(m)) && (!e.mustAny.length || e.mustAny.some(m => c.code.includes(m)));
    ok = r.ok && norm(r.out) === norm(e.expect) && hasMust;
    if (r.ok && norm(r.out) === norm(e.expect) && !hasMust) c.err = 'Right answer! But this challenge wants you to use ' + (e.must.length ? e.must.join(' and ') : e.mustAny.join(' or ')) + ' in your code.';
    else if (r.ok && !ok) c.err = 'Your code ran, but showed something different from what we need.';
  }
  c.status = ok ? 'ok' : 'bad';
  if (ok) { sfx.ok(); if (!c.slipped && !L.requeued.has(e)) L.firstTry++; }
  else { sfx.bad(); if (!c.slipped) { L.mistakes++; c.slipped = true; } }
  record(e, ok);
  if (ok && e.t === 'bug') S.count.bugs++;
  if (ok && e.t === 'code') S.count.codes++;
  render();
}
function next() {
  const e = L.queue[L.idx], c = L.cur;
  if (e.t === 'learn' || c.status === 'ok') L.solved++;
  else if (c.status === 'bad' && L.kind !== 'jump' && !L.requeued.has(e)) { L.requeued.add(e); L.queue.push(e); }
  else if (c.status === 'bad') L.solved++; // second miss: move on, don't loop forever
  L.idx++;
  if (L.idx >= L.queue.length) return finish();
  newCur(); render(); window.scrollTo(0, 0);
}
function finish() {
  const graded = L.queue.filter((e, i, a) => e.t !== 'learn' && a.indexOf(e) === i).length || 1;
  const acc = Math.round(100 * L.firstTry / graded);
  const stars = L.mistakes === 0 ? 3 : L.mistakes <= 2 ? 2 : 1;
  let xp = 0, passed = true; const before = new Set(Object.keys(S.badges));
  if (L.kind === 'lesson') { xp = 10 + (L.mistakes === 0 ? 5 : 0); S.done[L.nodeId] = { stars: Math.max(stars, (S.done[L.nodeId] || {}).stars || 0) }; S.count.lessons++; }
  if (L.kind === 'boss') { xp = 20; S.done[L.nodeId] = { stars: Math.max(stars, (S.done[L.nodeId] || {}).stars || 0) }; S.badges.boss = S.badges.boss || Date.now(); }
  if (L.kind === 'practice') { xp = 8; S.count.practice++; }
  if (L.kind === 'jump') {
    passed = acc >= 75;
    if (passed) { xp = 15; L.skip.forEach(id => { if (!S.done[id]) S.done[id] = { stars: 1 }; }); S.badges.jump = S.badges.jump || Date.now(); }
  }
  const streakUp = xp > 0 ? touchStreak() : false;
  addXP(xp);
  if (L.kind !== 'jump' && L.mistakes === 0 && L.kind !== 'practice') S.badges.perfect = S.badges.perfect || Date.now();
  awardBadges(); save();
  const newBadges = BADGES.filter(b => S.badges[b.id] && !before.has(b.id));
  const result = { kind: L.kind, title: L.title, xp, acc, stars, passed, streakUp, fresh: newBadges, secs: Math.round((Date.now() - L.started) / 1000) };
  L = null; go('done', { result });
  afterLessonReminders();
  if (passed) { sfx.win(); confetti(); if (voiceOn()) say(result.kind === 'jump' ? 'You jumped ahead!' : 'Great job! Lesson complete!'); }
}
function awardBadges() {
  const give = id => { S.badges[id] = S.badges[id] || Date.now(); };
  if (S.count.lessons >= 1) give('first');
  if (S.streak >= 3) give('streak3'); if (S.streak >= 7) give('streak7');
  if (S.xp >= 100) give('xp100'); if (S.xp >= 500) give('xp500');
  if (S.count.bugs >= 5) give('bugs'); if (S.count.codes >= 5) give('coder');
  if (S.count.practice >= 3) give('practice');
  if (PATH.filter(n => n.ui === 5).every(n => isDone(n.id))) give('loops');
  if (PATH.every(n => isDone(n.id))) give('all');
}

// ---------- parental gate (Apple Kids Category requires one before purchases & settings) ----------
function gate(onPass, why) {
  const a = 6 + Math.floor(Math.random() * 7), b = 12 + Math.floor(Math.random() * 8);
  modal = { type: 'gate', a, b, onPass, why }; render();
  setTimeout(() => { const i = $('#gate-in'); if (i) i.focus(); }, 50);
}

// ---------- render ----------
function render() {
  document.body.className = S.track === 'hatch' ? 'hatch' : '';
  const app = $('#app');
  let html = '';
  if (!S.onboarded) html = vOnboard();
  else if (view.name === 'lesson' && L) html = vLesson();
  else if (view.name === 'done') html = vDone();
  else {
    html = vTop() + '<main class="screen">' + ({ home: vHome, practice: vPractice, play: vPlay, badges: vBadges, parents: vParents }[view.name] || vHome)() + '</main>' + vNav();
  }
  if (modal) html += vModal();
  app.innerHTML = html;
  after();
  syncAds();
}
// Real banner shows only on the main tabs: never during lessons, celebrations, sign-up or grown-up checks.
function syncAds() {
  const mainTab = S.onboarded && !L && !modal && !purchasing && ['home', 'practice', 'play', 'badges', 'parents'].includes(view.name);
  if (mainTab && !S.adFree) NATIVE.ads.show(); else NATIVE.ads.hide();
}
NATIVE.ads.onHeight = h => document.documentElement.style.setProperty('--ad-h', (h ? h + 8 : 0) + 'px');
let priceLabel = NATIVE.config.iap.fallbackPrice;
let purchasing = false;
async function afterLessonReminders() {
  if (!NATIVE.isNative || S.settings.remind === false) return;
  if (!S.askedRemind && S.count.lessons >= 1) {
    S.askedRemind = true; save();
    await new Promise(r => setTimeout(r, 1800)); // let the celebration land first
    const ok = await NATIVE.reminders.permission(true);
    if (!ok) { S.settings.remind = false; save(); }
  }
  scheduleReminders();
}
function scheduleReminders() {
  if (S.settings.remind === false) { NATIVE.reminders.cancel(); return; }
  NATIVE.reminders.schedule({ name: S.name, streak: S.streak, practicedToday: S.lastDay === today() });
}
function vTop() {
  return `<header class="topbar">
    <span class="avatar" aria-hidden="true">${S.avatar}</span>
    <span class="chip" title="Learning track">${TRACKS[S.track].emoji} ${TRACKS[S.track].name}</span>
    <span class="spacer"></span>
    <span class="chip fire" title="Day streak">🔥 ${S.streak}</span>
    ${S.shields ? `<span class="chip" title="Streak shields">🛡️ ${S.shields}</span>` : ''}
    <span class="chip star" title="Total XP">⭐ ${S.xp}</span>
  </header>`;
}
function vNav() {
  const tabs = [['home', '🏝️', 'Learn'], ['practice', '💪', 'Practice'], ['play', '🧪', 'Playground'], ['badges', '🏅', 'Badges'], ['parents', '👪', 'Grown-ups']];
  const ad = true ? '' : `<div class="ad" role="complementary" aria-label="Advertisement"><b>Ad</b><span>Kid-safe banner slot · 320×50</span><button data-act="remove-ads">Remove ads</button></div>`;
  return `<nav class="nav">${ad}<div class="nav-in">${tabs.map(([k, e, t]) => `<button class="${view.name === k ? 'on' : ''}" data-go="${k}" aria-label="${t}"><b>${e}</b>${t}</button>`).join('')}</div></nav>`;
}

function vHome() {
  const goal = TRACKS[S.track].goal, got = xpToday(), pct = Math.min(1, got / goal), C = 2 * Math.PI * 27;
  const cur = currentIndex();
  const greet = cur === -1 ? 'You finished the whole path!' : cur === 0 ? 'Ready for your first lesson?' : got >= goal ? 'Daily goal done. Amazing!' : 'Let\'s keep growing!';
  return `<section class="hello">
      <div style="flex:1"><h1>Hi${S.name ? ', ' + esc(S.name) : ''}!</h1><p class="muted" style="margin:4px 0 0">${greet}</p></div>
      <div class="goal" title="Daily goal: ${got} of ${goal} XP">
        <svg width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" stroke="var(--line)" stroke-width="7" fill="none"/>
        <circle cx="32" cy="32" r="27" stroke="var(--sun)" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/></svg>
        <span>${got}/${goal}<br>XP</span></div>
    </section>${vPath()}`;
}
function vPath() {
  const COLW = 300, AMP = 78, cx = COLW / 2;
  const cur = currentIndex();
  let y = 0, pts = [], parts = [], k = 0;
  UNITS.forEach((u, ui) => {
    const nodes = PATH.map((n, i) => ({ n, i })).filter(x => x.n.ui === ui);
    const allLocked = nodes.every(x => !unlocked(x.i));
    const canJump = allLocked && S.track !== 'hatch';
    parts.push(`<div class="unit-banner" style="top:${y}px;background:${u.color}"><span class="em">${u.emoji}</span><div><h2>Unit ${ui + 1}: ${esc(u.title)}</h2><p>${esc(u.desc)}</p></div>${canJump ? `<button class="jump" data-jump="${ui}">Jump here 🚀</button>` : ''}</div>`);
    y += 118;
    nodes.forEach(({ n, i }) => {
      const x = cx + Math.sin(k * 0.95) * AMP; k++; const ny = y + 44;
      pts.push({ x, y: ny, i });
      const done = isDone(n.id), open = unlocked(i), isCur = i === cur;
      const bg = done || open ? `background:${u.color};box-shadow:0 6px 0 color-mix(in srgb,${u.color} 70%,#000)` : '';
      const icon = n.kind === 'boss' ? '👑' : done ? '✓' : open ? '★' : '🔒';
      const label = n.kind === 'boss' ? `${u.title} challenge` : `Lesson: ${n.lesson.title}`;
      const stars = done ? `<span class="stars">${'⭐'.repeat(S.done[n.id].stars)}</span>` : '';
      parts.push(`<button class="node ${n.kind === 'boss' ? 'boss' : ''} ${open ? '' : 'locked'} ${isCur ? 'current' : ''}" style="left:calc(50% - ${cx}px + ${x}px);top:${ny}px;${bg}" data-node="${i}" aria-label="${esc(label)}${done ? ', done' : open ? '' : ', locked'}">${icon}${stars}</button>`);
      if (isCur) {
        parts.push(`<div class="start-tag" style="left:calc(50% - ${cx}px + ${x}px);top:${ny - 46}px">${n.kind === 'boss' ? 'Challenge!' : 'Start'}</div>`);
        const side = x > cx ? -1 : 1;
        parts.push(`<div class="pip-at" style="left:calc(50% - ${cx}px + ${x + side * 70 - 32}px);top:${ny}px">${pip(cur === 0 ? 'wow' : 'happy')}</div>`);
      }
      y += 102;
    });
    y += 18;
  });
  COMING.forEach((c, ci) => {
    parts.push(`<div class="unit-banner soon" style="top:${y}px"><span class="em">${c.emoji}</span><div><h2>Unit ${UNITS.length + ci + 1}: ${esc(c.title)}</h2><p>${esc(c.desc)} · coming soon</p></div></div>`);
    y += 118;
  });
  // Pip's body runs along every finished node; dotted trail shows the road ahead.
  const curve = arr => arr.length < 2 ? '' : arr.reduce((d, p, j) => {
    if (j === 0) return `M${p.x} ${p.y}`;
    const q = arr[j - 1], my = (q.y + p.y) / 2; return d + ` C${q.x} ${my} ${p.x} ${my} ${p.x} ${p.y}`;
  }, '');
  const reach = cur === -1 ? pts.length : pts.findIndex(p => p.i === cur) + 1;
  const body = curve(pts.slice(0, reach)), trail = curve(pts.slice(Math.max(0, reach - 1)));
  const svg = `<svg class="body" width="${COLW}" height="${y}" viewBox="0 0 ${COLW} ${y}" aria-hidden="true">
     <path d="${trail}" stroke="var(--lock)" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="1 18"/>
     <path d="${body}" stroke="#1f4fb0" stroke-width="26" fill="none" stroke-linecap="round" transform="translate(0 4)"/>
     <path d="${body}" stroke="#2f6fe4" stroke-width="26" fill="none" stroke-linecap="round"/>
     <path d="${body}" stroke="#ffcf3a" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="3 16"/></svg>`;
  return `<div class="path" style="height:${y + 10}px">${svg}${parts.join('')}</div>`;
}

function vLesson() {
  const e = L.queue[L.idx], c = L.cur;
  const pct = Math.round(100 * L.solved / L.total);
  const kinds = { learn: '💡 New idea', mc: '🤔 Pick one', predict: '🔮 Predict', blocks: '🧱 Build it', fill: '✏️ Fill the gap', bug: '🐞 Bug hunt', code: '⌨️ Write code' };
  let body = '';
  const speak = `<button class="speak" data-act="speak" aria-label="Read aloud">🔊</button>`;
  if (e.t === 'learn') {
    body = `<div class="kind">${kinds.learn} ${speak}</div><h2>${esc(e.title)}</h2>
      <div class="learn-card"><div class="tip"><div class="pip-mini">${pip('happy')}</div><p>${esc(e.text)}</p></div>
      <pre class="code">${hl(e.code)}</pre>
      ${c.status === 'shown' ? `<div class="out" aria-live="polite">${esc(e.out)}</div>` : `<button class="btn sun small" data-act="show-out">▶ Run it</button>`}</div>`;
  } else {
    body = `<div class="kind">${kinds[e.t]} ${speak}</div><h2>${esc(e.q)}</h2>`;
    if (e.code && e.t !== 'fill') body += `<pre class="code">${hl(e.code)}</pre>`;
    const locked = c.status === 'ok' || c.status === 'bad';
    if (e.t === 'mc' || e.t === 'predict' || e.t === 'fill') {
      if (e.t === 'fill') {
        const filled = c.sel !== null ? e.opts[c.sel] : '___';
        body += `<pre class="code">${hl(e.code).replace('___', `<span style="background:var(--sun);color:#3a2a00;border-radius:5px;padding:0 4px">${esc(filled)}</span>`)}</pre>`;
      }
      const order = c.order || (c.order = shuffle(e.opts.map((_, i) => i)));
      body += `<div class="opts">${order.map(i => {
        const st = locked ? (i === e.a ? 'right' : i === c.sel ? 'wrong' : '') : (i === c.sel ? 'sel' : '');
        return `<button class="opt ${looksCode(e.opts[i]) || e.t !== 'mc' ? 'code-like' : ''} ${st}" data-opt="${i}" ${locked ? 'disabled' : ''}>${esc(e.opts[i])}</button>`; }).join('')}</div>`;
    }
    if (e.t === 'blocks') {
      const preview = c.picked.map(p => p.t).join(' ').replace(/(\w) \(/g, '$1(').replace(/\( /g, '(').replace(/ \)/g, ')').replace(/ ([:,\]])/g, '$1').replace(/\[ /g, '[').replace(/ \./g, '.').replace(/\. /g, '.');
      body += `<div class="answer-line" aria-label="Your answer">${c.picked.map((p, j) => `<button class="tok" data-unpick="${j}" ${locked ? 'disabled' : ''}>${esc(p.t)}</button>`).join('')}</div>
        <div class="preview">${c.picked.length ? esc(preview) : '<span class="muted">Tap the blocks in order</span>'}</div>
        <div class="bank">${c.bank.map((b, j) => `<button class="tok ${c.picked.includes(b) ? 'used' : ''}" data-pick="${j}" ${locked ? 'disabled' : ''}>${esc(b.t)}</button>`).join('')}</div>`;
    }
    if (e.t === 'bug') {
      body += e.lines.map((ln, i) => {
        const st = locked ? (i === e.a ? 'right' : i === c.sel ? 'wrong' : '') : (i === c.sel ? 'sel' : '');
        return `<button class="bugline ${st}" data-opt="${i}" ${locked ? 'disabled' : ''}><span class="ln">${i + 1}</span>${hl(ln)}</button>`; }).join('');
    }
    if (e.t === 'code') {
      body += `<textarea class="editor" id="ed" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" aria-label="Code editor" ${c.status === 'running' ? 'disabled' : ''}>${esc(c.code)}</textarea>
        ${keyRow()}
        ${c.out || c.err ? `<div class="out ${c.err ? 'err' : ''}" aria-live="polite" style="margin-top:10px">${esc(c.out)}${c.err ? (c.out ? '\n' : '') + '⚠️ ' + esc(c.err) : ''}</div>` : ''}
        <p class="muted" style="font-size:.88em;margin-top:10px">Goal output:</p><div class="out">${esc(e.expect)}</div>`;
    }
  }
  return `<div class="lesson-top"><button class="x" data-act="quit" aria-label="Quit lesson">✕</button><div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>${L.kind === 'boss' ? '👑' : ''}</div>
    <section class="ex">${body}</section>${vFoot(e, c)}`;
}
function vFoot(e, c) {
  if (e.t === 'learn') return `<div class="foot"><div class="foot-in"><button class="btn leaf" data-act="next">Got it!</button></div></div>`;
  if (c.status === 'ok') {
    const cheers = ['Awesome!', 'You got it!', 'Brilliant!', 'Nailed it!', 'Super!', 'Sssspectacular!'];
    return `<div class="foot ok" role="status"><div class="foot-in"><div class="verdict">✓ ${cheers[Math.random() * cheers.length | 0]}</div><button class="btn leaf" data-act="next">Continue</button></div></div>`;
  }
  if (c.status === 'bad') {
    let why = '';
    if (e.t === 'mc' || e.t === 'predict' || e.t === 'fill') why = `Answer: <code>${esc(e.opts[e.a])}</code>. ${esc(e.hint || '')}`;
    if (e.t === 'blocks') why = `Answer: <code>${esc(e.tokens.join(' '))}</code>. ${esc(e.hint || '')}`;
    if (e.t === 'bug') why = esc(e.why);
    if (e.t === 'code') {
      return `<div class="foot bad" role="status"><div class="foot-in"><div class="verdict">Not yet!</div><p class="why">💡 ${esc(e.hint)}</p>
        <div class="row"><button class="btn ghost" data-act="reveal">Show answer</button><button class="btn coral" data-act="retry">Try again</button></div></div></div>`;
    }
    return `<div class="foot bad" role="status"><div class="foot-in"><div class="verdict">Not quite</div><p class="why">${why}</p><button class="btn coral" data-act="next">Got it</button></div></div>`;
  }
  const ready = e.t === 'blocks' ? c.picked.length > 0 : e.t === 'code' ? c.code.trim().length > 0 && c.status !== 'running' : c.sel !== null;
  const label = e.t === 'code' ? (c.status === 'running' ? 'Running…' : '▶ Run & check') : 'Check';
  return `<div class="foot"><div class="foot-in"><button class="btn" data-act="check" ${ready ? '' : 'disabled'}>${label}</button></div></div>`;
}
function keyRow() {
  const K = [['print()', 'print()', 6], ['" "', '""', 1], [':', ':', 1], ['=', ' = ', 3], ['( )', '()', 1], ['[ ]', '[]', 1], ['+', ' + ', 3], ['for', 'for i in range():', 15], ['if', 'if :', 3], ['else:', 'else:', 5], ['⇥ tab', '    ', 4], ['def', 'def ():', 4], ['return', 'return ', 7]];
  return `<div class="keys" aria-label="Quick keys">${K.map(([lab, ins, off]) => `<button data-key="${esc(ins)}" data-off="${off}">${esc(lab)}</button>`).join('')}</div>`;
}

function vDone() {
  const r = view.result;
  if (r.kind === 'jump' && !r.passed) {
    return `<section class="done">${pip('sad', 'pip-big')}<h1>Almost!</h1><p class="muted">You got ${r.acc}% right. You need 75% to jump ahead. Keep going one lesson at a time — you'll get there fast.</p>
      <button class="btn" data-go="home">Back to the path</button></section>`;
  }
  const head = r.kind === 'jump' ? 'You jumped ahead!' : r.kind === 'boss' ? 'Challenge beaten!' : r.kind === 'practice' ? 'Practice complete!' : 'Lesson complete!';
  return `<section class="done">${pip('wow', 'pip-big')}<h1>${head}</h1>
    ${r.kind === 'lesson' || r.kind === 'boss' ? `<div class="big-stars" aria-label="${r.stars} stars">${'⭐'.repeat(r.stars)}${'<span style="filter:grayscale(1);opacity:.3">⭐</span>'.repeat(3 - r.stars)}</div>` : ''}
    <div class="done-stats">
      <div class="stat"><b>+${r.xp}</b><span>XP</span></div>
      <div class="stat"><b>${r.acc}%</b><span>first try</span></div>
      <div class="stat"><b>${r.secs < 60 ? r.secs + 's' : Math.round(r.secs / 60) + 'm'}</b><span>time</span></div>
    </div>
    ${r.streakUp ? `<div class="new-badge"><span class="em">🔥</span><div><b>${S.streak}-day streak!</b><div class="muted" style="font-size:.9em">Come back tomorrow to keep it going.${S.streak % 7 === 0 ? ' You earned a streak shield 🛡️' : ''}</div></div></div>` : ''}
    ${r.fresh.map(b => `<div class="new-badge"><span class="em">${b.em}</span><div><b>New badge: ${esc(b.name)}</b><div class="muted" style="font-size:.9em">${esc(b.desc)}</div></div></div>`).join('')}
    <button class="btn" data-go="home">Continue</button></section>`;
}

function vPractice() {
  const doneLessons = UNITS.flatMap(u => u.lessons).filter(l => isDone(l.id)).length;
  const rows = UNITS.map(u => {
    const ks = u.lessons.flatMap(l => l.ex).map(e => S.stats[e.key]).filter(Boolean);
    const r = ks.reduce((a, s) => a + s.r, 0), w = ks.reduce((a, s) => a + s.w, 0);
    if (!r && !w) return '';
    const p = Math.round(100 * r / (r + w));
    return `<div class="skillrow"><span>${u.emoji}</span><div><div style="font-size:.9em;margin-bottom:3px">${esc(u.title)}</div><div class="meter"><i style="width:${p}%;background:${p >= 80 ? 'var(--leaf)' : p >= 55 ? 'var(--sun)' : 'var(--coral)'}"></i></div></div><b style="text-align:right">${p}%</b></div>`;
  }).join('');
  return `<h1 class="section-title">Practice</h1><p class="sub muted">Pip mixes questions from lessons you've done, focusing on the ones that were tricky and the ones you haven't seen in a while.</p>
    <div class="card"><div class="tip"><div class="pip-mini">${pip('happy')}</div><div><b style="font-family:var(--f-ui)">Quick 8-question round</b><p class="muted" style="margin:2px 0 0">+8 XP and it counts for your streak.</p></div></div>
    <div style="margin-top:14px"><button class="btn sun" data-act="practice" ${doneLessons ? '' : 'disabled'}>${doneLessons ? 'Start practice' : 'Finish a lesson to unlock'}</button></div></div>
    ${rows ? `<h2 style="font-size:1.15em;margin:22px 0 4px">How you're doing</h2>${rows}` : ''}`;
}

const SAMPLES = {
  'Say hi': 'name = "Pip"\nprint(f"Hi, I\'m {name}!")',
  'Countdown': 'for n in range(5, 0, -1):\n    print(n)\nprint("Lift off! 🚀")',
  'Times table': 'n = 7\nfor i in range(1, 11):\n    print(f"{n} x {i} = {n * i}")',
  'Dice roll': 'import random\nroll = random.randint(1, 6)\nprint("You rolled", roll)\nif roll == 6:\n    print("Jackpot!")',
  'Pattern': 'for i in range(1, 6):\n    print("🐍" * i)',
};
let pgCode = null, pgOut = null;
function vPlay() {
  if (pgCode === null) pgCode = SAMPLES['Say hi'];
  return `<h1 class="section-title">Playground</h1><p class="sub muted">Write anything you like and run it. Nothing here can break.</p>
    <div class="row" style="margin-bottom:10px"><select id="sample" aria-label="Load an example"><option value="">Load an example…</option>${Object.keys(SAMPLES).map(k => `<option>${esc(k)}</option>`).join('')}</select><span class="spacer"></span><span class="muted" style="font-size:.85em">${engine === 'ready' ? '🟢 Python ready' : engine === 'loading' ? '🟡 Loading Python…' : '🔴 Python offline'}</span></div>
    <textarea class="editor" id="ed" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" style="min-height:200px" aria-label="Code editor">${esc(pgCode)}</textarea>
    ${keyRow()}
    <div class="row" style="margin-top:10px"><button class="btn leaf" data-act="run-pg">▶ Run</button><button class="btn ghost small" data-act="clear-pg">Clear</button></div>
    <div class="pg-out">${pgOut ? `<div class="out ${pgOut.err ? 'err' : ''}" aria-live="polite">${esc(pgOut.out)}${pgOut.err ? (pgOut.out ? '\n' : '') + '⚠️ ' + esc(pgOut.err) : ''}${!pgOut.out && !pgOut.err ? '<span class="muted">(no output — try adding print)</span>' : ''}</div>` : ''}</div>`;
}

function vBadges() {
  const n = BADGES.filter(b => S.badges[b.id]).length;
  return `<h1 class="section-title">Badges</h1><p class="sub muted">${n} of ${BADGES.length} collected · best streak ${S.best} ${S.best === 1 ? 'day' : 'days'}</p>
    <div class="grid-badges">${BADGES.map(b => `<div class="badge ${S.badges[b.id] ? '' : 'off'}"><div class="em">${b.em}</div><h3>${esc(b.name)}</h3><p>${esc(b.desc)}</p></div>`).join('')}</div>`;
}

let parentsOpen = false;
function vParents() {
  if (!parentsOpen) {
    return `<h1 class="section-title">Grown-ups</h1><p class="sub muted">${NATIVE.isNative && !S.adFree ? "Progress reports, settings and removing ads" : "Progress reports and settings"} live behind a quick grown-up check.</p>
      <button class="btn" data-act="open-parents">I'm a grown-up</button>`;
  }
  const lessons = UNITS.flatMap(u => u.lessons).filter(l => isDone(l.id)).length, totalL = UNITS.flatMap(u => u.lessons).length;
  const all = Object.values(S.stats); const r = all.reduce((a, s) => a + s.r, 0), w = all.reduce((a, s) => a + s.w, 0);
  const tg = (k, on) => `<button class="toggle ${on ? 'on' : ''}" data-toggle="${k}" role="switch" aria-checked="${on}"></button>`;
  return `<h1 class="section-title">Grown-ups</h1><p class="sub muted">${esc(S.name || 'Your coder')}'s progress</p>
    <div class="stat-grid">
      <div class="stat"><b>${lessons}/${totalL}</b><span>lessons done</span></div>
      <div class="stat"><b>${r + w ? Math.round(100 * r / (r + w)) : 0}%</b><span>answers right</span></div>
      <div class="stat"><b>${S.streak}</b><span>day streak (best ${S.best})</span></div>
      <div class="stat"><b>${S.xp}</b><span>total XP</span></div>
    </div>
    <div class="card">
      <div class="setting"><div><b>Learning track</b><div class="muted" style="font-size:.85em">${esc(TRACKS[S.track].note)}</div></div>
        <select data-set="track">${Object.entries(TRACKS).map(([k, t]) => `<option value="${k}" ${S.track === k ? 'selected' : ''}>${t.emoji} ${t.name} (${t.ages})</option>`).join('')}</select></div>
      <div class="setting"><div><b>Sound effects</b></div>${tg('sound', S.settings.sound)}</div>
      <div class="setting"><div><b>Read questions aloud</b><div class="muted" style="font-size:.85em">On by default for Hatchlings</div></div>${tg('voice', voiceOn())}</div>
      ${NATIVE.isNative ? `<div class="setting"><div><b>Daily reminder</b><div class="muted" style="font-size:.85em">A gentle nudge in the late afternoon to keep the streak going</div></div>${tg('remind', S.settings.remind !== false)}</div>` : ''}
${NATIVE.isNative ? `      <div class="setting"><div><b>Remove ads</b><div class="muted" style="font-size:.85em">${S.adFree ? 'Purchased. Thank you!' : 'One-time purchase for this Apple ID'}</div></div>
        ${S.adFree ? '✅' : `<button class="btn sun small" data-act="buy">${esc(priceLabel)}</button>`}</div>
      <div class="setting"><div><b>Restore purchase</b></div><button class="btn ghost small" data-act="restore">Restore</button></div>
` : ''}
      <div class="setting"><div><b>Start over</b><div class="muted" style="font-size:.85em">Erases all progress on this device</div></div><button class="btn ghost small" data-act="reset">Reset</button></div>
    </div>
    <p class="muted" style="font-size:.85em;margin-top:14px">${NATIVE.isNative ? 'Progress is saved on this device. No account and no personal data is collected.' : 'Browser preview: purchases are simulated, and progress is saved only in this browser.'}
      ${NATIVE.config.privacyPolicyUrl ? `<br><a href="${esc(NATIVE.config.privacyPolicyUrl)}" target="_blank" rel="noopener">Privacy policy</a>` : ''}</p>
    <button class="btn ghost" style="margin-top:6px" data-act="lock-parents">Lock grown-up area</button>`;
}

function vOnboard() {
  const step = view.step || 0;
  if (step === 0) return `<main class="screen no-nav"><section class="onb">${pip('wow', 'pip-big')}<h1>Hi! I'm Pip, and I speak Python.</h1>
    <p class="muted" style="max-width:34ch">Python is a real language that real coders use to build games, apps and robots. I'll teach you, one tiny step at a time.</p>
    <button class="btn" data-onb="1">Let's go!</button></section></main>`;
  if (step === 1) return `<main class="screen no-nav"><section class="onb"><h1>What should I call you?</h1>
    <input type="text" id="nm" maxlength="16" placeholder="Your first name" value="${esc(S.name)}" style="width:100%;text-align:center;font-size:1.2em" autocomplete="off">
    <p class="muted" style="margin:0">Pick a buddy</p>
    <div class="avatars">${AVATARS.map(a => `<button class="${S.avatar === a ? 'sel' : ''}" data-av="${a}" aria-label="Avatar ${a}">${a}</button>`).join('')}</div>
    <button class="btn" data-onb="2">Next</button></section></main>`;
  return `<main class="screen no-nav"><section class="onb"><h1>How old are you?</h1>
    <div class="ages">${Array.from({ length: 11 }, (_, i) => i + 5).map(a => `<button class="${S.age === a ? 'sel' : ''}" data-age="${a}">${a}</button>`).join('')}</div>
    <div class="track-note"><b style="font-family:var(--f-ui)">${TRACKS[trackFor(S.age)].emoji} ${TRACKS[trackFor(S.age)].name} track</b><p class="muted" style="margin:4px 0 0">${TRACKS[trackFor(S.age)].note}</p></div>
    <button class="btn leaf" data-onb="done">Start learning</button></section></main>`;
}

function vModal() {
  if (modal.type === 'gate') return `<div class="modal-bg"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="gt"><h2 id="gt">Ask a grown-up</h2>
    <p class="muted" style="margin:0">${esc(modal.why)} To continue, answer this:</p>
    <p style="font-family:var(--f-ui);font-size:1.6em;text-align:center;margin:14px 0 0">${modal.a} × ${modal.b} = ?</p>
    <input id="gate-in" type="number" inputmode="numeric" aria-label="Answer">
    <div class="row"><button class="btn ghost" data-act="close-modal">Cancel</button><button class="btn" data-act="gate-ok">Continue</button></div></div></div>`;
  if (modal.type === 'quit') return `<div class="modal-bg"><div class="modal" role="dialog" aria-modal="true"><div style="width:110px;margin:0 auto">${pip('sad')}</div>
    <h2 style="text-align:center">Wait, don't go!</h2><p class="muted" style="text-align:center">You'll lose your progress in this lesson.</p>
    <div class="row" style="flex-direction:column;gap:12px"><button class="btn" data-act="close-modal">Keep learning</button><button class="btn ghost" data-act="quit-yes">Quit lesson</button></div></div></div>`;
  return '';
}

// ---------- events ----------
function after() {
  const ed = $('#ed');
  if (ed) {
    ed.addEventListener('input', () => { if (view.name === 'play') pgCode = ed.value; else if (L) { L.cur.code = ed.value; const b = document.querySelector('[data-act="check"]'); if (b) b.disabled = !ed.value.trim(); } });
    ed.addEventListener('keydown', ev => {
      if (ev.key === 'Tab') { ev.preventDefault(); insert(ed, '    ', 4); }
      if (ev.key === 'Enter') { // auto-indent, and indent after a colon
        const s = ed.selectionStart, before = ed.value.slice(0, s), line = before.split('\n').pop();
        let ind = (line.match(/^\s*/) || [''])[0]; if (line.trimEnd().endsWith(':')) ind += '    ';
        ev.preventDefault(); insert(ed, '\n' + ind, ind.length + 1);
      }
    });
  }
  const sm = $('#sample'); if (sm) sm.addEventListener('change', () => { if (sm.value) { pgCode = SAMPLES[sm.value]; pgOut = null; render(); } });
  const gi = $('#gate-in'); if (gi) gi.addEventListener('keydown', ev => { if (ev.key === 'Enter') act('gate-ok'); });
}
function insert(ed, text, cursorOff) {
  const s = ed.selectionStart, e = ed.selectionEnd;
  ed.value = ed.value.slice(0, s) + text + ed.value.slice(e);
  ed.selectionStart = ed.selectionEnd = s + cursorOff; ed.focus();
  ed.dispatchEvent(new Event('input'));
}
async function act(a, el) {
  switch (a) {
    case 'speak': { const e = L.queue[L.idx]; say(e.t === 'learn' ? e.title + '. ' + e.text : e.q); break; }
    case 'show-out': L.cur.status = 'shown'; sfx.tap(); render(); break;
    case 'check': await check(); break;
    case 'next': next(); break;
    case 'retry': L.cur.status = null; L.cur.err = ''; L.cur.out = ''; render(); setTimeout(() => { const e = $('#ed'); if (e) e.focus(); }, 30); break;
    case 'reveal': { const e = L.queue[L.idx]; L.cur.code = e.solution; L.cur.status = null; L.cur.err = ''; L.cur.out = ''; render(); toast('Here\'s one way to do it. Run it to see!'); break; }
    case 'quit': modal = { type: 'quit' }; render(); break;
    case 'quit-yes': modal = null; L = null; go('home'); break;
    case 'close-modal': modal = null; render(); break;
    case 'practice': startPractice(); break;
    case 'run-pg': { const ed = $('#ed'); pgCode = ed.value; pgOut = { out: '', err: '' }; render(); const r = await runPython(pgCode); pgOut = { out: r.out, err: r.ok ? '' : r.err }; if (r.ok) { S.badges.play = S.badges.play || (toast('🧪 New badge: Tinkerer'), Date.now()); save(); } render(); break; }
    case 'clear-pg': pgCode = ''; pgOut = null; render(); break;
    case 'open-parents': gate(() => { parentsOpen = true; }, 'This area is for parents and teachers.'); break;
    case 'lock-parents': parentsOpen = false; render(); break;
    case 'remove-ads': gate(() => { parentsOpen = true; view = { name: 'parents' }; }, 'Removing ads is a purchase.'); break;
    case 'buy': gate(async () => {
        toast('Opening the App Store…');
        purchasing = true; syncAds();
        const r = await NATIVE.iap.buy();
        purchasing = false;
        if (r === 'bought') { S.adFree = true; save(); NATIVE.ads.remove(); toast('Ads removed. Thank you! 💙'); confetti(); }
        else if (r === 'error') toast('The purchase didn\'t go through. Nothing was charged. Try again later.');
        render();
      }, `This is a ${priceLabel} purchase.`); break;
    case 'restore': {
      toast('Checking your purchases…');
      const own = await NATIVE.iap.restore();
      if (own === null && !NATIVE.isNative) { toast(S.adFree ? 'Your purchase is already active.' : 'No previous purchase found.'); break; }
      if (own) { S.adFree = true; save(); NATIVE.ads.remove(); toast('Purchase restored. Ads are gone! 💙'); }
      else toast(own === null ? 'Couldn\'t reach the App Store. Check the internet and try again.' : 'No previous purchase found for this Apple ID.');
      render(); break;
    }
    case 'reset': gate(() => { const keep = { settings: S.settings, adFree: S.adFree }; S = Object.assign(fresh(), keep); parentsOpen = false; view = { name: 'home', step: 0 }; }, 'This erases all progress.'); break;
    case 'gate-ok': {
      const v = +($('#gate-in') || {}).value;
      if (v === modal.a * modal.b) { const f = modal.onPass; modal = null; f(); save(); render(); }
      else { modal = null; render(); toast('That wasn\'t right. Ask a grown-up for help.'); }
      break;
    }
  }
}
document.addEventListener('click', async ev => {
  const t = ev.target.closest('button'); if (!t || t.disabled) return;
  const d = t.dataset;
  if (d.go) { if (d.go !== 'parents') parentsOpen = false; go(d.go); return; }
  if (d.act) return act(d.act, t);
  if (d.node !== undefined) { const i = +d.node; if (unlocked(i)) { sfx.tap(); startNode(i); } else toast('🔒 Finish the lessons before this one first.'); return; }
  if (d.jump !== undefined) { startJump(+d.jump); return; }
  if (d.opt !== undefined) { L.cur.sel = +d.opt; sfx.tap(); render(); return; }
  if (d.pick !== undefined) { const b = L.cur.bank[+d.pick]; if (!L.cur.picked.includes(b)) { L.cur.picked.push(b); sfx.tap(); render(); } return; }
  if (d.unpick !== undefined) { L.cur.picked.splice(+d.unpick, 1); render(); return; }
  if (d.key !== undefined) { const ed = $('#ed'); if (ed) insert(ed, d.key, +d.off); return; }
  if (d.toggle) {
    if (d.toggle === 'voice') S.settings.voice = !voiceOn();
    else if (d.toggle === 'remind') {
      const on = S.settings.remind === false;
      if (on && !(await NATIVE.reminders.permission(true))) { toast('Turn on notifications for this app in iPhone Settings first.'); return; }
      S.settings.remind = on; scheduleReminders();
    }
    else S.settings[d.toggle] = !S.settings[d.toggle];
    save(); render(); return;
  }
  if (d.av) { S.avatar = d.av; const n = $('#nm'); if (n) S.name = n.value.trim(); render(); return; }
  if (d.age) { S.age = +d.age; sfx.tap(); render(); return; }
  if (d.onb) {
    const n = $('#nm'); if (n) S.name = n.value.trim();
    if (d.onb === 'done') { S.track = trackFor(S.age); S.onboarded = true; save(); go('home'); }
    else { view = { name: 'home', step: +d.onb }; render(); }
  }
});
document.addEventListener('change', ev => {
  if (ev.target.dataset && ev.target.dataset.set === 'track') { S.track = ev.target.value; save(); render(); }
});

// ---------- boot ----------
(async function boot() {
  await load(); checkStreakOnOpen(); render();
  NATIVE.shell.ready(matchMedia('(prefers-color-scheme: dark)').matches);
  NATIVE.ads.init().then(syncAds);
  NATIVE.iap.price().then(p => { if (p) { priceLabel = p; if (view.name === 'parents') render(); } });
  // Re-check the purchase with Apple on every launch (new phone, reinstall, or a refund).
  NATIVE.iap.owned().then(own => { if (own === null || own === S.adFree) return; S.adFree = own; save(); if (own) NATIVE.ads.remove(); render(); });
  if (S.onboarded && S.askedRemind) scheduleReminders();
  document.addEventListener('visibilitychange', () => { if (!document.hidden && S && S.onboarded) { checkStreakOnOpen(); if (!L && !modal && view.name !== 'play') render(); } });
})();
})();
