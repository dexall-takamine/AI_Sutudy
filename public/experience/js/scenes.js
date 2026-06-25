/* =========================================================
   scenes.js — 10シーンの3Dオブジェクト生成・表示切替・
               毎フレームのアニメーション・自動再生タイムライン
   ========================================================= */
window.AIX = window.AIX || {};

AIX.Scenes = (function () {
  var C, col, T, G = {}, order = [];

  // ---- 2D canvas をテクスチャ化したパネル（ガラスUI風）----
  function panel(w, h, draw, scale) {
    var dpr = 2, cv = document.createElement('canvas'); cv.width = w * dpr; cv.height = h * dpr;
    var x = cv.getContext('2d'); x.scale(dpr, dpr);
    var tex = new THREE.CanvasTexture(cv); tex.anisotropy = 8;
    var mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    var sp = new THREE.Sprite(mat); var s = scale || 0.014; sp.scale.set(w * s, h * s, 1);
    sp.userData.redraw = function () { x.clearRect(0, 0, w, h); draw(x, w, h); tex.needsUpdate = true; };
    sp.userData.redraw();
    return sp;
  }
  function rrect(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
  function glassBg(x, w, h, accent) {
    rrect(x, 4, 4, w - 8, h - 8, 22);
    x.fillStyle = 'rgba(12,16,30,0.86)'; x.fill();
    x.lineWidth = 3; x.strokeStyle = accent; x.stroke();
  }
  function label2D(text, accent, sizePx) {
    return panel(360, 96, function (x, w, h) {
      x.font = '700 ' + (sizePx || 46) + 'px "Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillStyle = accent || '#36e0ff'; x.fillText(text, w / 2, h / 2);
    }, 0.016);
  }
  function hex(n) { return '#' + ('000000' + n.toString(16)).slice(-6); }

  // ---------- build all scene groups ----------
  function build() {
    C = AIX.CONFIG; col = C.color; var root = AIX.three.root;
    C.scenes.forEach(function (s) { var g = new THREE.Group(); g.visible = false; root.add(g); G[s.id] = g; order.push(s.id); });

    buildInput(G.input);
    buildToken(G.token);
    buildEmbed(G.embed);
    buildTransformer(G.transformer);
    buildAttention(G.attention);
    buildKnowledge(G.knowledge);
    buildInference(G.inference);
    buildPredict(G.predict);
    buildResponse(G.response);
    buildLog(G.log);
  }

  // ===== Scene1 入力 =====
  var streamPts;
  function buildInput(g) {
    var pnl = panel(620, 200, function (x, w, h) {
      glassBg(x, w, h, '#36e0ff');
      x.fillStyle = '#7fa8ff'; x.font = '600 22px "Hiragino Kaku Gothic ProN",sans-serif'; x.textAlign = 'left'; x.textBaseline = 'middle';
      x.fillText('You', 40, 50);
      x.fillStyle = '#eaf2ff'; x.font = '700 40px "Hiragino Kaku Gothic ProN",sans-serif';
      x.fillText('このあと雨は降りますか？', 40, 118);
    }, 0.02);
    pnl.position.set(0, 2.6, 0); g.add(pnl);
    // 光の粒（AIへ流れる）
    var n = 200, geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), seed = new Float32Array(n);
    for (var i = 0; i < n; i++) { pos[i*3]=(Math.random()-0.5)*8; pos[i*3+1]=2+Math.random()*0.6; pos[i*3+2]=(Math.random()-0.5)*1.2; seed[i]=Math.random(); }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    streamPts = new THREE.Points(geo, new THREE.PointsMaterial({ color: col.cyan, size: 0.18, transparent: true, opacity: 0.9 }));
    streamPts.userData.seed = seed; g.add(streamPts);
    var core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 1), new THREE.MeshStandardMaterial({ color: col.blue, emissive: col.blue, emissiveIntensity: 0.6, wireframe: true }));
    core.position.set(0, -2.4, 0); g.add(core); g.userData.core = core;
  }

  // ===== Scene2 トークン =====
  var tokenCubes = [];
  function buildToken(g) {
    tokenCubes = [];
    C.tokens.forEach(function (tk, i) {
      var grp = new THREE.Group();
      var cube = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.7, 1.7),
        new THREE.MeshStandardMaterial({ color: 0x10203f, emissive: col.cyan, emissiveIntensity: 0.25, metalness: 0.4, roughness: 0.3 }));
      AIX.addClickable(cube, 'token');
      grp.add(cube);
      var lab = label2D(tk, '#eaf6ff', tk.length > 2 ? 40 : 52); lab.position.set(0, 0, 0.95); lab.scale.multiplyScalar(0.9); grp.add(lab);
      grp.position.set((i - (C.tokens.length - 1) / 2) * 2.5, 0, 0);
      grp.userData.i = i; g.add(grp); tokenCubes.push(grp);
    });
  }

  // ===== Scene3 Embedding（銀河）=====
  var galaxy, wordDots = [];
  function buildEmbed(g) {
    var n = 1200, geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), c = new Float32Array(n * 3);
    var ca = new THREE.Color(col.cyan), cb = new THREE.Color(col.purple);
    for (var i = 0; i < n; i++) {
      var r = Math.pow(Math.random(), 0.6) * 9, th = Math.random() * 6.28, ph = Math.acos(2 * Math.random() - 1);
      pos[i*3]=r*Math.sin(ph)*Math.cos(th); pos[i*3+1]=r*Math.sin(ph)*Math.sin(th)*0.6; pos[i*3+2]=r*Math.cos(ph);
      var cc = ca.clone().lerp(cb, Math.random()); c[i*3]=cc.r; c[i*3+1]=cc.g; c[i*3+2]=cc.b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
    galaxy = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.13, vertexColors: true, transparent: true, opacity: 0.85 }));
    AIX.addClickable(galaxy, 'embedding'); g.add(galaxy);
    // 意味の近い語ほど近く
    var words = [['雨', [3,1,2], col.cyan], ['天気', [4.4,1.6,2.6], col.cyan], ['傘', [4.0,0.2,3.3], col.cyan], ['晴れ', [2.4,2.2,1.2], col.cyan], ['猫', [-6,-3,-4], col.pink]];
    wordDots = [];
    words.forEach(function (wd) {
      var dot = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), new THREE.MeshBasicMaterial({ color: wd[2] }));
      dot.position.fromArray(wd[1]); g.add(dot);
      var lab = label2D(wd[0], hex(wd[2]), 40); lab.scale.multiplyScalar(0.6); lab.position.set(wd[1][0], wd[1][1] + 0.7, wd[1][2]); g.add(lab);
      wordDots.push(dot);
    });
  }

  // ===== Scene4 Transformer =====
  var tfLayers = [], tfMarker;
  function buildTransformer(g) {
    tfLayers = []; var L = 6;
    for (var i = 0; i < L; i++) {
      var t = i / (L - 1);
      var cc = new THREE.Color(col.cyan).lerp(new THREE.Color(col.purple), t);
      var slab = new THREE.Mesh(new THREE.BoxGeometry(7, 0.7, 3.4),
        new THREE.MeshStandardMaterial({ color: cc, emissive: cc, emissiveIntensity: 0.25, metalness: 0.5, roughness: 0.35, transparent: true, opacity: 0.92 }));
      slab.position.y = (i - (L - 1) / 2) * 1.7;
      AIX.addClickable(slab, 'transformer'); g.add(slab); tfLayers.push(slab);
      var lab = label2D('Layer ' + (i + 1), '#bcd0ff', 34); lab.scale.multiplyScalar(0.5); lab.position.set(-4.6, slab.position.y, 1.9); g.add(lab);
    }
    tfMarker = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 20), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    g.add(tfMarker);
  }

  // ===== Scene5 Attention =====
  var attnTokens = [], attnLines = [];
  function buildAttention(g) {
    attnTokens = []; attnLines = [];
    var xs = C.tokens.map(function (_, i) { return (i - (C.tokens.length - 1) / 2) * 2.5; });
    C.tokens.forEach(function (tk, i) {
      var s = new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 24), new THREE.MeshStandardMaterial({ color: 0x12233f, emissive: col.cyan, emissiveIntensity: 0.3 }));
      s.position.set(xs[i], 0, 0); g.add(s); attnTokens.push(s);
      var lab = label2D(tk, '#dfeeff', tk.length > 2 ? 34 : 46); lab.scale.multiplyScalar(0.62); lab.position.set(xs[i], -1.1, 0); g.add(lab);
    });
    // 重要な接続（雨↔このあと 等）weight 大きいほど太い
    var pairs = [[2, 0, 1.0], [2, 1, 0.85], [4, 2, 0.7], [3, 2, 0.4], [5, 2, 0.35]];
    pairs.forEach(function (pr) {
      var a = attnTokens[pr[0]].position, b = attnTokens[pr[1]].position;
      var mid = a.clone().add(b).multiplyScalar(0.5); mid.y += 2.2;
      var curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      var tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.06, 8, false),
        new THREE.MeshBasicMaterial({ color: col.cyan, transparent: true, opacity: 0.5 }));
      tube.userData.w = pr[2]; AIX.addClickable(tube, 'attention'); g.add(tube); attnLines.push(tube);
    });
  }

  // ===== Scene6 知識ネットワーク =====
  var knNodes = [], knHot = [];
  function buildKnowledge(g) {
    knNodes = []; knHot = []; var N = 46, pos = [];
    for (var i = 0; i < N; i++) {
      var r = 2 + Math.random() * 7, th = Math.random() * 6.28, y = (Math.random() - 0.5) * 8;
      var p = new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r * 0.6); pos.push(p);
      var hot = i % 7 === 0;
      var m = new THREE.Mesh(new THREE.SphereGeometry(hot ? 0.4 : 0.22, 16, 16),
        new THREE.MeshStandardMaterial({ color: hot ? col.pink : 0x2a3a66, emissive: hot ? col.pink : col.blue, emissiveIntensity: hot ? 0.6 : 0.2 }));
      m.position.copy(p); AIX.addClickable(m, 'knowledge'); g.add(m); knNodes.push(m); if (hot) knHot.push(m);
    }
    // 近いノードを線で接続
    var lp = [];
    for (var a = 0; a < N; a++) for (var b = a + 1; b < N; b++) if (pos[a].distanceTo(pos[b]) < 3.2 && Math.random() < 0.5) { lp.push(pos[a].x,pos[a].y,pos[a].z, pos[b].x,pos[b].y,pos[b].z); }
    var lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    g.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: col.blue, transparent: true, opacity: 0.22 })));
  }

  // ===== Scene7 推論 =====
  var infCore, infRings = [], infInputs = [];
  function buildInference(g) {
    infCore = new THREE.Mesh(new THREE.IcosahedronGeometry(2, 1), new THREE.MeshStandardMaterial({ color: col.purple, emissive: col.purple, emissiveIntensity: 0.6, wireframe: true }));
    AIX.addClickable(infCore, 'inference'); g.add(infCore);
    infRings = [];
    [[2.8, col.cyan, 0], [3.4, col.pink, Math.PI / 3]].forEach(function (r) {
      var ring = new THREE.Mesh(new THREE.TorusGeometry(r[0], 0.06, 12, 80), new THREE.MeshBasicMaterial({ color: r[1] }));
      ring.rotation.x = r[2]; g.add(ring); infRings.push(ring);
    });
    infInputs = [];
    [['天気', 0], ['現在時刻', 1], ['場所', 2], ['質問意図', 3]].forEach(function (it) {
      var ang = it[1] / 4 * 6.28; var p = new THREE.Vector3(Math.cos(ang) * 6, Math.sin(ang) * 4, 0);
      var lab = label2D(it[0], '#cfe0ff', 36); lab.scale.multiplyScalar(0.6); lab.position.copy(p); lab.userData.home = p.clone(); g.add(lab); infInputs.push(lab);
    });
  }

  // ===== Scene8 単語予測 =====
  var predPanel;
  function buildPredict(g) {
    predPanel = panel(720, 300, function (x, w, h) {
      glassBg(x, w, h, '#9a6bff');
      x.fillStyle = '#b79aff'; x.font = '600 20px "Hiragino Kaku Gothic ProN",sans-serif'; x.textAlign = 'left'; x.textBaseline = 'top';
      x.fillText('生成中（1トークンずつ）', 36, 30);
      var full = AIX.CONFIG.answer;
      var steps = ['', '今', '今日は', '今日は雨', '今日は雨が降る', '今日は雨が降る可能性', full];
      var sc = AIX.state.sceneClock; var idx = Math.min(steps.length - 1, Math.floor(sc / 0.7));
      x.fillStyle = '#eef2ff'; x.font = '700 38px "Hiragino Kaku Gothic ProN",sans-serif';
      wrap(x, steps[idx] + (idx < steps.length - 1 && Math.floor(sc * 2) % 2 ? '｜' : ''), 36, 90, w - 72, 50);
    }, 0.018);
    predPanel.position.set(0, 0, 0); g.add(predPanel);
  }
  function wrap(x, text, px, py, maxw, lh) {
    var line = '', y = py;
    for (var i = 0; i < text.length; i++) { var test = line + text[i]; if (x.measureText(test).width > maxw) { x.fillText(line, px, y); line = text[i]; y += lh; } else line = test; }
    x.fillText(line, px, y);
  }

  // ===== Scene9 返却 =====
  var respChat, respBeam;
  function buildResponse(g) {
    respChat = panel(560, 240, function (x, w, h) {
      glassBg(x, w, h, '#36e0ff');
      x.fillStyle = '#7fa8ff'; x.font = '600 20px "Hiragino Kaku Gothic ProN",sans-serif'; x.textAlign = 'left'; x.textBaseline = 'top';
      x.fillText('AI', 34, 28);
      var sc = AIX.state.sceneClock, rev = Math.min(1, Math.max(0, (sc - 0.8) / 1.6));
      var ans = AIX.CONFIG.answer.slice(0, Math.floor(rev * AIX.CONFIG.answer.length));
      x.fillStyle = '#eef6ff'; x.font = '700 34px "Hiragino Kaku Gothic ProN",sans-serif';
      wrap(x, ans, 34, 80, w - 68, 46);
    }, 0.02);
    respChat.position.set(3.6, 0.5, 0); g.add(respChat);
    var src = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, 1), new THREE.MeshStandardMaterial({ color: col.purple, emissive: col.purple, emissiveIntensity: 0.6, wireframe: true }));
    src.position.set(-4.5, 0.5, 0); g.add(src);
    respBeam = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    g.add(respBeam); g.userData.from = new THREE.Vector3(-4.5, 0.5, 0); g.userData.to = new THREE.Vector3(1.2, 0.5, 0);
  }

  // ===== Scene10 ログ =====
  var logPanel;
  function buildLog(g) {
    var items = ['Tokenization', 'Embedding', 'Transformer', 'Attention', 'Knowledge', 'Inference', 'Token Prediction', 'Response'];
    logPanel = panel(620, 460, function (x, w, h) {
      glassBg(x, w, h, '#36e0ff');
      x.fillStyle = '#eaf2ff'; x.font = '700 30px "Hiragino Kaku Gothic ProN",sans-serif'; x.textAlign = 'left'; x.textBaseline = 'middle';
      x.fillText('AI内部では以下が実行されました', 36, 46);
      var sc = AIX.state.sceneClock;
      items.forEach(function (it, i) {
        var on = sc > 0.5 + i * 0.35; var y = 110 + i * 42;
        x.fillStyle = on ? '#36e0ff' : '#39507f';
        x.font = '700 26px sans-serif'; x.fillText(on ? '✔' : '▫', 40, y);
        x.fillStyle = on ? '#eaf2ff' : '#5a6a90'; x.font = '600 24px "Hiragino Kaku Gothic ProN",sans-serif';
        x.fillText(it, 80, y);
      });
    }, 0.018);
    g.add(logPanel);
  }

  // ---------- show / update ----------
  function show(idx) {
    var id = order[idx];
    order.forEach(function (k) { G[k].visible = (k === id); });
    // 軽い登場演出
    if (window.gsap) { var g = G[id]; g.scale.set(0.9, 0.9, 0.9); gsap.to(g.scale, { x: 1, y: 1, z: 1, duration: 0.7, ease: 'back.out(1.6)', overwrite: true }); }
  }

  function update(dt) {
    var id = order[AIX.state.current], k = AIX.state.clock, sc = AIX.state.sceneClock;
    if (id === 'input' && streamPts) {
      var p = streamPts.geometry.attributes.position, sd = streamPts.userData.seed;
      for (var i = 0; i < sd.length; i++) { p.array[i*3+1] -= dt * (1.2 + sd[i]); if (p.array[i*3+1] < -2.4) p.array[i*3+1] = 2.4; }
      p.needsUpdate = true; if (G.input.userData.core) G.input.userData.core.rotation.y += dt * 0.8;
    }
    if (id === 'token') tokenCubes.forEach(function (g, i) { g.children[0].rotation.y += dt * 0.6; g.position.y = Math.sin(k * 1.5 + i) * 0.18; });
    if (id === 'embed' && galaxy) { galaxy.rotation.y += dt * 0.12; galaxy.rotation.x += dt * 0.03; }
    if (id === 'transformer') {
      var L = tfLayers.length; var fy = (Math.sin(sc * 0.9) * 0.5 + 0.5) * (L - 1);
      tfMarker.position.set(0, (fy - (L - 1) / 2) * 1.7, 1.9);
      tfLayers.forEach(function (s, i) { s.material.emissiveIntensity = 0.2 + Math.max(0, 1 - Math.abs(i - fy)) * 0.7; });
    }
    if (id === 'attention') attnLines.forEach(function (t, i) { var w = t.userData.w * (0.55 + 0.45 * Math.sin(k * 2 + i)); t.material.opacity = 0.3 + 0.6 * w; t.scale.set(1, 1, 1); t.scale.setScalar(0.6 + w); });
    if (id === 'knowledge') knHot.forEach(function (m, i) { m.material.emissiveIntensity = 0.4 + 0.5 * (0.5 + 0.5 * Math.sin(k * 3 + i)); });
    if (id === 'inference') { infCore.rotation.y += dt * 0.5; infCore.rotation.x += dt * 0.2; infRings[0].rotation.z += dt * 0.6; infRings[1].rotation.z -= dt * 0.4; infInputs.forEach(function (l, i) { var hp = l.userData.home; var f = 0.5 + 0.5 * Math.sin(sc * 1.2 + i); l.position.lerpVectors(hp, new THREE.Vector3(0, 0, 0), 0.35 * f); }); }
    if (id === 'predict' && predPanel) predPanel.userData.redraw();
    if (id === 'response' && respBeam) { var pr = (sc * 0.6) % 1; respBeam.position.lerpVectors(G.response.userData.from, G.response.userData.to, pr); respChat.userData.redraw(); }
    if (id === 'log' && logPanel) logPanel.userData.redraw();
  }

  return { build: build, show: show, update: update };
})();

/* ---------------- 自動再生タイムライン（GSAP） ---------------- */
AIX.Timeline = (function () {
  var tl, times = [];
  function build() {
    var t = 0; times = [];
    tl = gsap.timeline({ repeat: -1, paused: false, onUpdate: function () { if (AIX.UI.onProgress) AIX.UI.onProgress(tl.progress()); } });
    AIX.CONFIG.scenes.forEach(function (s, i) { times.push(t); tl.call(function () { AIX.setScene(i); }, null, t); tl.to({}, { duration: s.dur }, t); t += s.dur; });
    AIX.Timeline.tl = tl;
  }
  function play() { AIX.state.playing = true; tl.play(); }
  function pause() { AIX.state.playing = false; tl.pause(); }
  function toggle() { tl.paused() ? play() : pause(); return !tl.paused(); }
  function speed(v) { AIX.state.speed = v; tl.timeScale(v); }
  function goto(i) { AIX.setScene(i); tl.pause(); tl.seek(times[i] + 0.001, true); if (AIX.state.playing) tl.play(); }
  function next() { goto((AIX.state.current + 1) % times.length); }
  function prev() { goto((AIX.state.current - 1 + times.length) % times.length); }
  return { build: build, play: play, pause: pause, toggle: toggle, speed: speed, goto: goto, next: next, prev: prev };
})();
