/* =========================================================
   learn.js — 学習プラットフォーム化（読む・聴く・観る）
   既存ページに後付けで機能を注入。すべてローカル/localStorage。
   ========================================================= */
(function () {
  var D = document, W = window;
  var chId = (function () { var m = (location.pathname.split('/').pop() || '').match(/ch(\d+)\.html/); return m ? 'ch' + m[1] : null; })();
  if (!D.querySelector('.reading')) { /* 目次等でもツールバーは出す */ }
  var CH_MIN = 0, CH_MAX = 13;
  var chNum = chId ? parseInt(chId.slice(2), 10) : null;
  var chTitle = (D.title.split('｜')[0] || D.title).trim();

  // ---- storage ----
  function LS(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function SS(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var PROG = LS('lx_prog', {});          // {chNN:{read,watch,listen}}
  var BM = LS('lx_bm', []);              // [{ch,title,id,label}]
  function prog() { PROG[chId] = PROG[chId] || { read: 0, watch: 0, listen: 0 }; return PROG[chId]; }
  function saveProg() { SS('lx_prog', PROG); }

  var ICON = {
    sun: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/></svg>',
    moon: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
    audio: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10v4h4l5 5V5L7 10H3zM16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14"/></svg>',
    video: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="15" height="14" rx="2"/><path d="M17 9l5-3v12l-5-3z"/></svg>',
    note: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v12l-4 4H4z"/><path d="M16 20v-4h4M8 9h8M8 13h5"/></svg>',
    star: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/></svg>',
    mode: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18M3 12h18" opacity=".0"/><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/></svg>'
  };
  function el(html) { var t = D.createElement('div'); t.innerHTML = html.trim(); return t.firstChild; }
  function fmt(s) { s = Math.max(0, s | 0); return (s / 60 | 0) + ':' + ('0' + (s % 60)).slice(-2); }

  /* ============ 1. 右上ツールバー ============ */
  var bar = el('<div class="lx-bar"></div>');
  var bTheme = el('<button title="テーマ切替">' + ICON.moon + '</button>');
  var bMode = el('<button class="on" title="学習モード">' + ICON.mode + '<span>学習モード</span></button>');
  var bProg = el('<div class="lx-prog-mini" title="学習進捗"><span class="ring"></span><b>0%</b></div>');
  var bBm = el('<button title="後で復習">' + ICON.star + '</button>');
  var bNote = el('<button title="学習メモ">' + ICON.note + '<span>メモ</span></button>');
  bar.append(bProg, bTheme, bBm, bNote, bMode);
  D.body.appendChild(bar);

  // テーマ
  var theme = LS('lx_theme', 'light');
  function applyTheme() { D.documentElement.setAttribute('data-theme', theme); bTheme.innerHTML = theme === 'dark' ? ICON.sun : ICON.moon; }
  applyTheme();
  bTheme.onclick = function () { theme = theme === 'dark' ? 'light' : 'dark'; SS('lx_theme', theme); applyTheme(); };

  // 学習モード
  var mode = LS('lx_mode', 'on');
  function applyMode() { D.documentElement.setAttribute('data-mode', mode); bMode.classList.toggle('on', mode === 'on'); }
  applyMode();
  bMode.onclick = function () { mode = mode === 'on' ? 'off' : 'on'; SS('lx_mode', mode); applyMode(); };

  /* ============ 進捗ポップオーバー ============ */
  var pop = el('<div class="lx-pop"><h4>学習の進捗（この章）</h4>'
    + metricHtml('読了率', 'read') + metricHtml('視聴率（動画）', 'watch') + metricHtml('再生率（音声）', 'listen') + metricHtml('クイズ正答率', 'quiz')
    + '</div>');
  D.body.appendChild(pop);
  function metricHtml(label, k) { return '<div class="lx-metric" data-k="' + k + '"><div class="l"><span>' + label + '</span><b>0%</b></div><div class="track"><i style="width:0"></i></div></div>'; }
  bProg.onclick = function () { closePops(pop); pop.classList.toggle('show'); refreshMetrics(); };
  function refreshMetrics() {
    var p = prog();
    var quiz = LS('aix_progress_v1', {})[chId] || {}; var qz = quiz.quiz ? Math.round((quiz.quiz.correct / Math.max(1, quiz.quiz.total)) * 100) : 0;
    var vals = { read: Math.round(p.read || 0), watch: Math.round(p.watch || 0), listen: Math.round(p.listen || 0), quiz: qz };
    pop.querySelectorAll('.lx-metric').forEach(function (m) { var k = m.dataset.k, v = vals[k] || 0; m.querySelector('b').textContent = v + '%'; m.querySelector('i').style.width = v + '%'; });
    var rr = Math.round(p.read || 0); bProg.querySelector('.ring').style.setProperty('--v', rr); bProg.querySelector('b').textContent = rr + '%';
  }

  /* ============ 復習(ブックマーク)ポップオーバー ============ */
  var rev = el('<div class="lx-pop"><h4>後で復習（ブックマーク）</h4><div class="lx-review"></div></div>');
  D.body.appendChild(rev);
  function renderReview() {
    var box = rev.querySelector('.lx-review'); BM = LS('lx_bm', []);
    if (!BM.length) { box.innerHTML = '<div class="empty">見出しの ☆ を押すと、ここに追加されます。</div>'; return; }
    box.innerHTML = BM.map(function (b) { return '<a href="' + b.ch + '.html#' + b.id + '">☆ ' + esc(b.label) + '<br><small style="color:var(--ink-faint)">' + esc(b.title) + '</small></a>'; }).join('');
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  bBm.onclick = function () { closePops(rev); rev.classList.toggle('show'); renderReview(); };
  function closePops(except) { [pop, rev].forEach(function (p) { if (p !== except) p.classList.remove('show'); }); }
  D.addEventListener('click', function (e) { if (!e.target.closest('.lx-pop') && !e.target.closest('.lx-bar')) closePops(); });

  /* ============ 見出しブックマーク ☆ ============ */
  if (chId) D.querySelectorAll('.reading h2[id]').forEach(function (h) {
    var id = h.id, label = h.textContent.replace(/^\s*[\d\-★]+\s*/, '').trim();
    var on = BM.some(function (b) { return b.ch === chId && b.id === id; });
    var s = el('<button class="lx-star' + (on ? ' on' : '') + '" title="後で復習に追加">★</button>');
    s.onclick = function () {
      BM = LS('lx_bm', []); var i = BM.findIndex(function (b) { return b.ch === chId && b.id === id; });
      if (i >= 0) { BM.splice(i, 1); s.classList.remove('on'); } else { BM.push({ ch: chId, id: id, label: label, title: chTitle }); s.classList.add('on'); }
      SS('lx_bm', BM);
    };
    h.appendChild(s);
  });

  /* ============ 2. メモ ドロワー ============ */
  var scrim = el('<div class="lx-scrim"></div>'); D.body.appendChild(scrim);
  var notes = el('<div class="lx-notes"><div class="nh"><b>学習メモ</b>'
    + '<button data-a="copy">コピー</button><button data-a="close">閉じる</button></div>'
    + '<textarea placeholder="Markdownでメモ… (自動保存／Obsidianへ貼り付け可)"></textarea>'
    + '<div class="nf"><span class="cc">0文字</span><span>自動保存</span></div></div>');
  D.body.appendChild(notes);
  var ta = notes.querySelector('textarea'), NKEY = 'lx_note_' + (chId || 'idx');
  ta.value = LS(NKEY, '') || (typeof localStorage !== 'undefined' ? (localStorage.getItem(NKEY + '_raw') || '') : '');
  // 生テキスト保存（JSONでなく素の文字列）
  ta.value = localStorage.getItem(NKEY) || '';
  function openNotes() { notes.classList.add('show'); scrim.classList.add('show'); ta.focus(); }
  function closeNotes() { notes.classList.remove('show'); scrim.classList.remove('show'); }
  bNote.onclick = openNotes; scrim.onclick = closeNotes;
  notes.querySelector('[data-a=close]').onclick = closeNotes;
  notes.querySelector('[data-a=copy]').onclick = function () { navigator.clipboard && navigator.clipboard.writeText(ta.value); var b = this; b.textContent = 'コピー済'; setTimeout(function () { b.textContent = 'コピー'; }, 1200); };
  var nt; ta.addEventListener('input', function () { localStorage.setItem(NKEY, ta.value); notes.querySelector('.cc').textContent = ta.value.length + '文字'; });
  notes.querySelector('.cc').textContent = ta.value.length + '文字';

  /* ============ 3. 起動バー（この章を聴く／観る） ============ */
  var audioSrc = chId ? 'assets/podcast/' + chId + '.m4a' : null;
  var videoSrc = chId ? 'assets/videos/' + chId + '.mp4' : null;
  var launch, haveAudio = false, haveVideo = false;
  if (chId && D.querySelector('.ch-head')) {
    launch = el('<div class="lx-launch">'
      + '<button class="audio" data-a="audio">' + ICON.audio + 'この章を聴く（ポッドキャスト）</button>'
      + '<button class="video" data-a="video">' + ICON.video + 'この章を観る（AI動画）</button>'
      + '</div>');
    D.querySelector('.ch-head').after(launch);
    // 存在チェック（読み込めなければ無効化）
    probe(audioSrc, function (ok) { haveAudio = ok; if (!ok) dis(launch.querySelector('[data-a=audio]'), '音声は準備中'); });
    probe(videoSrc, function (ok) { haveVideo = ok; if (!ok) dis(launch.querySelector('[data-a=video]'), '動画は準備中'); });
    launch.querySelector('[data-a=audio]').onclick = function () { if (haveAudio) openAudio(true); };
    launch.querySelector('[data-a=video]').onclick = function () { if (haveVideo) openVideo(); };
  }
  function dis(b, msg) { b.setAttribute('disabled', ''); b.innerHTML = b.innerHTML.replace(/この章を[^<]*$/, msg); }
  function probe(url, cb) { if (!url) return cb(false); fetch(url, { method: 'HEAD' }).then(function (r) { cb(r.ok); }).catch(function () {
    // file:// では HEAD 不可 → 実読込で判定
    var t = url.match(/\.mp4$/) ? D.createElement('video') : D.createElement('audio');
    t.preload = 'metadata'; t.onloadedmetadata = function () { cb(true); }; t.onerror = function () { cb(false); }; t.src = url;
  }); }

  /* ============ 音声ミニプレイヤー ============ */
  var au = new Audio(); au.preload = 'metadata'; var mini, miniShown = false;
  var AKEY = 'lx_audio';
  function buildMini() {
    if (mini) return;
    mini = el('<div class="lx-mini"><div class="top"><div class="disc">' + ICON.audio + '</div>'
      + '<div class="meta"><div class="t"></div><div class="s">ポッドキャストを再生中</div></div>'
      + '<button class="x" title="閉じる">×</button></div>'
      + '<div class="lx-seek"><span class="tm cur">0:00</span><input type="range" min="0" max="1000" value="0"><span class="tm dur">0:00</span></div>'
      + '<div class="lx-ctrls"><button class="prev" title="前の章">⏮</button><button class="b15" title="15秒戻る">-15</button>'
      + '<button class="play"></button><button class="f30" title="30秒進む">+30</button><button class="next" title="次の章">⏭</button>'
      + '<button class="spd" title="再生速度">1.0x</button><span class="vol">'+ICON.audio+'<input type="range" min="0" max="1" step="0.05" value="1"></span></div></div>');
    D.body.appendChild(mini);
    mini.querySelector('.t').textContent = chTitle;
    var seek = mini.querySelector('input[type=range]'), playB = mini.querySelector('.play');
    playB.innerHTML = ICON.play;
    mini.querySelector('.x').onclick = function () { au.pause(); mini.classList.remove('show'); adjustVid(); };
    playB.onclick = function () { au.paused ? au.play() : au.pause(); };
    mini.querySelector('.b15').onclick = function () { au.currentTime = Math.max(0, au.currentTime - 15); };
    mini.querySelector('.f30').onclick = function () { au.currentTime = Math.min(au.duration || 1e9, au.currentTime + 30); };
    mini.querySelector('.prev').onclick = function () { gotoChapter(-1); };
    mini.querySelector('.next').onclick = function () { gotoChapter(1); };
    var speeds = [1, 1.25, 1.5, 2, 0.75], si = 0;
    mini.querySelector('.spd').onclick = function () { si = (si + 1) % speeds.length; au.playbackRate = speeds[si]; this.textContent = speeds[si].toFixed(2).replace(/0$/, '') + 'x'; };
    mini.querySelector('.vol input').oninput = function () { au.volume = parseFloat(this.value); };
    var seeking = false;
    seek.addEventListener('input', function () { seeking = true; mini.querySelector('.cur').textContent = fmt((this.value / 1000) * (au.duration || 0)); });
    seek.addEventListener('change', function () { au.currentTime = (this.value / 1000) * (au.duration || 0); seeking = false; });
    au.addEventListener('loadedmetadata', function () { mini.querySelector('.dur').textContent = fmt(au.duration); });
    au.addEventListener('timeupdate', function () {
      if (!seeking && au.duration) { seek.value = (au.currentTime / au.duration) * 1000; mini.querySelector('.cur').textContent = fmt(au.currentTime); }
      if (au.duration) { var p = prog(); p.listen = Math.max(p.listen, (au.currentTime / au.duration) * 100); saveProg(); }
      SS(AKEY, { ch: chId, t: au.currentTime, playing: !au.paused });
    });
    au.addEventListener('play', function () { playB.innerHTML = ICON.pause; });
    au.addEventListener('pause', function () { playB.innerHTML = ICON.play; });
  }
  function openAudio(autoplay) {
    buildMini(); au.src = audioSrc; mini.classList.add('show'); miniShown = true; adjustVid();
    var st = LS(AKEY, {}); if (st.ch === chId && st.t) au.currentTime = st.t;
    if (autoplay) au.play().catch(function () {});
  }
  function gotoChapter(dir) {
    if (chNum == null) return; var n = chNum + dir; if (n < CH_MIN || n > CH_MAX) return;
    SS(AKEY, { ch: 'ch' + ('0' + n).slice(-2), t: 0, playing: true });
    location.href = 'ch' + ('0' + n).slice(-2) + '.html?play=audio';
  }
  // 別章から遷移してきたら自動再生
  if (chId && /[?&]play=audio/.test(location.search)) { probe(audioSrc, function (ok) { if (ok) openAudio(true); }); }
  else { var st = LS(AKEY, {}); if (st.ch === chId && st.playing) { probe(audioSrc, function (ok) { if (ok) openAudio(false); }); } }

  /* ============ 動画フローティング(PiP・ドラッグ・最小化) ============ */
  var vid;
  function adjustVid() { if (vid) vid.classList.toggle('audio-open', mini && mini.classList.contains('show')); }
  function openVideo() {
    if (!vid) {
      vid = el('<div class="lx-vid"><div class="hd"><span class="t">' + esc(chTitle) + '</span>'
        + '<button data-a="min" title="最小化">▁</button><button data-a="close" title="閉じる">×</button></div>'
        + '<video controls preload="metadata" playsinline></video></div>');
      D.body.appendChild(vid);
      vid.querySelector('video').src = videoSrc;
      var vEl = vid.querySelector('video');
      vEl.addEventListener('timeupdate', function () { if (vEl.duration) { var p = prog(); p.watch = Math.max(p.watch, (vEl.currentTime / vEl.duration) * 100); saveProg(); } });
      vid.querySelector('[data-a=close]').onclick = function () { vEl.pause(); vid.classList.remove('show'); };
      vid.querySelector('[data-a=min]').onclick = function () { vid.classList.toggle('min'); this.textContent = vid.classList.contains('min') ? '▢' : '▁'; };
      dragify(vid, vid.querySelector('.hd'));
    }
    vid.classList.add('show'); adjustVid(); vid.querySelector('video').play().catch(function () {});
  }
  function dragify(box, handle) {
    var sx, sy, ox, oy, drag = false;
    handle.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) return;
      drag = true; box.classList.add('dragging'); var r = box.getBoundingClientRect();
      ox = r.left; oy = r.top; sx = e.clientX; sy = e.clientY;
      box.style.right = 'auto'; box.style.bottom = 'auto'; box.style.left = ox + 'px'; box.style.top = oy + 'px';
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', function (e) {
      if (!drag) return; box.style.left = Math.max(4, Math.min(innerWidth - 60, ox + e.clientX - sx)) + 'px';
      box.style.top = Math.max(4, Math.min(innerHeight - 40, oy + e.clientY - sy)) + 'px';
    });
    handle.addEventListener('pointerup', function () { drag = false; box.classList.remove('dragging'); });
  }

  /* ============ 読了率（スクロール到達） ============ */
  if (chId && D.querySelector('.reading')) {
    var onScroll = function () {
      var h = D.documentElement, max = (h.scrollHeight - h.clientHeight) || 1;
      var r = Math.min(100, (h.scrollTop / max) * 100); var p = prog(); if (r > (p.read || 0)) { p.read = r; saveProg(); }
    };
    W.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
})();
