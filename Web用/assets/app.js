/* 教材サイト 共通スクリプト (依存なし) */
(function () {
  // --- mobile nav toggle ---
  var menu = document.querySelector('.topbar .menu');
  if (menu) menu.addEventListener('click', function () {
    document.body.classList.toggle('nav-open');
  });
  document.addEventListener('click', function (e) {
    if (document.body.classList.contains('nav-open')) {
      var sb = document.querySelector('.sidebar');
      if (sb && !sb.contains(e.target) && !menu.contains(e.target)) {
        document.body.classList.remove('nav-open');
      }
    }
  });

  // --- scroll progress bar ---
  var bar = document.getElementById('progress');
  if (bar) {
    var onScroll = function () {
      var h = document.documentElement;
      var max = (h.scrollHeight - h.clientHeight) || 1;
      bar.style.width = (h.scrollTop / max * 100) + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // --- quiz reveal ---
  document.querySelectorAll('.quiz .reveal').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var ans = btn.parentElement.querySelector('.answer');
      if (!ans) return;
      var shown = ans.classList.toggle('show');
      btn.textContent = shown ? '答えを隠す' : '答えを見る';
    });
  });

  // --- highlight current chapter in sidebar ---
  var here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sidebar a.ch').forEach(function (a) {
    if (a.getAttribute('href') === here) a.classList.add('active');
  });

  // --- scroll reveal (上品なフェードイン + グリッドのスタッガー) ---
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;

  var targets = [];
  var add = function (el, delay) {
    if (!el || el.classList.contains('reveal')) return;
    el.classList.add('reveal');
    if (delay) el.style.transitionDelay = delay + 'ms';
    targets.push(el);
  };

  // グリッド系：子要素を少しずつ遅延
  document.querySelectorAll('.cards, .stats, .compare, .misuse, .chapter-grid').forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) { add(c, Math.min(i, 6) * 70); });
  });
  document.querySelectorAll('.figure .flow').forEach(function (f) {
    Array.prototype.forEach.call(f.children, function (c, i) { add(c, Math.min(i, 8) * 55); });
  });
  document.querySelectorAll('.timeline .ev').forEach(function (ev, i) { add(ev, Math.min(i, 8) * 70); });

  // 単体ブロック
  var sel = '.ch-head, .toc-mini, .reading h2, .reading h3, .lead, .callout,' +
            ' .keypoints, .reading table, .figure, .quiz-wrap .qz-h, .quiz, .task';
  document.querySelectorAll(sel).forEach(function (el) { add(el, 0); });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  targets.forEach(function (el) { io.observe(el); });
})();

/* =========================================================
   体験型レイヤー（進捗・クイズ判定・ミニ体験ウィジェット）
   localStorage に保存。すべてオフライン動作。
   ========================================================= */
(function () {
  var PKEY = 'aix_progress_v1';
  function loadP() { try { return JSON.parse(localStorage.getItem(PKEY)) || {}; } catch (e) { return {}; } }
  function saveP(p) { try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch (e) {} }
  function chId() { var m = (location.pathname.split('/').pop() || '').match(/ch(\d+)\.html/); return m ? 'ch' + m[1] : null; }
  var CH_ALL = ['ch00','ch01','ch02','ch03','ch04','ch05','ch06','ch07','ch08','ch09','ch10','ch11','ch12','ch13'];

  // ---------- クイズ：クリックで即判定・採点 ----------
  (function quiz() {
    var cid = chId(); var P = loadP();
    var quizzes = document.querySelectorAll('.quiz'); if (!quizzes.length) return;
    var total = 0, correctCount = 0, answered = 0;
    var scoreEl = null;
    var firstH = document.querySelector('.quiz-wrap .qz-h');
    if (firstH) { scoreEl = document.createElement('span'); scoreEl.className = 'qz-score'; firstH.appendChild(scoreEl); }
    function refresh() { if (scoreEl) scoreEl.textContent = '正解 ' + correctCount + ' / ' + total; }

    quizzes.forEach(function (q) {
      var opts = q.querySelectorAll('.opts li'); var ans = q.querySelector('.answer');
      if (!opts.length || !ans) return;
      var m = ans.textContent.match(/正解[:：]\s*([A-DＡ-Ｄ])/);
      if (!m) return;
      var correct = m[1].replace(/[Ａ-Ｄ]/, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); });
      total++;
      opts.forEach(function (li) {
        li.addEventListener('click', function () {
          if (q.dataset.done) return; q.dataset.done = '1';
          q.querySelector('.opts').classList.add('locked');
          var lm = li.textContent.trim().match(/^([A-DＡ-Ｄ])/); var letter = lm ? lm[1] : '';
          var right = letter === correct;
          opts.forEach(function (o) { var om = o.textContent.trim().match(/^([A-DＡ-Ｄ])/); if (om && om[1] === correct) o.classList.add('opt-correct'); });
          if (!right) li.classList.add('opt-wrong');
          ans.classList.add('show');
          var rev = q.querySelector('.reveal'); if (rev) rev.style.display = 'none';
          var fb = document.createElement('div'); fb.className = 'qz-fb ' + (right ? 'ok' : 'ng');
          fb.textContent = right ? '正解！' : 'おしい！ 正解は ' + correct;
          q.insertBefore(fb, ans);
          answered++; if (right) correctCount++; refresh();
          if (cid) { P = loadP(); P[cid] = P[cid] || {}; P[cid].quiz = { answered: answered, correct: correctCount, total: total }; saveP(P); }
        });
      });
    });
    refresh();
  })();

  // ---------- 読了マーク（最後まで来たら記録） ----------
  (function readMark() {
    var cid = chId(); if (!cid) return;
    var pager = document.querySelector('.pager'); if (!pager) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          var P = loadP(); P[cid] = P[cid] || {}; if (!P[cid].read) { P[cid].read = true; saveP(P); }
          if (!pager.dataset.marked) {
            pager.dataset.marked = '1';
            var rm = document.createElement('div'); rm.className = 'read-mark';
            rm.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 13 4 4L19 7"/></svg> この章を読了しました（目次に記録）';
            pager.parentNode.insertBefore(rm, pager);
          }
          io.disconnect();
        }
      });
    }, { threshold: 0.4 });
    io.observe(pager);
  })();

  // ---------- 目次：進捗サマリー＋カード完了チェック ----------
  (function indexProgress() {
    var grid = document.querySelector('.chapter-grid'); if (!grid) return;
    var P = loadP();
    var cards = grid.querySelectorAll('.cgcard'), read = 0;
    cards.forEach(function (c) {
      var m = (c.getAttribute('href') || '').match(/ch(\d+)\.html/); if (!m) return;
      var id = 'ch' + m[1];
      var b = document.createElement('span'); b.className = 'done-badge'; b.innerHTML = '✓'; c.appendChild(b);
      if (P[id] && P[id].read) { c.classList.add('done'); read++; }
    });
    var pct = Math.round(read / CH_ALL.length * 100);
    var sum = document.createElement('div'); sum.className = 'prog-sum';
    var badges = [[1, 'はじめの一歩'], [4, '基礎クリア'], [7, '折り返し'], [14, '全章 修了']]
      .map(function (b) { return '<span class="badge ' + (read >= b[0] ? 'on' : '') + '">' + (read >= b[0] ? '★ ' : '') + b[1] + '</span>'; }).join('');
    sum.innerHTML =
      '<div class="ph"><b>学習の進捗</b><span>' + read + ' / ' + CH_ALL.length + ' 章</span>' +
      '<button class="prog-reset">記録をリセット</button>' +
      '<span class="pct">' + pct + '%</span></div>' +
      '<div class="prog-bar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="badges">' + badges + '</div>';
    var wrap = document.querySelector('.idx-wrap');
    wrap.insertBefore(sum, grid);
    sum.querySelector('.prog-reset').addEventListener('click', function () {
      if (confirm('学習の記録（読了・クイズ成績）を消去しますか？')) { localStorage.removeItem(PKEY); location.reload(); }
    });
  })();

  // ---------- ミニ体験ウィジェット ----------
  function widgetFrame(host, tag, title) {
    host.classList.add('ixw');
    host.innerHTML = '<div class="ixh"><span class="tag">' + tag + '</span>' + title + '</div><div class="ixb"></div>';
    return host.querySelector('.ixb');
  }
  // 1) トークナイザー体験
  function buildTokenizer(host) {
    var b = widgetFrame(host, 'やってみよう', 'トークナイザー体験 ── 文を入れて分割してみよう');
    b.innerHTML = '<div class="ixrow"><input type="text" value="このあと雨は降りますか？"><button class="run">分割する</button></div><div class="tok-out"></div><div class="tok-cnt"></div><div class="hint">※ 実際のトークン化はモデルごとに異なります。これは仕組みを体感するための簡易版です。</div>';
    var inp = b.querySelector('input'), out = b.querySelector('.tok-out'), cnt = b.querySelector('.tok-cnt');
    function tok(s) { return (s.match(/[A-Za-z0-9_]+|[ぁ-ん]+|[ァ-ヴー]+|[一-龠]|[、。！？!?．，・]|[^\s]/g) || []); }
    function run() {
      out.innerHTML = ''; var ts = tok(inp.value);
      ts.forEach(function (t, i) { var s = document.createElement('span'); s.className = 'tok'; s.textContent = t; s.style.animationDelay = (i * 0.05) + 's'; out.appendChild(s); });
      cnt.innerHTML = '→ <b>' + ts.length + '</b> 個のトークンに分割されました';
    }
    b.querySelector('.run').addEventListener('click', run);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
    run();
  }
  // 2) 温度（ランダム性）スライダー
  function buildTemperature(host) {
    var b = widgetFrame(host, 'やってみよう', 'Temperature ── 「ランダムさ」を動かしてみよう');
    var words = [['晴れ', 2.6], ['雨', 2.1], ['くもり', 1.3], ['雪', 0.2], ['台風', -0.6]];
    b.innerHTML = '<div class="temp-row"><span>低い（堅実）</span><input type="range" min="0.1" max="1.5" step="0.05" value="0.7"><span>高い（奔放）</span><span class="temp-val">0.70</span></div><div class="temp-bars"></div><div class="ixrow"><button class="run">この確率で1語サンプリング</button><span class="temp-sample"></span></div><div class="hint">温度が低いほど「最有力の語」に偏り（毎回ほぼ同じ）、高いほど候補が広がります（毎回変わる＝創造的）。</div>';
    var rng = b.querySelector('input'), val = b.querySelector('.temp-val'), bars = b.querySelector('.temp-bars'), samp = b.querySelector('.temp-sample');
    function softmax(t) { t = Math.max(0.05, t); var ex = words.map(function (w) { return Math.exp(w[1] / t); }); var s = ex.reduce(function (a, c) { return a + c; }, 0); return ex.map(function (e) { return e / s; }); }
    function render() {
      var t = parseFloat(rng.value); val.textContent = t.toFixed(2); var ps = softmax(t);
      bars.innerHTML = words.map(function (w, i) { return '<div class="tb"><span class="w">' + w[0] + '</span><span class="bar"><i style="width:' + (ps[i] * 100).toFixed(1) + '%"></i></span><span class="pc">' + (ps[i] * 100).toFixed(1) + '%</span></div>'; }).join('');
    }
    function sample() { var t = parseFloat(rng.value), ps = softmax(t), r = Math.random(), a = 0, pick = words[0][0]; for (var i = 0; i < ps.length; i++) { a += ps[i]; if (r <= a) { pick = words[i][0]; break; } } samp.innerHTML = '→ 「<b>' + pick + '</b>」'; }
    rng.addEventListener('input', render); b.querySelector('.run').addEventListener('click', sample);
    render();
  }
  // 3) AI⇄人間 仕分けゲーム
  function buildSort(host) {
    var b = widgetFrame(host, 'ゲーム', 'AIに任せる？ 人間が判断？ ── 仕分けクイズ');
    var tasks = [['議事録の要約', 'ai'], ['契約内容の最終承認', 'human'], ['メールの下書き作成', 'ai'], ['採用の合否決定', 'human'], ['100言語への翻訳', 'ai'], ['クレーム対応の謝罪判断', 'human'], ['コードのたたき台生成', 'ai'], ['事業戦略の意思決定', 'human']];
    b.innerHTML = '<div class="sort-tasks"></div><div>スコア：<span class="sort-score">0</span> / ' + tasks.length + '</div>';
    var wrap = b.querySelector('.sort-tasks'), scoreEl = b.querySelector('.sort-score'), score = 0, done = 0;
    tasks.forEach(function (t) {
      var card = document.createElement('div'); card.className = 'sort-task';
      card.innerHTML = '<span class="q">' + t[0] + '</span><span class="btns"><button data-c="ai">AIに任せる</button><button data-c="human">人間が判断</button></span><span class="res"></span>';
      card.querySelectorAll('button').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (card.dataset.done) return; card.dataset.done = '1';
          var ok = btn.getAttribute('data-c') === t[1];
          card.classList.add(ok ? 'right' : 'wrong');
          card.querySelector('.res').textContent = ok ? '◎ 正解' : '× 正解は「' + (t[1] === 'ai' ? 'AIに任せる' : '人間が判断') + '」';
          card.querySelector('.res').style.color = ok ? 'var(--good)' : 'var(--bad)';
          if (ok) score++; done++; scoreEl.textContent = score;
        });
      });
      wrap.appendChild(card);
    });
  }
  var builders = { tokenizer: buildTokenizer, temperature: buildTemperature, sort: buildSort };
  document.querySelectorAll('[data-widget]').forEach(function (host) {
    var fn = builders[host.getAttribute('data-widget')]; if (fn) fn(host);
  });
})();
