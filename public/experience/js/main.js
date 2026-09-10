/* =========================================================
   main.js — Three.js 基盤（描画・カメラ・操作・ループ・起動）
   ========================================================= */
window.AIX = window.AIX || {};

AIX.three = {};                 // scene/camera/renderer など
AIX.state = { current: 0, clock: 0, sceneClock: 0, playing: true, speed: 1 };

AIX.boot = function () {
  var C = AIX.CONFIG, col = C.color;
  var mount = document.getElementById('stage');
  var W = mount.clientWidth, H = mount.clientHeight;

  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(W, H);
  mount.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(col.bg);
  scene.fog = new THREE.FogExp2(col.bg, 0.018);

  var camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 400);
  camera.position.set(0, 0, 26);

  // 照明
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  var key = new THREE.DirectionalLight(0xffffff, 0.7); key.position.set(6, 10, 14); scene.add(key);
  var p1 = new THREE.PointLight(col.cyan, 0.8, 120); p1.position.set(-18, 6, 10); scene.add(p1);
  var p2 = new THREE.PointLight(col.purple, 0.8, 120); p2.position.set(18, -6, 10); scene.add(p2);

  // 背景の星（宇宙感）
  var starGeo = new THREE.BufferGeometry(), sN = 1400, sp = new Float32Array(sN * 3);
  for (var i = 0; i < sN; i++) { var r = 60 + Math.random() * 120; var th = Math.random() * 6.28, ph = Math.acos(2 * Math.random() - 1); sp[i*3] = r*Math.sin(ph)*Math.cos(th); sp[i*3+1] = r*Math.sin(ph)*Math.sin(th); sp[i*3+2] = r*Math.cos(ph); }
  starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  var stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x9fb4ff, size: 0.5, transparent: true, opacity: 0.7 }));
  scene.add(stars);

  var root = new THREE.Group(); scene.add(root);

  AIX.three = { renderer: renderer, scene: scene, camera: camera, root: root, stars: stars, mount: mount };

  // ---------- 操作：ドラッグ回転・ホイールズーム ----------
  var view = { rx: 0, ry: 0 };           // シーンが設定する基準角（GSAPで動かす）
  var uRx = 0, uRy = 0, drag = false, lx = 0, ly = 0, zoom = 26;
  AIX.view = view;
  mount.style.cursor = 'grab';
  mount.addEventListener('pointerdown', function (e) { drag = true; lx = e.clientX; ly = e.clientY; mount.style.cursor = 'grabbing'; });
  window.addEventListener('pointerup', function () { drag = false; mount.style.cursor = 'grab'; });
  window.addEventListener('pointermove', function (e) {
    if (!drag) return;
    uRy += (e.clientX - lx) * 0.005; uRx += (e.clientY - ly) * 0.004;
    uRx = Math.max(-0.7, Math.min(0.7, uRx)); lx = e.clientX; ly = e.clientY;
  });
  mount.addEventListener('wheel', function (e) { e.preventDefault(); zoom = Math.max(12, Math.min(40, zoom + (e.deltaY > 0 ? 1.5 : -1.5))); }, { passive: false });

  // ---------- クリックで用語解説 ----------
  var ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), clickables = [];
  AIX.addClickable = function (obj, key) { obj.userData.glossary = key; clickables.push(obj); };
  AIX.clearClickables = function () { clickables.length = 0; };
  renderer.domElement.addEventListener('click', function (e) {
    var r = renderer.domElement.getBoundingClientRect();
    ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(ptr, camera);
    var hit = ray.intersectObjects(clickables, true);
    if (hit.length) {
      var o = hit[0].object; while (o && !o.userData.glossary) o = o.parent;
      if (o && AIX.CONFIG.glossary[o.userData.glossary]) AIX.UI.showGlossary(o.userData.glossary);
    }
  });

  // ---------- 起動 ----------
  AIX.Scenes.build();
  AIX.UI.init();
  AIX.Timeline.build();         // 自動再生タイムライン
  AIX.setScene(0, true);

  // ---------- ループ ----------
  var last = 0;
  function animate(ms) {
    requestAnimationFrame(animate);
    var t = ms / 1000, dt = Math.min(0.05, t - last || 0); last = t;
    if (AIX.state.playing) { AIX.state.clock += dt * AIX.state.speed; AIX.state.sceneClock += dt * AIX.state.speed; }
    // 視点
    camera.position.z += (zoom - camera.position.z) * 0.1;
    root.rotation.y += ((view.ry + uRy) - root.rotation.y) * 0.08;
    root.rotation.x += ((view.rx + uRx) - root.rotation.x) * 0.08;
    stars.rotation.y += dt * 0.01;
    AIX.Scenes.update(dt);
    AIX.UI.tick();
    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);

  window.addEventListener('resize', function () {
    var w = mount.clientWidth, h = mount.clientHeight; if (!w || !h) return;
    camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
  });
};

/* シーン切替：表示制御＋UI更新＋GSAPで基準視点を変更 */
AIX.setScene = function (idx, instant) {
  var n = AIX.CONFIG.scenes.length;
  idx = (idx + n) % n;
  AIX.state.current = idx;
  AIX.state.sceneClock = 0;
  AIX.Scenes.show(idx);                 // 3D表示切替
  AIX.UI.onScene(idx);                  // UI更新
  var ang = [0, 0.1, -0.05, 0.05, 0, -0.08, 0.06, 0, 0.04, -0.05];
  var ry = ang[idx] || 0;
  if (window.gsap && !instant) gsap.to(AIX.view, { ry: ry, rx: 0.05, duration: 1.0, ease: 'power2.out', overwrite: true });
  else { AIX.view.ry = ry; AIX.view.rx = 0.05; }
};

window.addEventListener('load', function () { if (AIX.boot) AIX.boot(); });
