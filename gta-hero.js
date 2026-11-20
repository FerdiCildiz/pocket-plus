/* GTA VI lansman sayfası: hero'daki uygulama penceresinde sahte imleç GTA VI çipine tıklar, panel açılır (Pocket 3 yerinde kalır).
   Ardından Wasted / Busted / Respect karoları tıklanabilir: her biri görüntü alanında kendi klibini oynatır (assets/gta/clip-*.mp4). */
(function () {
  'use strict';
  var win = document.getElementById('gtaWin');
  var chip = document.getElementById('gtaChip'), panel = document.getElementById('gtaPanel');
  if (!win || !chip || !panel) return;
  var screen = document.getElementById('gtaScreen');
  var tilesBox = panel.querySelector('.gp-tiles'), tiles = [].slice.call(panel.querySelectorAll('.gp-tile'));
  
  var soundOn = false;   // ses düğmesi
  var START = 0;   // klipler baştan sona tam oynar
  var clips = {};
  [].forEach.call(screen.querySelectorAll('.clip'), function (v) { clips[v.getAttribute('data-kind')] = v; });
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var timers = [], opened = false, demoDone = false, demoRunning = false, cur = null, curAnim = null, cx = 790, cy = 300;
  var TIP = { x: 3.1, y: 2.3 };   // imleç okunun ucu (svg içinde)

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function stopTimers() { timers.forEach(clearTimeout); timers = []; }

  // Çipin pencere içindeki merkezi (doğal 1200 pt ölçeğinde; animasyon dönüşümlerinden etkilenmez)
  function chipCenter() {
    var group = chip.offsetParent, bar = group.offsetParent;
    return {
      x: group.offsetLeft + chip.offsetLeft + chip.offsetWidth / 2,
      y: bar.offsetTop + group.offsetTop - group.offsetHeight / 2 + chip.offsetTop + chip.offsetHeight / 2
    };
  }

  function setOpen(on) {
    opened = on;
    win.classList.toggle('gta-open', on);
    chip.setAttribute('aria-expanded', on ? 'true' : 'false');
    if (on) {
      panel.style.setProperty('--nx', (chipCenter().x - panel.offsetLeft) + 'px');
      Object.keys(clips).forEach(function (k) { clips[k].preload = 'auto'; });
    }
  }
  function cancelDemo() { demoDone = true; demoRunning = false; stopTimers(); }

  // Sahte imleç yok: GTA VI modu hemen açılır, Wasted oynamaya başlar; kullanıcı dokunmazsa klipler sırayla döner (arayüz hiç boş kalmaz).
  var ORDER = ['busted', 'wasted', 'respect'], HOLD = 9000;
  function nextClip(i) {
    if (!demoRunning) return;
    pick(ORDER[i % ORDER.length], true);   // sıradaki klip, bu klip bitince ('ended') başlar
  }
  function runDemo() {
    if (demoDone) return; demoDone = true; demoRunning = true;
    setOpen(true);
    later(function () { nextClip(0); }, 350);
  }

  // Kayıt düğmesinin yanındaki sayaç: oynayan klibin kalan süresini 15'ten 0'a sayar (izleyen sona kadar beklesin)
  var recT = win.querySelector('.rec-pill span');
  function fmt(sec) { sec = Math.max(0, Math.ceil(sec)); return '00:' + (sec < 10 ? '0' : '') + sec; }
  function tick() {
    if (!recT) return;
    var v = cur && clips[cur];
    recT.textContent = v && v.duration ? fmt(Math.round(v.duration) - v.currentTime) : fmt(15);
  }
  setInterval(tick, 200); tick();
  ORDER.forEach(function (k, idx) {
    if (clips[k]) clips[k].addEventListener('ended', function () { if (demoRunning && cur === k) nextClip(idx + 1); else if (cur === k) { clips[k].currentTime = START; clips[k].play().catch(function () {}); } });
  });

  // Ses düğmesi: dikey videonun (ekranda ortalı, 9:16) sağ üst köşesine oturur; tıklamak demoyu durdurmaz
  var mb = document.getElementById('gtaMute');
  function placeMute() { if (mb) mb.style.left = Math.round((screen.offsetWidth + screen.offsetHeight * 9 / 16) / 2 - 56) + 'px'; }
  if (mb) {
    placeMute(); window.addEventListener('resize', placeMute); window.addEventListener('load', placeMute);
    mb.addEventListener('click', function (e) {
      e.stopPropagation(); soundOn = !soundOn;
      mb.setAttribute('aria-pressed', soundOn ? 'false' : 'true'); mb.setAttribute('aria-label', soundOn ? 'Mute' : 'Unmute');
      Object.keys(clips).forEach(function (k) { clips[k].muted = !soundOn; });
      var v = cur && clips[cur]; if (v && v.paused) v.play().catch(function () {});
    });
  }

  function start() {
    if (window.matchMedia('(max-width: 860px)').matches) return;   // mobilde hero gta-mobile.js ile çalışır; masaüstü videoları indirilmesin
    Object.keys(clips).forEach(function (k) { clips[k].preload = 'auto'; });
    if (reduce) { setOpen(true); pick('busted', true); return; }
    var go = function () { setTimeout(runDemo, 400); };
    if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
  }

  // GTA VI çipi tıklanmaz ve panel hep açık kalır (kapatma yok): çip yalnızca durumu gösterir
  panel.addEventListener('click', function (e) { e.stopPropagation(); });

  // Karolar: seçileni oynat, diğerlerini sön
  function stopClips(except) {
    Object.keys(clips).forEach(function (k) {
      var v = clips[k];
      if (k === except) return;
      v.classList.remove('on');
      setTimeout(function () { if (cur !== k) v.pause(); }, 550);
    });
  }
  function pick(kind, auto) {
    if (!auto && (demoRunning || !demoDone)) cancelDemo();
    cur = kind;
    tilesBox.classList.add('has-sel');
    tiles.forEach(function (t) { t.classList.toggle('sel', t.getAttribute('data-kind') === kind); });
    var v = clips[kind]; if (!v) return;
    v.currentTime = START; v.muted = !soundOn;
    var p = v.play();
    if (p && p.catch) p.catch(function () { v.muted = true; v.play().catch(function () {}); });
    v.classList.add('on');
    stopClips(kind);
  }
  tiles.forEach(function (t) { t.addEventListener('click', function () { pick(t.getAttribute('data-kind'), false); }); });

  // GTA VI MODE ve Backdrop anahtarları hep açık kalır (kapatılamaz); klipler hiçbir etkileşimle kaybolmaz

  start();
})();
