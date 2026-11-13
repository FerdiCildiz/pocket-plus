(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Görünürlükte belirme (başlıklar, kartlar, planlar) ve staggered ikonlar
  // Hero'daki her öğe (menü, yazılar, pencere, kamera) bitmeden alttaki bölümler belirmesin
  var heroReadyAt = performance.now() + (document.querySelector('.hero') ? 1100 : 150);
  var io = 'IntersectionObserver' in window && !reduce ? new IntersectionObserver(function (es) {
    // aynı anda görünen öğeler yukarıdan aşağı sırayla gelsin; aynı hizadakiler (bir satırın kartları) birlikte
    var k = -1, lastTop = -1e9, ft = document.body.classList.contains('page-ft'), n = 0;
    es.filter(function (e) { return e.isIntersecting; }).sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left; }).forEach(function (e) {
      io.unobserve(e.target);
      var top = e.boundingClientRect.top;
      if (Math.abs(top - lastTop) > 12) { k++; lastTop = top; }
      // iç sayfalar: ana sayfadaki gibi tek tek, yukarıdan aşağı (satırdaki kartlar soldan sağa) sırayla belirir
      if (ft) e.target.style.setProperty('--d', (.12 + Math.min(n++, 16) * .08).toFixed(2));
      else if (!e.target.style.getPropertyValue('--d')) e.target.style.setProperty('--d', (Math.min(k, 9) * .15).toFixed(2));
      e.target.classList.add('in');
    });
  }, { threshold: .18, rootMargin: '0px 0px -6% 0px' }) : null;

  // Gözlem hero bitince başlar: o ana kadar ilk ekrandaki bölümler de bekler
  var pending = [], started = false;
  function watch(el) { started ? io.observe(el) : pending.push(el); }
  setTimeout(function () { started = true; pending.forEach(function (el) { io.observe(el); }); pending = []; }, Math.max(0, heroReadyAt - performance.now()));

  document.querySelectorAll('.sec-head, .uc, .compat, .scn-head, .scn-stage, .scn-text, .plan, .rev, .faq details, .cta-card, .fx-head > *, .fx-nav > *, .fx-set:not(:has(.fx-cards)) > .fx-group, .fx-set:has(.fx-cards), .fx-body > *, .ucx-card, .ucx-more, .blog-card, .post > *').forEach(function (el, i) {
    el.classList.add('reveal');
    if (el.classList.contains('uc') || el.classList.contains('plan') || el.classList.contains('rev')) el.style.setProperty('--d', ((el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0) * .1).toFixed(2));
    io ? watch(el) : el.classList.add('in');
  });


  // İç sayfa videoları belirme animasyonu bitince başlar: çözme + animasyon aynı anda açılışta teklemeye yol açıyordu
  if (document.body.classList.contains('page-ft')) {
    document.querySelectorAll('.stage video, .cover video').forEach(function (v) {
      v.removeAttribute('autoplay'); v.pause();
      var stage = v.closest('.stage, .cover'), started = false;
      function go() { if (started) return; started = true; v.play().catch(function () {}); }
      stage.addEventListener('animationend', go, { once: true });
      setTimeout(go, 3200);
    });
  }

  // Fiyat başlığı telefonda iki satır: ilk cümleden sonra satır sonu (dile bağlı değil: . ! ? 。 ！ ？)
  var ph = document.querySelector('.sec-price .sec-head h2');
  if (ph && !ph.querySelector('br')) {
    var m = ph.textContent.match(/^(.+?[.!?。！？])\s*(?=\S)/);
    if (m) ph.innerHTML = ph.innerHTML.replace(m[1], m[1] + '<br class="mbr">');
  }

  // SSS akordiyonları: yükseklik animasyonuyla açılıp kapanır (native <details> ani açılıyordu)
  if (!reduce && Element.prototype.animate) {
    document.querySelectorAll('.faq details').forEach(function (d) {
      var sum = d.querySelector('summary');
      sum.addEventListener('click', function (e) {
        e.preventDefault();
        var from = d.offsetHeight, border = d.offsetHeight - d.clientHeight;
        if (d._a) { d._a.cancel(); d._a = null; }
        var opening = !d.open || d.classList.contains('closing');
        d.style.overflow = 'hidden'; d.style.height = '';
        if (opening) { d.classList.remove('closing'); d.open = true; } else { d.classList.add('closing'); }
        var to = opening ? d.offsetHeight : sum.offsetHeight + border;
        var a = d._a = d.animate([{ height: from + 'px' }, { height: to + 'px' }], { duration: 420, easing: 'cubic-bezier(.2,.7,.2,1)' });
        a.onfinish = function () {
          d._a = null; d.style.overflow = ''; d.style.height = '';
          if (!opening) { d.open = false; d.classList.remove('closing'); }
        };
      });
    });
  }

  // İkonlar: satır satır ve çapraz stagger (sıra = satır*2 + sütun)
  document.querySelectorAll('.frow').forEach(function (row, r) {
    row.querySelectorAll('.fi').forEach(function (fi, c) {
      fi.style.setProperty('--i', (r * 2.2 + c * 1.1).toFixed(1));
      io ? watch(fi) : fi.classList.add('in');
    });
  });

  // One camera. Every angle.: sahne düğmeleri sol görseli ve metni değiştirir
  // Sahne metinleri sayfadaki gizli #scnData'dan okunur (çeviriler HTML'de)
  var scenes = Array.prototype.map.call(document.querySelectorAll('#scnData > div'), function (d) { return { t: d.querySelector('h3').textContent, b: d.querySelector('p').textContent }; });
  var imgs = document.querySelectorAll('#scnFrame img'), btns = document.querySelectorAll('.sb[data-i]');
  var text = document.getElementById('scnText'), title = document.getElementById('scnTitle'), body = document.getElementById('scnBody');
  var cur = 0, timer;
  function show(i) {
    if (i === cur) return; cur = i;
    imgs.forEach(function (im, k) { im.classList.toggle('on', k === i); });
    btns.forEach(function (b, k) { b.classList.toggle('on', k === i); b.setAttribute('aria-selected', k === i); });
    text.classList.add('swap');
    clearTimeout(timer);
    timer = setTimeout(function () { title.textContent = scenes[i].t; body.textContent = scenes[i].b; text.classList.remove('swap'); }, 240);
  }
  btns.forEach(function (b) { b.addEventListener('click', function () { show(+b.dataset.i); }); });
  document.addEventListener('keydown', function (e) {
    if (!e.altKey || e.metaKey || e.ctrlKey) return;
    var n = parseInt(e.code.replace('Digit', ''), 10);
    if (n >= 1 && n <= 3) { e.preventDefault(); show(n - 1); }
  });
})();

// Altbilgiden seçilen dil hatırlanır: ana sayfa tarayıcı diline göre yönlendirmesin
(function () {
  document.querySelectorAll('.lang .menu a').forEach(function (a) {
    a.addEventListener('click', function () {
      try { localStorage.setItem('lang', new URL(a.href).pathname.split('/')[1] === '' ? 'en' : (function (p) { return /^(tr|de|fr|es|pt|ja|zh)$/.test(p) ? p : 'en'; })(new URL(a.href).pathname.split('/')[1])); } catch (e) {}
    });
  });
})();

/* Satış kaynağı: ilk gelen kaynağı saklar, Polar satın alma bağlantılarına utm/reference_id olarak ekler */
(function () {
  try {
    var KEY = 'pp_attr', a = null;
    try { a = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    if (!a) {
      var q = new URLSearchParams(location.search), host = '';
      try { host = new URL(document.referrer).hostname.replace(/^(www|m|l|lm)\./, ''); } catch (e) {}
      if (host === location.hostname.replace(/^www\./, '')) host = '';
      var src = q.get('utm_source') || q.get('ref') || host || 'direct';
      a = {
        s: src.slice(0, 60),
        m: (q.get('utm_medium') || (q.get('ref') ? 'ref' : host ? 'referral' : 'none')).slice(0, 40),
        c: (q.get('utm_campaign') || location.pathname.replace(/^\/(tr|de|fr|es|pt|ja|zh)(\/|$)/, '/').replace(/\/+$/, '') || '/home').slice(0, 60),
        t: Date.now()
      };
      try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {}
    }
    document.querySelectorAll('a[href*="buy.polar.sh"]').forEach(function (l) {
      var u = new URL(l.href);
      u.searchParams.set('utm_source', a.s);
      u.searchParams.set('utm_medium', a.m);
      u.searchParams.set('utm_campaign', a.c);
      u.searchParams.set('reference_id', a.s + ':' + a.c);
      l.href = u.toString();
      l.setAttribute('data-umami-event', /exSJ/.test(l.href) ? 'buy-lifetime' : 'buy-yearly');
      l.setAttribute('data-umami-event-source', a.s);
    });
    document.querySelectorAll('a[href*="PocketPlus.zip"]').forEach(function (l) {
      l.setAttribute('data-umami-event', 'download');
      l.setAttribute('data-umami-event-source', a.s);
    });
  } catch (e) {}
})();
