/* =========================================================
   ui.js — HUD（ステータス・処理フロー・解説・コントロール）
           DOMを動的生成し、Three側(AIX.Timeline)と連携
   ========================================================= */
window.AIX = window.AIX || {};

AIX.UI = (function () {
  var el = {};            // 主要DOM参照
  var C;

  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  function init() {
    C = AIX.CONFIG;
    var ui = document.getElementById('ui');

    // ---- 右上：ステータス ----
    var stat = h('div', 'hud stat');
    stat.innerHTML =
      '<div class="stat-row"><span>現在処理中</span><b id="s-proc">—</b></div>' +
      '<div class="stat-grid">' +
      '<div><span>Tokens</span><b id="s-tok">0</b></div>' +
      '<div><span>Layers</span><b id="s-lay">0</b></div>' +
      '<div><span>Attention</span><b id="s-att">0</b></div>' +
      '<div><span>推論時間</span><b id="s-time">0.0s</b></div>' +
      '</div>' +
      '<div class="stat-row"><span>Model</span><b id="s-model">' + C.modelName + '</b></div>';
    ui.appendChild(stat);

    // ---- 左：処理フロー ----
    var flow = h('div', 'hud flow');
    flow.innerHTML = '<div class="flow-h">処理フロー</div>';
    var list = h('div', 'flow-list');
    C.scenes.forEach(function (s, i) {
      var it = h('button', 'flow-item');
      it.innerHTML = '<span class="fno">' + String(s.no).padStart(2, '0') + '</span><span class="ft"><b>' + s.title.replace(/^[①-⑩]\s*/, '') + '</b><small>' + s.sub + '</small></span>';
      it.addEventListener('click', function () { AIX.Timeline.goto(i); });
      list.appendChild(it);
    });
    flow.appendChild(list); ui.appendChild(flow);
    el.flowItems = list.querySelectorAll('.flow-item');

    // ---- 右下：解説パネル ----
    var exp = h('div', 'hud explain');
    exp.innerHTML = '<div class="ex-sub" id="e-sub"></div><div class="ex-title" id="e-title"></div><p class="ex-desc" id="e-desc"></p><div class="ex-hint">オブジェクトをクリックすると用語の解説が出ます</div>';
    ui.appendChild(exp);

    // ---- 下：進捗＋コントロール ----
    var bar = h('div', 'hud controls');
    bar.innerHTML =
      '<div class="progress"><i id="p-fill"></i></div>' +
      '<div class="ctl-row">' +
      '<button id="c-prev" title="前のシーン">⏮</button>' +
      '<button id="c-play" title="再生／一時停止">⏸</button>' +
      '<button id="c-next" title="次のシーン">⏭</button>' +
      '<span class="c-scene" id="c-scene">Scene 01 / 10</span>' +
      '<span class="c-spacer"></span>' +
      '<label class="c-speed">速度' +
      '<select id="c-spd"><option value="0.5">0.5x</option><option value="1" selected>1x</option><option value="1.5">1.5x</option><option value="2">2x</option></select>' +
      '</label></div>';
    ui.appendChild(bar);

    // ---- 用語モーダル ----
    var modal = h('div', 'gloss-modal'); modal.id = 'gloss';
    modal.innerHTML = '<div class="gloss-card"><button class="gloss-x" id="g-x">×</button><h3 id="g-t"></h3><p id="g-d"></p></div>';
    ui.appendChild(modal);

    // 参照
    el.proc = ui.querySelector('#s-proc'); el.tok = ui.querySelector('#s-tok'); el.lay = ui.querySelector('#s-lay');
    el.att = ui.querySelector('#s-att'); el.time = ui.querySelector('#s-time');
    el.eSub = ui.querySelector('#e-sub'); el.eTitle = ui.querySelector('#e-title'); el.eDesc = ui.querySelector('#e-desc');
    el.pFill = ui.querySelector('#p-fill'); el.play = ui.querySelector('#c-play'); el.cScene = ui.querySelector('#c-scene');
    el.gloss = modal; el.gT = ui.querySelector('#g-t'); el.gD = ui.querySelector('#g-d');

    // イベント
    el.play.addEventListener('click', function () { var playing = AIX.Timeline.toggle(); el.play.textContent = playing ? '⏸' : '▶'; });
    ui.querySelector('#c-prev').addEventListener('click', function () { AIX.Timeline.prev(); });
    ui.querySelector('#c-next').addEventListener('click', function () { AIX.Timeline.next(); });
    ui.querySelector('#c-spd').addEventListener('change', function (e) { AIX.Timeline.speed(parseFloat(e.target.value)); });
    ui.querySelector('#g-x').addEventListener('click', hideGlossary);
    modal.addEventListener('click', function (e) { if (e.target === modal) hideGlossary(); });

    el.tok.textContent = C.tokens.length; el.lay.textContent = C.layers; el.att.textContent = 5;
  }

  function onScene(idx) {
    var s = C.scenes[idx];
    el.proc.textContent = s.proc;
    el.eSub.textContent = s.sub;
    el.eTitle.textContent = s.title;
    el.eDesc.textContent = s.desc;
    el.cScene.textContent = 'Scene ' + String(s.no).padStart(2, '0') + ' / ' + C.scenes.length;
    for (var i = 0; i < el.flowItems.length; i++) el.flowItems[i].classList.toggle('active', i === idx);
    // 統計の出方を段階的に
    el.tok.textContent = idx >= 1 ? C.tokens.length : 0;
    el.lay.textContent = idx >= 3 ? C.layers : 0;
    el.att.textContent = idx >= 4 ? 5 : 0;
  }

  function onProgress(p) { if (el.pFill) el.pFill.style.width = (p * 100).toFixed(1) + '%'; }

  function tick() { if (el.time) el.time.textContent = (AIX.state.clock).toFixed(1) + 's'; }

  function showGlossary(key) {
    var g = C.glossary[key]; if (!g) return;
    el.gT.textContent = g.t; el.gD.textContent = g.d; el.gloss.classList.add('show');
  }
  function hideGlossary() { el.gloss.classList.remove('show'); }

  return { init: init, onScene: onScene, onProgress: onProgress, tick: tick, showGlossary: showGlossary };
})();
