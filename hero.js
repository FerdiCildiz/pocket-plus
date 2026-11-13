(function () {
  var BASE = document.currentScript ? document.currentScript.src.replace(/[^\/]*$/, '') : '';   // v2'nin yayın adresi (/new/ ya da kök)
  var root = document.documentElement;
  var shot = document.getElementById('shot');

  // 1200 pt'lik sahneyi genişliğe göre ölçekle
  function fit() {
    // Masaüstünde kamera pencerenin sağına taşar (144 pt): sağ yarıya sığacak şekilde ölçekle
    var w = window.innerWidth;
    // Kamera görseli gizli: pencere yatayda genişliğe göre ölçeklenir (kenarlarda 16/24 pt boşluk). Kamera geri gelirse: (w / 2 - 16) / 744 ve (w / 2 - 8) / 648
    var k = Math.min(1, (w - (w > 860 ? 48 : 32)) / 1200);
    root.style.setProperty('--k', k.toFixed(4));
  }
  fit();
  window.addEventListener('resize', fit);

  // Sabit menü: kaydırınca arka plan belirir
  var nav = document.querySelector('.nav');
  function navState() { nav && nav.classList.toggle('scrolled', window.scrollY > 24); }
  navState(); window.addEventListener('scroll', navState, { passive: true });

  // Dönen kelime
  var rot = document.getElementById('rot');
  if (rot && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var words = rot.querySelectorAll('.w'), wi = 0;
    setInterval(function () {
      var cur = words[wi]; wi = (wi + 1) % words.length; var nxt = words[wi];
      cur.classList.remove('on'); cur.classList.add('out');
      nxt.classList.remove('out'); nxt.classList.add('on');
      setTimeout(function () { cur.classList.remove('out'); }, 800);
    }, 2600);
  }

  // Mobil menü
  var burger = document.getElementById('burger'), mmenu = document.getElementById('mmenu');
  if (burger && mmenu) {
    function setMenu(open) { mmenu.hidden = !open; burger.setAttribute('aria-expanded', open); burger.querySelector('img').src = BASE + 'assets/ui/' + (open ? 'xmark' : 'line.3.horizontal') + '.png'; }
    burger.addEventListener('click', function () { setMenu(mmenu.hidden); });
    mmenu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  }

  // Sırayla belirme
  root.classList.add('go');

  // Logo: aynı sayfadaysa en üste kaydır
  document.querySelectorAll('.brand, .foot-brand').forEach(function (logo) {
    logo.addEventListener('click', function (e) {
      var home = logo.getAttribute('href') || '/';
      if (new URL(home, location.href).pathname === location.pathname) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    });
  });


  // YouTube videosu: kendi kontrollerimiz (iframe API betiği yüklemeden, postMessage ile). Başta sessiz, döngü yok.
  (function () {
    var box = document.getElementById('heroPromo'), fr = document.getElementById('heroVideo');
    if (!box || !fr || fr.tagName !== 'IFRAME') return;
    var mute = document.getElementById('ytMute'), replay = document.getElementById('ytReplay');
    function cmd(func, args) { try { fr.contentWindow.postMessage(JSON.stringify({ event: 'command', func: func, args: args || [] }), '*'); } catch (e) {} }
    function listen() { try { fr.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*'); } catch (e) {} }
    fr.addEventListener('load', function () { listen(); setTimeout(listen, 800); });
    // iframe'i sayfa yükü bitince aç: YouTube'un betikleri ilk açılışta ana sayfayı yavaşlatmasın (poster hemen görünür)
    function loadVideo() { if (!fr.getAttribute('src') && fr.getAttribute('data-src')) fr.src = fr.getAttribute('data-src'); }
    if (document.readyState === 'complete') setTimeout(loadVideo, 1500);
    else window.addEventListener('load', function () { setTimeout(loadVideo, 1500); });
    window.addEventListener('message', function (e) {
      if (e.source !== fr.contentWindow) return;
      var d; try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (x) { return; }
      var st = d && d.info && d.info.playerState;
      if (d && d.event === 'onStateChange') st = d.info;
      if (st === 0) box.classList.add('ended');
      else if (st === 1) { box.classList.remove('ended'); reveal(); }
    });
    // YouTube başlık ve logo katmanı oynatmanın ilk ~3 sn'sinde görünür: o sürede poster kalır, sonra baştan oynatıp videoyu açarız
    var shown = false;
    function reveal() {
      if (shown) return; shown = true;
      setTimeout(function () { cmd('seekTo', [0, true]); cmd('playVideo'); box.classList.add('ready'); }, 3400);
    }
    setTimeout(function () { if (!shown) { shown = true; box.classList.add('ready'); } }, 9000);   // mesaj gelmezse yine de aç
    var muted = true;
    mute && mute.addEventListener('click', function (e) {
      e.stopPropagation(); muted = !muted;
      cmd(muted ? 'mute' : 'unMute'); if (!muted) cmd('setVolume', [100]);
      mute.setAttribute('aria-pressed', muted ? 'true' : 'false'); mute.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
    });
    replay && replay.addEventListener('click', function (e) {
      e.stopPropagation(); box.classList.remove('ended'); cmd('seekTo', [0, true]); cmd('playVideo');
    });
    // Çift tıklayınca tam ekran (simge yok); tekrar çift tık çıkar
    box.addEventListener('dblclick', function () {
      var fs = document.fullscreenElement || document.webkitFullscreenElement;
      if (fs) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
      var rq = box.requestFullscreen || box.webkitRequestFullscreen; if (rq) rq.call(box);
    });
  })();
})();
