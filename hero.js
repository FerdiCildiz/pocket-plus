(function () {
  var BASE = document.currentScript ? document.currentScript.src.replace(/[^\/]*$/, '') : '';   // v2'nin yayın adresi (/new/ ya da kök)
  var root = document.documentElement;
  var shot = document.getElementById('shot');
  var video = document.getElementById('heroVideo');

  // 1200 pt'lik sahneyi genişliğe göre ölçekle
  function fit() {
    // Masaüstünde kamera pencerenin sağına taşar (144 pt): sağ yarıya sığacak şekilde ölçekle
    var w = window.innerWidth;
    var k = w > 860 ? Math.min(1, (w / 2 - 16) / 744) : Math.min(1, (w / 2 - 8) / 648);  // mobilde kamera pencereye biraz daha çok biner
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

  // Video: hazır olunca yumuşakça görünür ve oynar (klip kendi döngüsünde)
  function startVideo() {
    if (!video) return;
    video.addEventListener('canplay', function () { video.classList.add('on'); video.play().catch(function () {}); }, { once: true });
    video.load();
  }

  // Açılış katmanı işini bitirince DOM'dan kalksın (GPU katmanları boşa durmasın)
  var crtEl = document.querySelector('.crt');
  if (crtEl) setTimeout(function () { crtEl.remove(); root.classList.add('crt-done'); }, window.__crt ? 1700 : 0);

  // Sırayla belirme
  function go() { root.classList.add('go'); startVideo(); }
  if (window.__crt) {
    try { sessionStorage.setItem('crtPlayed', '1'); localStorage.setItem('crtPlayedAt', Date.now()); } catch (e) {}
    setTimeout(go, 520);
  } else {
    go();
  }


  // Easter egg: logoya 3 kez hızlı tıkla / dokun → açılış (CRT) efekti baştan oynar
  document.querySelectorAll('.brand, .foot-brand').forEach(function (logo) {
    var n = 0, t = 0;
    logo.addEventListener('click', function (e) {
      var now = Date.now();
      n = now - t < 700 ? n + 1 : 1; t = now;
      var home = logo.getAttribute('href') || '/';
      var here = new URL(home, location.href).pathname === location.pathname;
      if (n >= 3) { e.preventDefault(); n = 0; try { sessionStorage.setItem('logoEgg', '1'); } catch (x) {} location.href = home.split('#')[0].split('?')[0] + '?crt=1'; return; }
      if (here) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    });
  });


  // Easter egg sonrası: efekt bitince logonun altında esprili bir baloncuk
  try {
    if (sessionStorage.getItem('logoEgg') && /crt=1/.test(location.search)) {
      sessionStorage.removeItem('logoEgg');
      var L = { en: 'Nice triple click. Now go record something!', tr: 'Güzel üçlü tık. Şimdi git bir şeyler kaydet!', de: 'Schöner Dreifachklick. Jetzt nimm etwas auf!', fr: 'Joli triple clic. Maintenant, va filmer quelque chose !', es: 'Buen triple clic. Ahora ve a grabar algo!', pt: 'Belo triplo clique. Agora vá gravar alguma coisa!', ja: 'ナイス3連打。さあ、何か撮ってみよう！', zh: '三连击不错。现在去录点什么吧！' };
      var lang = (document.documentElement.lang || 'en').slice(0, 2);
      var nb = document.querySelector('.nav .brand');
      if (nb) {
        var tip = document.createElement('span');
        tip.className = 'egg-tip'; tip.textContent = L[lang] || L.en; tip.setAttribute('role', 'status');
        nb.appendChild(tip);
        setTimeout(function () { tip.classList.add('on'); }, 2300);
        setTimeout(function () { tip.classList.remove('on'); setTimeout(function () { tip.remove(); }, 400); }, 7300);
      }
    }
  } catch (x) {}

})();
