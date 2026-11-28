/* GTA sayfası mobil hero: dikey klipler sırayla (bitince sıradaki) döner, karolara dokununca o klip oynar; ses düğmesi. Masaüstünde çalışmaz. */
(function () {
  'use strict';
  var root = document.getElementById('shotM'); if (!root || !window.matchMedia('(max-width: 860px)').matches) return;
  var vids = [].slice.call(root.querySelectorAll('.m-vid')), tiles = [].slice.call(root.querySelectorAll('.m-tile')), mb = document.getElementById('mMute');
  var ORDER = ['wasted', 'busted', 'respect'], cur = 'wasted', auto = true, muted = true, visible = false;
  function vid(k) { return vids.filter(function (v) { return v.getAttribute('data-kind') === k; })[0]; }
  function play(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  function show(k, byUser) {
    if (byUser) auto = false;
    cur = k;
    tiles.forEach(function (t) { t.classList.toggle('sel', t.getAttribute('data-kind') === k); });
    vids.forEach(function (v) {
      var on = v.getAttribute('data-kind') === k;
      v.classList.toggle('on', on);
      if (on) { v.preload = 'auto'; v.muted = muted; v.currentTime = 0; if (visible) play(v); }
      else setTimeout(function () { if (cur !== v.getAttribute('data-kind')) v.pause(); }, 550);
    });
  }
  vids.forEach(function (v) { v.addEventListener('ended', function () { if (auto && cur === v.getAttribute('data-kind')) show(ORDER[(ORDER.indexOf(cur) + 1) % ORDER.length], false); else if (!auto) { v.currentTime = 0; if (visible) play(v); } }); });
  tiles.forEach(function (t) { t.addEventListener('click', function () { show(t.getAttribute('data-kind'), true); }); });
  if (mb) mb.addEventListener('click', function () {
    muted = !muted; mb.setAttribute('aria-pressed', muted ? 'true' : 'false'); mb.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
    vids.forEach(function (v) { v.muted = muted; }); var v = vid(cur); if (v && v.paused) play(v);
  });
  function sync() {
    var r = root.getBoundingClientRect(), vh = window.innerHeight || 800; visible = r.bottom > 0 && r.top < vh;
    var v = vid(cur); if (!v) return;
    if (visible) { if (v.paused && !v.ended) { v.preload = 'auto'; play(v); } } else if (!v.paused) v.pause();
  }
  window.addEventListener('scroll', sync, { passive: true }); window.addEventListener('resize', sync); setInterval(sync, 500); sync();
})();
