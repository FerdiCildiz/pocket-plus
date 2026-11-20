/* GTA sayfası "Shot with Pocket+" bölümü: sekme değişince ilgili video baştan oynar, diğerleri durur; klip bitince sıradaki sekmeye geçilir; özellik listesindeki sahne satırı değişir; ses düğmesi. */
(function () {
  'use strict';
  var root = document.getElementById('clips'); if (!root) return;
  var tabs = [].slice.call(root.querySelectorAll('.clips-tab')), vids = [].slice.call(root.querySelectorAll('.clips-vid')), feats = [].slice.call(root.querySelectorAll('[data-feat]'));
  var ORDER = ['busted', 'wasted', 'respect'], START = 0;
  var visible = false, kind = 'busted', muted = true;
  var mb = document.getElementById('clipsMute');

  function play(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  function cur() { return vids.filter(function (x) { return x.getAttribute('data-kind') === kind; })[0]; }

  function show(k) {
    kind = k;
    tabs.forEach(function (t) { var on = t.getAttribute('data-kind') === k; t.classList.toggle('on', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); });
    feats.forEach(function (f) { f.hidden = f.getAttribute('data-feat') !== k; });
    vids.forEach(function (v) {
      var on = v.getAttribute('data-kind') === k;
      v.classList.toggle('on', on);
      if (on) { v.preload = 'auto'; v.muted = muted; v.currentTime = START; if (visible) play(v); }
      else setTimeout(function () { if (kind !== v.getAttribute('data-kind')) v.pause(); }, 550);
    });
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { show(t.getAttribute('data-kind')); }); });

  // Klip bitince sıradaki sekmeye geç (son sekmeden ilkine döner)
  vids.forEach(function (v) {
    v.loop = false;
    v.addEventListener('ended', function () {
      var k = v.getAttribute('data-kind');
      if (k === kind) show(ORDER[(ORDER.indexOf(k) + 1) % ORDER.length]);
    });
  });

  // Ses açma/kapama (başta sessiz; seçim sekmeler arasında korunur)
  function applyMute() {
    vids.forEach(function (v) { v.muted = muted; });
    if (mb) { mb.setAttribute('aria-pressed', muted ? 'true' : 'false'); mb.setAttribute('aria-label', muted ? 'Unmute' : 'Mute'); }
  }
  if (mb) mb.addEventListener('click', function () { muted = !muted; applyMute(); var v = cur(); if (v && v.paused) play(v); });
  applyMute();

  // Yalnızca ekrandayken oynat
  function sync() {
    var r = root.getBoundingClientRect(), vh = window.innerHeight || 800;
    visible = r.bottom > 0 && r.top < vh;
    var v = cur(); if (!v) return;
    if (visible) { if (v.paused && !v.ended) { v.preload = 'auto'; play(v); } }
    else if (!v.paused) v.pause();
  }
  window.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync);
  setInterval(sync, 500);
})();
