/* 「指示→内部処理→回答」3Dモデル (three.js UMD / 自己完結)
   ・2×3グリッドで全6カードを一度に表示
   ・各カードの中身を毎フレーム再描画してアニメーション
   ・光の粒がパイプラインを流れる／ドラッグ回転・ホイールズーム      */
(function () {
  var mount = document.getElementById('flow3d');
  if (!mount || typeof THREE === 'undefined') return;

  var W = mount.clientWidth || 1000, H = mount.clientHeight || 720;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x15101f);
  var camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 200);
  camera.position.set(0, 0.4, 30);

  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(W, H);
  mount.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  var dir = new THREE.DirectionalLight(0xffffff, 0.6); dir.position.set(4, 8, 12); scene.add(dir);
  var grp = new THREE.Group(); scene.add(grp);

  // ---------- 2D helpers (logical 620x380) ----------
  var AC = '#6a4c93', AC2 = '#8a63c6', GR = '#2f7d4f';
  function rr(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
  function chip(x, cx, cy, w, h, text, fill, stroke, tcol, fs) {
    rr(x, cx, cy, w, h, 12); x.fillStyle = fill; x.fill();
    if (stroke) { x.lineWidth = 3; x.strokeStyle = stroke; x.stroke(); }
    if (text) { x.fillStyle = tcol; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = '700 ' + (fs || 30) + 'px "Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif';
      x.fillText(text, cx + w / 2, cy + h / 2 + 1); }
  }
  function txt(x, s, px, py, fs, col, bold, align) {
    x.fillStyle = col; x.textAlign = align || 'left'; x.textBaseline = 'middle';
    x.font = (bold ? '700 ' : '500 ') + fs + 'px "Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif';
    x.fillText(s, px, py);
  }
  function frame(x, title, accent) {
    x.clearRect(0, 0, 620, 380);
    x.fillStyle = '#ffffff'; rr(x, 6, 6, 608, 368, 26); x.fill();
    x.lineWidth = 5; x.strokeStyle = accent; x.stroke();
    x.fillStyle = accent; rr(x, 6, 6, 608, 70, 26); x.fill(); x.fillRect(6, 50, 608, 26);
    txt(x, title, 30, 44, 34, '#fff', true);
  }
  function typed(s, clock, cyc, hold) { // タイピング演出
    var p = (clock % cyc) / cyc, rev = Math.min(1, p / (1 - hold));
    return s.slice(0, Math.floor(rev * s.length)) + (Math.floor(clock * 2) % 2 && rev < 1 ? '｜' : '');
  }

  // ---------- card factory ----------
  function makeCard(title, accent, body) {
    var c = document.createElement('canvas'); c.width = 930; c.height = 570;
    var ctx = c.getContext('2d'); ctx.scale(1.5, 1.5);
    var tex = new THREE.CanvasTexture(c); tex.anisotropy = 8;
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    var BW = 8.4; sp.scale.set(BW, BW * 380 / 620, 1);
    return { sprite: sp, tex: tex, base: BW, redraw: function (clock) { frame(ctx, title, accent); body(ctx, clock); tex.needsUpdate = true; } };
  }

  // ---------- 6 stages (grid: 上段L→R, 下段R→L でスネーク) ----------
  var stages = [
    { p: [-10, 5.4, 1], card: makeCard('指示', AC, function (x, t) {
        chip(x, 40, 150, 540, 96, null, '#f3eefb', AC, '#000');
        txt(x, typed('「猫が魚を食べた」の続きを書いて', t, 4.5, 0.45), 64, 198, 28, '#3a3055', true);
        txt(x, 'あなたのプロンプト', 40, 312, 24, '#8a73b8');
      }) },
    { p: [0, 5.4, -1], card: makeCard('①トークン分割', AC2, function (x, t) {
        txt(x, '文を、意味のある小さな単位へ', 30, 112, 24, '#8a73b8');
        var toks = ['猫', 'が', '魚', 'を', '食べ', 'た'], cx = 34, cyc = 4.2;
        for (var i = 0; i < toks.length; i++) {
          var w = toks[i].length > 1 ? 96 : 66;
          var ap = Math.min(1, Math.max(0, ((t % cyc) - i * 0.45) / 0.35)); // 順に出現
          if (ap > 0) {
            x.save(); x.globalAlpha = ap;
            var sc = 0.8 + 0.2 * ap, ww = w * sc, hh = 80 * sc;
            chip(x, cx + (w - ww) / 2, 156 + (80 - hh) / 2, ww, hh, toks[i], '#f3eefb', AC, '#4c3470', 36 * sc);
            x.restore();
          }
          cx += w + 12;
        }
        txt(x, '6個のトークンに分割', 30, 312, 24, '#8a73b8');
      }) },
    { p: [10, 5.4, 1], card: makeCard('②ベクトル化', AC2, function (x, t) {
        txt(x, '意味を「数字の並び」に変換', 30, 110, 23, '#8a73b8');
        chip(x, 34, 150, 84, 66, '猫', '#f3eefb', AC, '#4c3470', 32);
        txt(x, '→', 132, 183, 38, AC, true);
        var v = ['0.82', '-0.41', '0.13', '0.67', '-0.05'], cx = 178;
        for (var i = 0; i < v.length; i++) {
          chip(x, cx, 152, 80, 50, v[i], '#efe9f7', null, '#4c3470', 22);
          // 動く棒（数値が計算されている様子）
          var h = 18 + 52 * (0.5 + 0.5 * Math.sin(t * 3 + i * 0.9));
          var bx = cx + 34;
          x.fillStyle = '#e3d9f3'; rr(x, bx, 222, 16, 74, 5); x.fill();
          x.fillStyle = AC; rr(x, bx, 296 - h, 16, h, 5); x.fill();
          cx += 86;
        }
        txt(x, '近い意味の語ほど数字も近い', 30, 326, 22, '#8a73b8');
      }) },
    { p: [10, -5.4, 1], card: makeCard('③文脈を解析', AC, function (x, t) {
        txt(x, 'Transformer / Attention：語の関係を計算', 30, 110, 22, '#8a73b8');
        var toks = ['猫', 'が', '魚', 'を', '食べ', 'た'], xs = [70, 158, 246, 334, 430, 540];
        var arcs = [[70, 430], [246, 430], [158, 540]];
        x.lineWidth = 5;
        for (var k = 0; k < arcs.length; k++) {
          var o = 0.2 + 0.75 * (0.5 + 0.5 * Math.sin(t * 2.2 - k * 1.3));
          x.strokeStyle = 'rgba(138,99,198,' + o.toFixed(2) + ')';
          x.beginPath(); x.moveTo(arcs[k][0], 256); x.quadraticCurveTo((arcs[k][0] + arcs[k][1]) / 2, 150 - k * 14, arcs[k][1], 256); x.stroke();
        }
        for (var i = 0; i < toks.length; i++) txt(x, toks[i], xs[i], 280, 30, '#4c3470', true, 'center');
        txt(x, '「食べ」は「猫」「魚」と関係が深い', 30, 336, 22, '#8a73b8');
      }) },
    { p: [0, -5.4, -1], card: makeCard('④次の語を予測', AC2, function (x, t) {
        txt(x, '続きに来る語を確率で評価', 30, 110, 23, '#8a73b8');
        var rows = [['。（句点）', 0.78, true], ['あと', 0.12, false], ['そして', 0.07, false]];
        var g = Math.min(1, (t % 3.4) / 1.6), y = 152;  // バーが伸びる
        for (var i = 0; i < rows.length; i++) {
          txt(x, rows[i][0], 36, y + 22, 24, rows[i][2] ? GR : '#4c3470', true);
          rr(x, 200, y, 330, 38, 19); x.fillStyle = '#f0ebe1'; x.fill();
          rr(x, 200, y, 330 * rows[i][1] * g, 38, 19); x.fillStyle = rows[i][2] ? GR : AC2; x.fill();
          txt(x, Math.round(rows[i][1] * 100 * g) + '%', 590, y + 20, 22, '#6a6270', false, 'right');
          y += 62;
        }
      }) },
    { p: [-10, -5.4, 1], card: makeCard('回答を生成', GR, function (x, t) {
        txt(x, '選んだ語をつなげ、1語ずつ出力', 30, 112, 24, '#5a8a6e');
        chip(x, 40, 156, 540, 96, null, '#e6f0e9', GR, '#000');
        txt(x, typed('猫が魚を食べた。', t, 4.5, 0.5), 70, 204, 34, '#1f5638', true);
        txt(x, 'くり返して文章になる', 40, 318, 24, '#5a8a6e');
      }) },
  ];

  var glowTex = (function () {
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var g = c.getContext('2d'); var rad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    rad.addColorStop(0, 'rgba(201,164,239,.9)'); rad.addColorStop(1, 'rgba(201,164,239,0)');
    g.fillStyle = rad; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
  })();

  var cards = [], glows = [], pts = [];
  stages.forEach(function (st) {
    var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0, depthWrite: false }));
    glow.scale.set(11, 7, 1); glow.position.set(st.p[0], st.p[1], st.p[2] - 0.3);
    grp.add(glow); glows.push(glow);
    st.card.sprite.position.set(st.p[0], st.p[1], st.p[2]);
    grp.add(st.card.sprite); cards.push(st.card);
    pts.push(new THREE.Vector3(st.p[0], st.p[1], st.p[2]));
  });

  var curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.3);
  grp.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 220, 0.07, 8, false),
    new THREE.MeshBasicMaterial({ color: 0x9a7bcf, transparent: true, opacity: 0.5 })));
  var pulse = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 18), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  var halo = new THREE.Mesh(new THREE.SphereGeometry(0.6, 18, 18), new THREE.MeshBasicMaterial({ color: 0xc9a4ef, transparent: true, opacity: 0.4 }));
  grp.add(pulse); grp.add(halo);
  var plight = new THREE.PointLight(0xd8c9f0, 1.3, 18); grp.add(plight);

  // ---------- interaction ----------
  var dragging = false, lx = 0, ly = 0;
  var rotY = -0.06, rotX = 0.04, tRotY = rotY, tRotX = rotX;
  mount.style.cursor = 'grab';
  mount.addEventListener('pointerdown', function (e) { dragging = true; lx = e.clientX; ly = e.clientY; mount.style.cursor = 'grabbing'; });
  window.addEventListener('pointerup', function () { dragging = false; mount.style.cursor = 'grab'; });
  window.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    tRotY += (e.clientX - lx) * 0.006; tRotX += (e.clientY - ly) * 0.004;
    tRotX = Math.max(-0.5, Math.min(0.5, tRotX)); lx = e.clientX; ly = e.clientY;
  });
  mount.addEventListener('wheel', function (e) { e.preventDefault(); camera.position.z = Math.max(18, Math.min(46, camera.position.z + (e.deltaY > 0 ? 1.4 : -1.4))); }, { passive: false });

  // ---------- animate ----------
  var t = 0, clock = 0, n = stages.length, fr = 0;
  function tick() {
    requestAnimationFrame(tick);
    t += 0.0013; if (t > 1) t -= 1; clock += 0.016; fr++;
    rotY += (tRotY - rotY) * 0.1; rotX += (tRotX - rotX) * 0.1;
    grp.rotation.y = rotY; grp.rotation.x = rotX;

    var pos = curve.getPointAt(t);
    pulse.position.copy(pos); halo.position.copy(pos); plight.position.copy(pos);
    var hs = 1 + Math.sin(clock * 8) * 0.15; halo.scale.set(hs, hs, hs);

    for (var i = 0; i < n; i++) {
      var ti = i / (n - 1), d = Math.abs(t - ti); d = Math.min(d, 1 - d);
      var gl = Math.max(0, 1 - d * 6);
      glows[i].material.opacity = gl * 0.85;
      var s = 1 + gl * 0.05, b = cards[i].base; cards[i].sprite.scale.set(b * s, b * 380 / 620 * s, 1);
    }
    if (fr % 2 === 0) for (var j = 0; j < n; j++) cards[j].redraw(clock); // 中身アニメ（隔フレーム）
    renderer.render(scene, camera);
  }
  tick();

  function resize() { var w = mount.clientWidth, h = mount.clientHeight; if (!w || !h) return; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); }
  window.addEventListener('resize', resize);
})();
