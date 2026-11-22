/* ============================================================
   草原与窑火 / 元代陶瓷中的蒙古生活习俗反映
   UI + Three.js 展廊
   纯本地、无外部依赖。3D 纹理走 data URI，2D 素材走相对路径。
   ============================================================ */

(function () {
  'use strict';

  var doc = document;
  var body = doc.body;
  var $ = function (sel, root) { return (root || doc).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); };

  var EX = window.EXHIBITION;
  var TEX = window.EXHIBIT_TEXTURES || {};

  var stage = $('#stage');
  var canvas = $('#scene');
  var intro = $('#intro');
  var archive = $('#archive');
  var archiveScroll = $('#archive-scroll');
  var archiveContent = $('#archive-content');
  var indexView = $('#index-view');
  var indexScroll = $('.index-scroll');
  var indexList = $('#index-list');
  var credits = $('#credits');
  var creditsContent = $('#credits-content');
  var routeEl = $('#route');
  var toastEl = $('#toast');

  var btnEnter = $('#btn-enter');
  var btnSkipIntro = $('#btn-skip-intro');
  var btn2D = $('#btn-2d');
  var btnSound = $('#btn-sound');
  var btnFull = $('#btn-full');
  var btnNext = $('#btn-next');
  var btnPrev = $('#btn-prev');
  var btnCloseArchive = $('#btn-close-archive');
  var btnArchiveIndex = $('#btn-archive-index');
  var btnIndex3D = $('#btn-index-3d');
  var btnCredits = $('#btn-credits');
  var btnIndexCredits = $('#btn-index-credits');
  var btnIndexCredits2 = $('#btn-index-credits-2');
  var btnCloseCredits = $('#btn-close-credits');

  var hbEl = $('#hall-banner');
  var hbKicker = $('#hb-kicker');
  var hbTitle = $('#hb-title');
  var hbSub = $('#hb-sub');

  var ambientEls = [$('#ambient-1'), $('#ambient-2'), $('#ambient-3')];

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { /* ignore */ }

  var state = {
    isMobile: window.matchMedia('(max-width: 820px)').matches,
    mode: 'intro',
    current: 0,
    three: null,
    fallback: false,
    soundOn: false,
    activeTrack: -1,
    archiveId: null,
    archiveReturn: '3d',
    archiveImageIndex: 0,
    archiveAudio: null,
    toastTimer: 0,
    bannerTimer: 0,
    lastBannerHall: '',
    introDismissed: false,
    creditsOpen: false,
    indexOpen: false,
    archiveOpen: false
  };

  var PROLOGUE_MOOD = {
    fog: 0x1a110a,
    fogDensity: 0.024,
    exposure: 1.16,
    hemiSky: 0xffe1b8,
    hemiGround: 0x1a110a,
    hemiIntensity: 0.76,
    ambient: 0.17,
    key: 0xffcb92,
    keyIntensity: 2.45,
    rim: 0x9b6a3e
  };

  var TAIL_MOOD = (function () {
    var h = null;
    for (var i = 0; i < EX.halls.length; i++) {
      if (EX.halls[i].id === 'tail') h = EX.halls[i];
    }
    var m = h ? h.mood : {};
    return {
      fog: m.fog || 0x2b2117,
      fogDensity: 0.026,
      exposure: m.exposure || 1.28,
      hemiSky: m.hemiSky || 0xffe7c9,
      hemiGround: m.hemiGround || 0x241a12,
      hemiIntensity: m.hemiIntensity || 0.88,
      ambient: m.ambient || 0.2,
      key: m.key || 0xffd9ad,
      keyIntensity: m.keyIntensity || 2.2,
      rim: m.rim || 0xb08050
    };
  })();

  var CARD_IMAGES = {
    '04': { src: 'assets/img/04_card.jpg', alt: '高足转杯俯视旋转示意' },
    '06': { src: 'assets/img/06_card.jpg', alt: '蓝釉描金匜器形示意' }
  };

  var TRACK_BY_HALL = {
    prologue: 0,
    hall1: 0,
    hall2: 1,
    hall3: 2,
    tail: 0
  };

  /* ------------------------------------------------------------
     Basic helpers
     ------------------------------------------------------------ */

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '00:00';
    var total = Math.floor(seconds);
    var m = Math.floor(total / 60);
    var s = total % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function findArtifact(id) {
    for (var i = 0; i < EX.artifacts.length; i++) {
      if (EX.artifacts[i].id === id) return EX.artifacts[i];
    }
    return null;
  }

  function findHall(id) {
    for (var i = 0; i < EX.halls.length; i++) {
      if (EX.halls[i].id === id) return EX.halls[i];
    }
    return null;
  }

  function showToast(message, duration) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-show');
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(function () {
      toastEl.classList.remove('is-show');
    }, duration || 3400);
  }

  function dismissIntro() {
    if (state.introDismissed) return;
    state.introDismissed = true;
    intro.classList.add('is-hidden');
    body.classList.remove('is-intro');
    window.setTimeout(function () {
      intro.style.display = 'none';
    }, 760);
  }

  /* ------------------------------------------------------------
     Route
     ------------------------------------------------------------ */

  var route = (function () {
    var list = [{
      kind: 'prologue',
      id: 'prologue',
      label: '序',
      title: '序厅',
      hallId: 'prologue'
    }];
    EX.artifacts.forEach(function (a) {
      list.push({
        kind: 'artifact',
        id: a.id,
        label: a.id,
        title: a.short,
        hallId: a.hall,
        artifact: a
      });
    });
    list.push({
      kind: 'tail',
      id: 'tail',
      label: '尾',
      title: '尾厅',
      hallId: 'tail'
    });
    return list;
  })();

  function hallForRoute(index) {
    var item = route[index];
    if (!item) return null;
    if (item.kind === 'prologue') {
      return {
        id: 'prologue',
        no: '序厅',
        title: '从草原来',
        sub: '序厅 / PROLOGUE',
        en: 'PROLOGUE',
        mood: PROLOGUE_MOOD
      };
    }
    if (item.kind === 'tail') {
      var t = findHall('tail');
      return {
        id: 'tail',
        no: '尾厅',
        title: '器物是生活的注脚',
        sub: '尾厅 / CODA',
        en: 'CODA',
        mood: TAIL_MOOD,
        lead: t ? t.lead : ''
      };
    }
    return findHall(item.hallId);
  }

  function moodForHall(hallId) {
    if (hallId === 'prologue') return PROLOGUE_MOOD;
    if (hallId === 'tail') return TAIL_MOOD;
    var h = findHall(hallId);
    return h ? h.mood : TAIL_MOOD;
  }

  function hallLabel(hall) {
    return hall.no + ' / ' + hall.title;
  }

  function buildRouteUI() {
    if (!routeEl) return;
    routeEl.innerHTML = '';
    route.forEach(function (item, i) {
      var b = doc.createElement('button');
      b.type = 'button';
      b.className = 'route-stop';
      b.setAttribute('aria-label', routeLabel(item));
      b.title = routeLabel(item);
      var dot = doc.createElement('i');
      dot.textContent = item.label;
      b.appendChild(dot);
      b.addEventListener('click', function () {
        if (i === state.current && state.mode === '3d') return;
        goToRoute(i);
      });
      routeEl.appendChild(b);
    });
  }

  function routeLabel(item) {
    if (item.kind === 'prologue') return '序厅 · 从草原来';
    if (item.kind === 'tail') return '尾厅 · 器物是生活的注脚';
    return '第 ' + item.id + ' 件 · ' + item.artifact.title;
  }

  function updateRouteUI() {
    if (!routeEl) return;
    $$('.route-stop', routeEl).forEach(function (el, i) {
      el.classList.toggle('is-current', i === state.current);
      el.classList.toggle('is-done', i < state.current);
      if (i === state.current) el.setAttribute('aria-current', 'step');
      else el.removeAttribute('aria-current');
    });
    var caption = $('#route-caption');
    if (caption) {
      var item = route[state.current];
      caption.textContent = '当前 · ' + (item.kind === 'artifact' ? item.id + ' ' + item.title : item.title) + ' · 点击圆点跳转';
    }
  }

  function updateHudForRoute(index) {
    var item = route[index];
    var hall = hallForRoute(index);
    if (!item || !hall) return;

    $('#hall-no').textContent = hall.no;
    $('#hall-title').textContent = hall.title;

    var hint = '';
    if (item.kind === 'prologue') {
      hint = '拖动空白处看四周 · 点「进入第一展厅」开始参观';
    } else if (item.kind === 'tail') {
      hint = '拖动空白处看四周 · 可回到序厅再看一次 · 素材授权在右上角';
    } else {
      hint = item.artifact.hint;
    }
    $('#scene-hint').textContent = hint;

    if (item.kind === 'prologue') {
      $('#scene-index').textContent = '序厅 / PROLOGUE';
    } else if (item.kind === 'tail') {
      $('#scene-index').textContent = '尾厅 / CODA';
    } else {
      $('#scene-index').textContent = 'OBJECT ' + item.id + ' / ' + hall.no + ' / ' + hall.title;
    }

    btnPrev.disabled = index === 0;
    btnPrev.setAttribute('aria-disabled', index === 0 ? 'true' : 'false');

    if (item.kind === 'tail') {
      btnNext.innerHTML = '重新参观 <small>回到序厅</small>';
    } else if (item.kind === 'prologue') {
      btnNext.innerHTML = '进入第一展厅 <small>先看一只手</small>';
    } else if (index === route.length - 2) {
      btnNext.innerHTML = '前往尾厅 <small>把颜色放回生活</small>';
    } else {
      var next = route[index + 1];
      btnNext.innerHTML = '下一站 <small>' + esc(next.id) + ' · ' + esc(next.title) + '</small>';
    }

    updateRouteUI();
  }

  function showHallBanner(index, force) {
    var hall = hallForRoute(index);
    if (!hall || hall.id === 'tail') return;
    if (!force && state.lastBannerHall === hall.id) return;
    state.lastBannerHall = hall.id;
    hbKicker.textContent = hall.no;
    hbTitle.textContent = hall.title;
    hbSub.textContent = hall.sub || hall.en || '';
    hbEl.classList.remove('is-show');
    void hbEl.offsetWidth;
    hbEl.classList.add('is-show');
    window.clearTimeout(state.bannerTimer);
    state.bannerTimer = window.setTimeout(function () {
      hbEl.classList.remove('is-show');
    }, 2300);
  }

  /* ------------------------------------------------------------
     Index
     ------------------------------------------------------------ */

  function renderIndex() {
    if (!indexList) return;
    var html = '';
    EX.halls.forEach(function (hall) {
      if (hall.id === 'tail') return;
      var arts = EX.artifacts.filter(function (a) { return a.hall === hall.id; });
      if (!arts.length) return;
      html += '<section class="index-hall">';
      html += '<div class="index-hall-head">';
      html += '<div class="index-hall-head-left">';
      html += '<span class="hall-no">' + esc(hall.no) + ' / ' + esc(hall.en) + '</span>';
      html += '<h3>' + esc(hall.title) + ' <span style="font-size:.58em;color:var(--brown);letter-spacing:.06em">' + esc(hall.sub) + '</span></h3>';
      html += '</div>';
      html += '<p>' + esc(hall.lead) + '</p>';
      html += '</div>';
      html += '<div class="index-cards">';
      arts.forEach(function (a) {
        var cardImg = CARD_IMAGES[a.id] || a.images[0];
        var img = cardImg.src;
        html += '<article class="index-card" role="button" tabindex="0" data-artifact="' + esc(a.id) + '" aria-label="打开第 ' + esc(a.id) + ' 件 ' + esc(a.title) + ' 的 2D 档案">';
        html += '<span class="index-thumb' + (a.id === '06' ? ' is-contain' : '') + '"><img src="' + esc(img) + '" alt="' + esc(cardImg.alt) + '" loading="lazy"><span class="obj-no">' + esc(a.id) + '</span>' + (CARD_IMAGES[a.id] ? '<span class="thumb-tag">示意图</span>' : '') + '</span>';
        html += '<div class="index-card-body">';
        html += '<p class="eyebrow">OBJECT ' + esc(a.id) + ' / ' + esc(hall.no) + '</p>';
        html += '<h4>' + esc(a.title) + '</h4>';
        html += '<p>' + esc(a.wallText) + '</p>';
        html += '<span class="index-card-open">打开档案</span>';
        html += '</div></article>';
      });
      html += '</div></section>';
    });
    indexList.innerHTML = html;

    $$('.index-card', indexList).forEach(function (card) {
      var open = function () {
        var id = card.getAttribute('data-artifact');
        if (id) openArchive(id, 'index');
      };
      card.addEventListener('click', open);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    });
  }

  function openIndex(opts) {
    opts = opts || {};
    if (state.creditsOpen) closeCredits();
    if (state.mode === 'index' && state.indexOpen) {
      indexView.classList.add('is-open');
      return;
    }
    state.mode = 'index';
    state.indexOpen = true;
    body.classList.remove('is-3d');
    body.classList.add('index-open');
    indexView.classList.add('is-open');
    indexView.setAttribute('aria-hidden', 'false');
    if (!opts.preserveScroll && indexScroll) indexScroll.scrollTop = 0;
    if (state.three) {
      state.three.setActive(false);
      pauseAmbient();
    }
    if (!state.isMobile) {
      window.setTimeout(function () {
        var first = $('.index-card', indexList);
        if (first && state.indexOpen && !state.archiveOpen) first.focus();
      }, 500);
    }
  }

  function closeIndex() {
    if (!state.indexOpen) return;
    state.indexOpen = false;
    indexView.classList.remove('is-open');
    indexView.setAttribute('aria-hidden', 'true');
    body.classList.remove('index-open');
  }

  function returnTo3D() {
    if (state.isMobile) {
      showToast('手机端使用 2D 档案；在电脑上可体验 3D 展廊。');
      return;
    }
    if (state.fallback || !state.three) {
      showToast('当前设备没有启用 3D，2D 档案仍可完整浏览。');
      return;
    }
    closeArchive({ silent: true });
    closeIndex();
    state.mode = '3d';
    body.classList.add('is-3d');
    body.classList.remove('archive-open', 'index-open');
    state.three.setActive(true);
    if (state.soundOn) playAmbientForHall(state.three.getHallId());
  }

  /* ------------------------------------------------------------
     Archive
     ------------------------------------------------------------ */

  function archiveCloseLabel() {
    if (state.isMobile || state.fallback || state.archiveReturn === 'index') return '返回目录';
    return '返回 3D';
  }

  function openArchive(id, from) {
    var a = findArtifact(id);
    if (!a) return;
    var fromIndex = from === 'index';
    if (state.creditsOpen) closeCredits();

    state.archiveId = id;
    state.archiveReturn = fromIndex ? 'index' : (state.mode === 'index' ? 'index' : '3d');
    state.archiveOpen = true;
    state.archiveImageIndex = 0;
    state.mode = 'archive';
    if (btnArchiveIndex) btnArchiveIndex.style.display = state.archiveReturn === 'index' ? 'none' : '';

    if (fromIndex) {
      body.classList.add('index-open');
      state.indexOpen = true;
    } else {
      closeIndex();
    }

    body.classList.add('archive-open');
    archive.classList.add('is-open');
    archive.setAttribute('aria-hidden', 'false');
    btnCloseArchive.textContent = archiveCloseLabel();
    renderArtifact(a);
    if (archiveScroll) archiveScroll.scrollTop = 0;
    if (state.three) {
      state.three.setActive(false);
      pauseAmbient();
    }
    window.setTimeout(function () {
      if (state.archiveOpen) btnCloseArchive.focus();
    }, 420);
  }

  function closeArchive(opts) {
    opts = opts || {};
    if (!state.archiveOpen) return;
    stopArchiveAudio();
    state.archiveOpen = false;
    archive.classList.remove('is-open');
    archive.setAttribute('aria-hidden', 'true');
    body.classList.remove('archive-open');

    var toIndex = opts.toIndex || state.archiveReturn === 'index' || state.isMobile || state.fallback;
    if (toIndex) {
      state.mode = 'index';
      state.archiveId = null;
      openIndex({ preserveScroll: true });
      return;
    }

    closeIndex();
    state.mode = '3d';
    body.classList.add('is-3d');
    state.current = state.current;
    if (state.three) {
      state.three.setActive(true);
      if (state.soundOn) playAmbientForHall(state.three.getHallId());
    }
    state.archiveId = null;
  }

  function showIndexFromArchive() {
    state.archiveReturn = 'index';
    closeArchive({ toIndex: true });
  }

  function renderArtifact(a) {
    state.archiveImageIndex = 0;
    var hall = findHall(a.hall);
    var images = a.images || [];
    var first = images[0] || { src: '', alt: '', caption: '' };

    var metaRows = (a.meta || []).map(function (row) {
      return '<tr><th>' + esc(row[0]) + '</th><td>' + esc(row[1]) + '</td></tr>';
    }).join('');

    var focusCards = (a.focus || []).map(function (f, i) {
      return '<div class="focus-card">' +
        '<span class="focus-num">0' + (i + 1) + '</span>' +
        '<div><h4>' + esc(f.title) + '</h4><p>' + esc(f.text) + '</p></div>' +
        '</div>';
    }).join('');

    var tabs = images.map(function (img, i) {
      return '<button class="tab' + (i === 0 ? ' is-active' : '') + '" type="button" role="tab" aria-selected="' +
        (i === 0 ? 'true' : 'false') + '" data-img-index="' + i + '">' + esc(img.label) + '</button>';
    }).join('');

    var videoBlock = '';
    if (a.video) {
      videoBlock = '<div class="media-extra">' +
        '<video controls preload="metadata" playsinline poster="' + esc(a.video.poster) + '">' +
        '<source src="' + esc(a.video.src) + '" type="video/mp4">你的浏览器不支持视频播放。' +
        '</video><p class="media-note">' + esc(a.video.note) + '</p></div>';
    }

    var interactionBlock = '';
    if (a.interaction && a.interaction.type === 'rotation') {
      interactionBlock = rotationMarkup(a.interaction);
    } else if (a.interaction && a.interaction.type === 'gold') {
      interactionBlock = goldMarkup(a.interaction);
    }

    var html = '<article class="archive-grid">' +
      '<section class="media-col" aria-label="文物图像与视频">' +
        '<div class="media-frame">' +
          '<div class="media-image-wrap">' +
            '<img id="main-image" class="media-image" src="' + esc(first.src) + '" alt="' + esc(first.alt) + '">' +
          '</div>' +
          '<p class="media-caption" id="media-caption">' + esc(first.caption) + '</p>' +
        '</div>' +
        '<div class="tabs" role="tablist" aria-label="图像切换">' + tabs + '</div>' +
        videoBlock +
      '</section>' +
      '<section class="text-col">' +
        '<p class="eyebrow">' + esc(hall ? hall.no + ' / ' + hall.title : '') + ' &nbsp;·&nbsp; OBJECT ' + esc(a.id) + '</p>' +
        '<h2 id="archive-title">' + esc(a.title) + '</h2>' +
        '<p class="alias">' + esc(a.alias) + '</p>' +
        '<table class="meta"><tbody>' + metaRows + '</tbody></table>' +
        '<p class="lead">' + esc(a.lead) + '</p>' +
        '<div class="focus-block"><p class="focus-heading">三个看点 / FOCUS</p>' + focusCards + '</div>' +
        interactionBlock +
        '<div class="boundary"><p class="boundary-label">表述边界 / EVIDENCE</p><p>' + esc(a.boundary) + '</p></div>' +
        audioMarkup(a) +
        '<p class="archive-credits">' + esc(a.credits) + '<br>完整授权信息见「素材授权」。</p>' +
        archiveNavMarkup(a) +
      '</section>' +
    '</article>';

    archiveContent.innerHTML = html;
    $('#archive-bar-index').textContent = 'ARCHIVE ' + a.id + ' / 06';
    $('#archive-bar-title').textContent = a.title;
    btnCloseArchive.textContent = archiveCloseLabel();

    var img = $('#main-image');
    if (img) {
      img.addEventListener('load', function () {
        positionHotspots();
      });
      if (img.complete) window.setTimeout(positionHotspots, 20);
    }

    $$('.tab', archiveContent).forEach(function (tab) {
      tab.addEventListener('click', function () {
        var idx = parseInt(tab.getAttribute('data-img-index'), 10) || 0;
        selectArchiveImage(idx);
      });
    });

    bindArchiveNav(a);
    bindArchiveAudio(a);
    if (a.interaction && a.interaction.type === 'rotation') bindRotationDemo(a);
    if (a.interaction && a.interaction.type === 'gold') bindGoldDemo(a);
    window.setTimeout(function () {
      renderHotspots(a, state.archiveImageIndex);
      positionHotspots();
    }, 30);
  }

  function selectArchiveImage(index) {
    var a = findArtifact(state.archiveId);
    if (!a) return;
    var imgData = a.images[index];
    if (!imgData) return;
    state.archiveImageIndex = index;
    var img = $('#main-image');
    var caption = $('#media-caption');
    if (img) {
      img.classList.add('is-switching');
      img.src = imgData.src;
      img.alt = imgData.alt;
      window.setTimeout(function () { img.classList.remove('is-switching'); }, 180);
    }
    if (caption) caption.textContent = imgData.caption;
    $$('.tab', archiveContent).forEach(function (tab) {
      var active = parseInt(tab.getAttribute('data-img-index'), 10) === index;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    renderHotspots(a, index);
    positionHotspots();
  }

  function renderHotspots(a, imageIndex) {
    var wrap = $('.media-image-wrap', archiveContent);
    if (!wrap) return;
    $$('.hotspot, .hotspot-note', wrap).forEach(function (el) { el.parentNode.removeChild(el); });
    if (state.isMobile || imageIndex !== 0) return;

    (a.hotspots || []).forEach(function (h, i) {
      var b = doc.createElement('button');
      b.type = 'button';
      b.className = 'hotspot';
      b.setAttribute('data-hs', String(i));
      b.setAttribute('aria-label', '查看看点：' + h.title);
      var label = doc.createElement('span');
      label.textContent = h.title;
      b.appendChild(label);
      b.addEventListener('click', function () {
        showHotspotNote(a, i);
      });
      wrap.appendChild(b);
    });

    var note = doc.createElement('div');
    note.className = 'hotspot-note';
    note.id = 'hotspot-note';
    wrap.appendChild(note);

    window.setTimeout(positionHotspots, 20);
  }

  function positionHotspots() {
    var wrap = $('.media-image-wrap', archiveContent);
    var img = $('#main-image');
    if (!wrap || !img) return;
    var ir = img.getBoundingClientRect();
    var wr = wrap.getBoundingClientRect();
    if (!ir.width || !ir.height) return;
    var a = findArtifact(state.archiveId);
    if (!a) return;
    $$('.hotspot', wrap).forEach(function (btn, i) {
      var h = a.hotspots[i];
      if (!h) return;
      var x = (ir.left - wr.left) + (h.x / 100) * ir.width;
      var y = (ir.top - wr.top) + (h.y / 100) * ir.height;
      btn.style.left = x + 'px';
      btn.style.top = y + 'px';
    });
  }

  function showHotspotNote(a, index) {
    var note = $('#hotspot-note');
    var h = a.hotspots[index];
    if (!note || !h) return;
    var isSame = note.getAttribute('data-hs') === String(index) && note.classList.contains('is-show');
    if (isSame) {
      note.classList.remove('is-show');
      return;
    }
    note.setAttribute('data-hs', String(index));
    note.innerHTML = '<strong>' + esc(h.title) + '</strong><p>' + esc(h.text) + '</p>';
    note.classList.add('is-show');
    $$('.hotspot', archiveContent).forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-hs') === String(index));
    });
  }

  function archiveNavMarkup(a) {
    var idx = EX.artifacts.indexOf(a);
    var isFirst = idx === 0;
    var isLast = idx === EX.artifacts.length - 1;
    var prev = '<button class="archive-btn" type="button" data-nav="prev"' + (isFirst ? ' disabled' : '') + '>上一件</button>';
    var nextLabel = isLast ? '回到目录 <small>六件器物</small>' : '下一件 <small>' + esc(EX.artifacts[idx + 1].id) + ' · ' + esc(EX.artifacts[idx + 1].short) + '</small>';
    var next = '<button class="next-btn next-btn--paper" type="button" data-nav="' + (isLast ? 'index' : 'next') + '">' + nextLabel + '</button>';
    return '<div class="archive-nav"><div class="archive-nav-group">' + prev +
      '<button class="archive-btn" type="button" data-nav="index">目录</button>' +
      '<button class="archive-btn" type="button" data-nav="credits">素材授权</button>' +
      '</div>' + next + '</div>';
  }

  function bindArchiveNav(a) {
    $$('[data-nav]', archiveContent).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = btn.getAttribute('data-nav');
        if (action === 'prev') {
          var idx = EX.artifacts.indexOf(a);
          if (idx > 0) openArchive(EX.artifacts[idx - 1].id, state.archiveReturn);
        } else if (action === 'next') {
          var i = EX.artifacts.indexOf(a);
          if (i < EX.artifacts.length - 1) openArchive(EX.artifacts[i + 1].id, state.archiveReturn);
        } else if (action === 'index') {
          showIndexFromArchive();
        } else if (action === 'credits') {
          openCredits();
        }
      });
    });
  }

  function audioMarkup(a) {
    return '<div class="audio-card">' +
      '<div class="audio-head"><span class="mono">AMBIENCE / 合成音效</span><span class="audio-time" id="audio-time">00:00</span></div>' +
      '<div class="audio-row">' +
        '<button id="audio-toggle" class="audio-toggle" type="button" aria-label="播放本条环境音">▶</button>' +
        '<button class="audio-track" id="audio-track" type="button" aria-label="点击或拖动音频进度"><span class="audio-progress" id="audio-progress"></span></button>' +
        '<span class="audio-total" id="audio-total">00:00</span>' +
      '</div>' +
      '<p class="audio-note">' + esc(a.audio.note) + '</p>' +
    '</div>';
  }

  function bindArchiveAudio(a) {
    stopArchiveAudio();
    var audio = new Audio();
    audio.loop = true;
    audio.preload = 'metadata';
    audio.volume = 0.55;
    audio.src = a.audio.src;
    state.archiveAudio = audio;

    var toggle = $('#audio-toggle');
    var track = $('#audio-track');
    var progress = $('#audio-progress');
    var timeEl = $('#audio-time');
    var totalEl = $('#audio-total');

    function updateProgress() {
      if (progress) {
        progress.style.width = audio.duration ? ((audio.currentTime / audio.duration) * 100) + '%' : '0%';
      }
      if (timeEl) timeEl.textContent = formatTime(audio.currentTime);
      if (totalEl) totalEl.textContent = formatTime(audio.duration);
    }

    audio.addEventListener('loadedmetadata', updateProgress);
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('play', function () {
      if (toggle) {
        toggle.textContent = 'Ⅱ';
        toggle.setAttribute('aria-label', '暂停本条环境音');
      }
    });
    audio.addEventListener('pause', function () {
      if (toggle) {
        toggle.textContent = '▶';
        toggle.setAttribute('aria-label', '播放本条环境音');
      }
    });
    audio.addEventListener('error', function () {
      if (toggle) {
        toggle.textContent = '▶';
      }
      showToast('这条环境音暂时无法播放；图片与文字档案不受影响。');
    });

    if (toggle) {
      toggle.addEventListener('click', function () {
        if (!audio.paused) {
          audio.pause();
          return;
        }
        var p = audio.play();
        if (p && p.catch) {
          p.catch(function () {
            showToast('浏览器阻止了音频播放，请再点一次。');
          });
        }
      });
    }

    if (track) {
      track.addEventListener('click', function (e) {
        if (!isFinite(audio.duration) || audio.duration <= 0) return;
        var rect = track.getBoundingClientRect();
        var ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
        audio.currentTime = ratio * audio.duration;
        updateProgress();
      });
    }

    window.setTimeout(function () {
      updateProgress();
    }, 60);
  }

  function stopArchiveAudio() {
    if (state.archiveAudio) {
      try {
        state.archiveAudio.pause();
        state.archiveAudio.src = '';
        state.archiveAudio.load();
      } catch (e) { /* ignore */ }
      state.archiveAudio = null;
    }
  }

  /* ------------------------------------------------------------
     04 rotation demo
     ------------------------------------------------------------ */

  function rotationMarkup(interaction) {
    return '<div class="interaction-card">' +
      '<div class="interaction-head"><h4>' + esc(interaction.label) + '</h4><span>INTERACTION / 俯视示意</span></div>' +
      '<div class="rotation-demo">' +
        '<div class="rot-stage" id="rot-stage" role="slider" tabindex="0" aria-label="转动杯身示意" aria-valuemin="0" aria-valuemax="360" aria-valuenow="0">' +
          '<svg viewBox="0 0 178 178" aria-hidden="true">' +
            '<circle cx="89" cy="89" r="61" fill="none" stroke="rgba(30,21,16,.16)"/>' +
            '<g id="rot-cup" transform="rotate(0 89 89)">' +
              '<circle cx="89" cy="89" r="54" fill="rgba(166,61,47,.12)" stroke="#A63D2F" stroke-width="2"/>' +
              '<circle cx="89" cy="42" r="4.2" fill="#A63D2F"/>' +
              '<line x1="89" y1="34" x2="89" y2="48" stroke="#1E1510" stroke-width="2" stroke-linecap="round"/>' +
              '<line x1="48" y1="112" x2="49" y2="99" stroke="#1E1510" stroke-width="2" stroke-linecap="round" transform="rotate(120 89 89)"/>' +
              '<line x1="130" y1="112" x2="129" y2="99" stroke="#1E1510" stroke-width="2" stroke-linecap="round" transform="rotate(240 89 89)"/>' +
            '</g>' +
            '<circle cx="89" cy="89" r="9" fill="none" stroke="rgba(30,21,16,.46)" stroke-width="2"/>' +
            '<circle cx="89" cy="89" r="2.6" fill="#A63D2F"/>' +
            '<text x="89" y="168" text-anchor="middle" fill="#6B5B4C" font-family="monospace" font-size="5.4" letter-spacing=".08em">杯身可转 / 高足固定</text>' +
          '</svg>' +
        '</div>' +
        '<div class="rot-readout">' +
          '<strong>杯身转，高足不动</strong>' +
          '<p>拖动左侧圆盘，或按方向键。停下的位置没有标准答案；「杯纽朝向谁」只是民间传说，未见元代文献。</p>' +
          '<span class="rot-count" id="rot-count">已转 0° · 非实测示意</span>' +
        '</div>' +
      '</div>' +
      '<p class="interaction-note">' + esc(interaction.note) + '</p>' +
    '</div>';
  }

  function bindRotationDemo(a) {
    var stageEl = $('#rot-stage', archiveContent);
    var cup = $('#rot-cup', archiveContent);
    var count = $('#rot-count', archiveContent);
    if (!stageEl || !cup) return;
    var angle = 0;
    var dragging = false;
    var pointerId = null;
    var startPointerAngle = 0;
    var startAngle = 0;

    function centerAngle(e) {
      var r = stageEl.getBoundingClientRect();
      var cx = r.left + r.width / 2;
      var cy = r.top + r.height / 2;
      return Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
    }

    function normalizeDelta(d) {
      while (d > 180) d -= 360;
      while (d < -180) d += 360;
      return d;
    }

    function apply() {
      cup.setAttribute('transform', 'rotate(' + angle + ' 89 89)');
      var shown = Math.round(((angle % 360) + 360) % 360);
      stageEl.setAttribute('aria-valuenow', String(shown));
      if (count) count.textContent = '已转 ' + shown + '° · 非实测示意';
    }

    stageEl.addEventListener('pointerdown', function (e) {
      dragging = true;
      pointerId = e.pointerId;
      startPointerAngle = centerAngle(e);
      startAngle = angle;
      try { stageEl.setPointerCapture(pointerId); } catch (err) { /* ignore */ }
      e.preventDefault();
    });

    stageEl.addEventListener('pointermove', function (e) {
      if (!dragging || e.pointerId !== pointerId) return;
      var current = centerAngle(e);
      angle = startAngle + normalizeDelta(current - startPointerAngle);
      apply();
      e.preventDefault();
    });

    function release(e) {
      if (!dragging) return;
      dragging = false;
      if (pointerId !== null) {
        try { stageEl.releasePointerCapture(pointerId); } catch (err) { /* ignore */ }
      }
      pointerId = null;
    }

    stageEl.addEventListener('pointerup', release);
    stageEl.addEventListener('pointercancel', release);

    stageEl.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        angle -= 15;
        apply();
        e.preventDefault();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        angle += 15;
        apply();
        e.preventDefault();
      }
    });

    apply();
  }

  /* ------------------------------------------------------------
     06 gold-line demo
     ------------------------------------------------------------ */

  function goldMarkup(interaction) {
    var steps = (interaction.steps || []).map(function (s, i) {
      return '<button class="gold-step' + (i === 0 ? ' is-active' : '') + '" type="button" data-gold-step="' + (i + 1) + '" aria-pressed="' + (i === 0 ? 'true' : 'false') + '">' +
        '<span class="step-no">0' + (i + 1) + '</span>' +
        '<span><strong>' + esc(s.title) + '</strong><small>' + esc(s.text) + '</small></span>' +
      '</button>';
    }).join('');

    return '<div class="interaction-card">' +
      '<div class="interaction-head"><h4>' + esc(interaction.label) + '</h4><span>INTERACTION / 四步</span></div>' +
      '<div class="gold-demo">' +
        '<div class="gold-art is-step-1" id="gold-art">' +
          '<svg viewBox="0 0 300 200" role="img" aria-label="蓝釉描金匜器形与金线示意">' +
            '<path class="yi-silhouette" d="M44,82 C50,70 68,62 94,60 L216,60 C238,64 251,75 256,91 C259,105 251,118 235,124 L94,146 C66,146 47,132 39,112 C35,102 36,90 44,82 Z"/>' +
            '<path class="yi-silhouette" d="M44,82 C30,74 16,64 6,58 C1,55 -2,61 3,66 L36,97 Z"/>' +
            '<path class="yi-rim" d="M44,82 C52,71 68,65 94,62 L216,62 C237,65 249,75 255,89"/>' +
            '<path class="yi-rim" d="M235,124 C251,118 258,105 256,91"/>' +
            '<path class="yi-rim" d="M223,75 C251,61 271,70 266,93 C261,113 243,118 231,106"/>' +
            '<g class="yi-gold-line">' +
              '<path d="M78,104 C100,88 122,112 144,96 S186,86 204,102"/>' +
              '<path d="M92,122 C112,112 132,128 154,118 S190,110 210,118"/>' +
              '<path d="M112,86 C126,78 138,88 150,80 S176,74 188,84"/>' +
              '<path d="M162,104 C166,94 176,90 184,96 C192,102 188,112 180,114 C172,116 166,112 164,106"/>' +
            '</g>' +
            '<text class="gold-caption" x="12" y="184">原创示意图 / 非实测 · 金线按残存痕迹复原大意</text>' +
          '</svg>' +
        '</div>' +
        '<div class="gold-steps">' + steps + '</div>' +
      '</div>' +
      '<p class="interaction-note">' + esc(interaction.note) + '</p>' +
    '</div>';
  }

  function bindGoldDemo(a) {
    var art = $('#gold-art', archiveContent);
    if (!art) return;
    var steps = $$('.gold-step', archiveContent);
    function select(n) {
      art.classList.remove('is-step-1', 'is-step-2', 'is-step-3', 'is-step-4');
      art.classList.add('is-step-' + n);
      steps.forEach(function (btn) {
        var active = btn.getAttribute('data-gold-step') === String(n);
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }
    steps.forEach(function (btn) {
      btn.addEventListener('click', function () {
        select(parseInt(btn.getAttribute('data-gold-step'), 10) || 1);
      });
    });
  }

  /* ------------------------------------------------------------
     Credits
     ------------------------------------------------------------ */

  function renderCredits() {
    var c = EX.credits;
    var html = '<h2 id="credits-title">' + esc(c.title) + '</h2><p>' + esc(c.intro) + '</p>';
    html += '<div class="credits-block"><h3>藏品与图片 / COLLECTIONS</h3><ul>';
    c.collections.forEach(function (line) { html += '<li>' + esc(line) + '</li>'; });
    html += '</ul></div>';
    html += '<div class="credits-block"><h3>许可证 / LICENSES</h3><ul>';
    c.licenses.forEach(function (row) {
      html += '<li>' + esc(row[0]) + ' — <a href="' + esc(row[1]) + '" target="_blank" rel="noopener">' + esc(row[1]) + '</a></li>';
    });
    html += '</ul></div>';
    html += '<div class="credits-block"><h3>原创素材与说明 / ORIGINALS</h3><ul>';
    c.originals.forEach(function (line) { html += '<li>' + esc(line) + '</li>'; });
    html += '</ul></div>';
    html += '<div class="credits-block"><h3>使用说明</h3><ul>' +
      '<li>本展为课堂汇报制作，非正式出版；完整逐项字段见文件夹内「版权与来源.csv」。</li>' +
      '<li>本页面不联网；上方许可证链接只在联网时打开。3D 模型为简化示意，不是文物扫描或复原。</li>' +
      '</ul></div>';
    creditsContent.innerHTML = html;
  }

  function openCredits() {
    if (state.creditsOpen) return;
    state.creditsOpen = true;
    credits.classList.add('is-open');
    credits.setAttribute('aria-hidden', 'false');
    window.setTimeout(function () {
      if (state.creditsOpen) btnCloseCredits.focus();
    }, 200);
  }

  function closeCredits() {
    if (!state.creditsOpen) return;
    state.creditsOpen = false;
    credits.classList.remove('is-open');
    credits.setAttribute('aria-hidden', 'true');
  }

  /* ------------------------------------------------------------
     Sound
     ------------------------------------------------------------ */

  function fadeAudio(audio, target, duration, pauseAfter) {
    if (!audio) return;
    if (audio._fadeTimer) {
      window.clearInterval(audio._fadeTimer);
      audio._fadeTimer = null;
    }
    var start = audio.volume;
    var t0 = Date.now();
    audio._fadeTimer = window.setInterval(function () {
      var t = clamp((Date.now() - t0) / duration, 0, 1);
      audio.volume = start + (target - start) * t;
      if (t >= 1) {
        window.clearInterval(audio._fadeTimer);
        audio._fadeTimer = null;
        if (pauseAfter) {
          try { audio.pause(); } catch (e) { /* ignore */ }
        }
      }
    }, 40);
  }

  function playAmbientIndex(index) {
    if (index < 0 || index >= ambientEls.length) return;
    if (state.activeTrack === index) {
      var same = ambientEls[index];
      if (same.paused) {
        var p = same.play();
        if (p && p.catch) p.catch(function () {});
      }
      fadeAudio(same, 0.34, 500, false);
      return;
    }
    ambientEls.forEach(function (audio, i) {
      if (!audio) return;
      if (i === index) {
        audio.volume = 0;
        var promise = audio.play();
        if (promise && promise.catch) {
          promise.catch(function () {
            showToast('浏览器阻止了环境音播放，请再点一次「声音」。');
            setSoundButton(false);
          });
        }
        fadeAudio(audio, 0.34, 700, false);
      } else {
        fadeAudio(audio, 0, 450, true);
      }
    });
    state.activeTrack = index;
  }

  function playAmbientForHall(hallId) {
    if (!state.soundOn) return;
    var track = TRACK_BY_HALL[hallId];
    if (typeof track !== 'number') track = 0;
    playAmbientIndex(track);
  }

  function pauseAmbient() {
    ambientEls.forEach(function (audio) {
      if (!audio) return;
      fadeAudio(audio, 0, 250, true);
    });
  }

  function setSoundButton(on) {
    state.soundOn = on;
    btnSound.textContent = on ? '声音：开' : '声音：关';
    btnSound.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  function toggleSound() {
    if (state.soundOn) {
      setSoundButton(false);
      pauseAmbient();
      state.activeTrack = -1;
    } else {
      setSoundButton(true);
      var hallId = state.three ? state.three.getHallId() : 'prologue';
      playAmbientForHall(hallId);
    }
  }

  /* ------------------------------------------------------------
     Fullscreen
     ------------------------------------------------------------ */

  function toggleFullscreen() {
    var root = doc.documentElement;
    if (!doc.fullscreenElement) {
      var req = root.requestFullscreen || root.webkitRequestFullscreen || root.msRequestFullscreen;
      if (req) {
        var p = req.call(root);
        if (p && p.catch) p.catch(function () {
          showToast('浏览器没有允许全屏；可按 F11 进入全屏。');
        });
      } else {
        showToast('当前浏览器不支持全屏按钮；可按 F11。');
      }
    } else {
      var exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
      if (exit) exit.call(doc);
    }
  }

  function updateFullscreenButton() {
    btnFull.textContent = doc.fullscreenElement ? '退出全屏' : '全屏';
  }

  /* ------------------------------------------------------------
     Intro / mode switching
     ------------------------------------------------------------ */

  function enterExhibition(fast) {
    if (state.isMobile) {
      dismissIntro();
      openIndex();
      return;
    }
    if (state.fallback || !state.three) {
      dismissIntro();
      openIndex();
      showToast('当前设备未能启用 3D，已进入 2D 档案；内容完整，操作更轻。');
      return;
    }
    dismissIntro();
    closeIndex();
    state.mode = '3d';
    state.current = 0;
    body.classList.add('is-3d');
    body.classList.remove('is-intro', 'archive-open', 'index-open');
    updateHudForRoute(0);
    state.three.setActive(true);
    state.three.beginIntro();
    showHallBanner(0, true);
    goToRoute(0, { intro: true, duration: fast || reduceMotion ? 900 : 2600 });
  }

  function goToRoute(index, opts) {
    if (!state.three || state.isMobile || state.fallback) return;
    if (index < 0 || index >= route.length) return;
    if (state.three.isTransitioning()) return;
    opts = opts || {};
    var stop = makeStop(index);
    if (!stop) return;
    var hall = hallForRoute(index);
    var prevHall = state.three.getHallId();
    if (hall.id !== prevHall || index === 0) showHallBanner(index, true);

    var duration = opts.duration;
    if (!duration) {
      var pos = state.three.getCameraPosition();
      duration = clamp(1000 + pos.distanceTo(stop.position) * 38, 1200, 3000);
    }
    if (reduceMotion) duration = 90;

    state.three.moveTo(stop, {
      duration: duration,
      intro: !!opts.intro
    }, function () {
      state.current = index;
      updateHudForRoute(index);
      if (state.soundOn) playAmbientForHall(stop.hallId);
    });
  }

  function makeStop(index) {
    var item = route[index];
    if (!item) return null;
    if (item.kind === 'prologue') {
      var pPos = new THREE.Vector3(0, 1.92, 13.7);
      var pTarget = new THREE.Vector3(0, 2.04, 6.95);
      return makeStopObject(item, 'prologue', pPos, pTarget, 0.38);
    }
    if (item.kind === 'tail') {
      var tPos = new THREE.Vector3(0, 1.9, -42.6);
      var tTarget = new THREE.Vector3(0, 2.0, -48.2);
      return makeStopObject(item, 'tail', tPos, tTarget, 0.38);
    }
    var a = item.artifact;
    var side = a.side;
    var pos = new THREE.Vector3(-side * 1.0, 1.74, a.z + 3.95);
    var target = new THREE.Vector3(side * 2.72, a.focusHeight - 0.02, a.z + 0.02);
    return makeStopObject(item, a.hall, pos, target, 0.56);
  }

  function makeStopObject(item, hallId, position, target, thetaRange) {
    var dx = position.x - target.x;
    var dy = position.y - target.y;
    var dz = position.z - target.z;
    var radius = Math.sqrt(dx * dx + dy * dy + dz * dz);
    var theta = Math.atan2(dx, dz);
    var phi = Math.acos(clamp(dy / radius, -1, 1));
    return {
      kind: item.kind,
      id: item.id,
      hallId: hallId,
      position: position,
      target: target,
      theta: theta,
      phi: phi,
      radius: radius,
      thetaRange: thetaRange,
      phiMin: Math.max(0.98, phi - 0.24),
      phiMax: Math.min(1.56, phi + 0.2),
      radiusMin: Math.max(3.2, radius - 0.9),
      radiusMax: radius + 0.9
    };
  }

  /* ------------------------------------------------------------
     3D scene
     ------------------------------------------------------------ */

  function supportsWebGL() {
    try {
      var test = doc.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (test.getContext('webgl') || test.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  function initThree() {
    if (typeof THREE === 'undefined') throw new Error('Three.js missing');

    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.16;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a110a);
    scene.fog = new THREE.FogExp2(0x1a110a, 0.024);

    var camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 140);
    camera.position.set(0, 1.92, 13.6);
    camera.lookAt(new THREE.Vector3(0, 2.04, 6.95));

    var maxAniso = renderer.capabilities.getMaxAnisotropy();
    var envMap = makeEnvMap();

    var ctx = {
      renderer: renderer,
      scene: scene,
      camera: camera,
      envMap: envMap,
      maxAniso: maxAniso,
      clock: new THREE.Clock()
    };

    var world = new THREE.Group();
    scene.add(world);

    buildArchitecture(ctx, world);
    var stations = buildStations(ctx, world);
    var lightRig = buildLightRig(scene);
    var dust = buildDust(world);

    var api = {
      ctx: ctx,
      scene: scene,
      camera: camera,
      renderer: renderer,
      stations: stations,
      active: false,
      lost: false,
      hallId: 'prologue',
      transition: null,
      orbit: null,
      currentPicks: [],
      currentArtifact: null,
      currentSpinner: null,
      currentArtifactId: null,
      lastInteract: Date.now(),
      drag: null,
      pointer: new THREE.Vector2(),
      raycaster: new THREE.Raycaster(),
      mood: moodForHall('prologue'),
      lightRig: lightRig,
      dust: dust,
      introStart: {
        position: new THREE.Vector3(0, 1.92, 13.9),
        target: new THREE.Vector3(0, 2.04, 6.95)
      }
    };

    bindPointer(api, canvas);
    bindWheel(api, canvas);
    window.addEventListener('resize', function () { resizeThree(api); });
    canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault();
      api.lost = true;
      api.active = false;
      fallbackTo2D('3D 绘图上下文丢失，已切换到 2D 档案。');
    }, false);

    setMoodImmediate(api, PROLOGUE_MOOD);
    updateOrbitCamera(api, {
      target: new THREE.Vector3(0, 2.04, 6.95),
      theta: 0,
      phi: 1.54,
      radius: 5.05
    });
    animationLoop(api);
    state.three = api;
    state.threeReady = true;
    return api;
  }

  function fallbackTo2D(message) {
    state.fallback = true;
    body.classList.add('is-fallback');
    if (state.three) state.three.setActive(false);
    btnIndex3D.style.display = 'none';
    if (state.archiveOpen) {
      btnCloseArchive.textContent = '返回目录';
    }
    if (state.mode !== 'intro') openIndex();
    if (message) showToast(message, 4600);
  }

  function resizeThree(api) {
    api.ctx.renderer.setSize(window.innerWidth, window.innerHeight, false);
    api.camera.aspect = window.innerWidth / window.innerHeight;
    api.camera.updateProjectionMatrix();
  }

  /* ------------------------------------------------------------
     Canvas texture helpers
     ------------------------------------------------------------ */

  function makeCanvas(w, h) {
    var c = doc.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  function makePaperTexture() {
    var c = makeCanvas(512, 512);
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#6c5745';
    ctx.fillRect(0, 0, 512, 512);
    var i;
    for (i = 0; i < 900; i++) {
      var x = Math.random() * 512;
      var y = Math.random() * 512;
      var len = 4 + Math.random() * 26;
      ctx.strokeStyle = 'rgba(234,213,188,' + (0.02 + Math.random() * 0.05) + ')';
      ctx.lineWidth = 0.5 + Math.random() * 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y + (Math.random() - 0.5) * 2);
      ctx.stroke();
    }
    for (i = 0; i < 26; i++) {
      var gx = Math.random() * 512;
      var gy = Math.random() * 512;
      var gr = 20 + Math.random() * 90;
      var grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
      grad.addColorStop(0, 'rgba(24,15,10,' + (0.06 + Math.random() * 0.1) + ')');
      grad.addColorStop(1, 'rgba(24,15,10,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
    }
    return c;
  }

  function makePlasterTexture() {
    var c = makeCanvas(512, 512);
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#c9c0b2';
    ctx.fillRect(0, 0, 512, 512);
    var i;
    for (i = 0; i < 700; i++) {
      var x = Math.random() * 512;
      var y = Math.random() * 512;
      var a = 0.02 + Math.random() * 0.045;
      ctx.strokeStyle = 'rgba(80,66,52,' + a + ')';
      ctx.lineWidth = 0.5 + Math.random() * 1.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 2 + Math.random() * 18, y + (Math.random() - 0.5) * 1.4);
      ctx.stroke();
    }
    for (i = 0; i < 18; i++) {
      var gx = Math.random() * 512;
      var gy = Math.random() * 512;
      var gr = 24 + Math.random() * 120;
      var grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
      grad.addColorStop(0, 'rgba(94,76,58,0.09)');
      grad.addColorStop(1, 'rgba(94,76,58,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
    }
    return c;
  }

  function makeFloorTexture() {
    var c = makeCanvas(512, 512);
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#bfae96';
    ctx.fillRect(0, 0, 512, 512);
    var i;
    for (i = 0; i < 90; i++) {
      var y = Math.random() * 512;
      var alpha = 0.03 + Math.random() * 0.08;
      ctx.strokeStyle = 'rgba(72,52,36,' + alpha + ')';
      ctx.lineWidth = 0.6 + Math.random() * 1.6;
      ctx.beginPath();
      for (var x = 0; x <= 512; x += 16) {
        var yy = y + Math.sin((x + i * 17) * 0.018) * (2 + Math.random() * 2);
        if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    for (i = 0; i < 16; i++) {
      var gx = Math.random() * 512;
      var gy = Math.random() * 512;
      var gr = 30 + Math.random() * 130;
      var grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
      grad.addColorStop(0, 'rgba(52,36,24,0.09)');
      grad.addColorStop(1, 'rgba(52,36,24,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
    }
    return c;
  }

  function makeWoodTexture() {
    var c = makeCanvas(512, 256);
    var ctx = c.getContext('2d');
    var base = ctx.createLinearGradient(0, 0, 0, 256);
    base.addColorStop(0, '#4b3322');
    base.addColorStop(0.5, '#5b3d28');
    base.addColorStop(1, '#392519');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 512, 256);
    var i;
    for (i = 0; i < 140; i++) {
      var y = Math.random() * 256;
      var alpha = 0.03 + Math.random() * 0.08;
      ctx.strokeStyle = 'rgba(226,190,150,' + alpha + ')';
      ctx.lineWidth = 0.5 + Math.random() * 1.8;
      ctx.beginPath();
      for (var x = 0; x <= 512; x += 18) {
        var yy = y + Math.sin((x + i * 31) * 0.014) * (1.5 + Math.random() * 3);
        if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    return c;
  }

  function makeEnvMap() {
    var faces = [];
    for (var i = 0; i < 6; i++) {
      var c = makeCanvas(256, 256);
      var ctx = c.getContext('2d');
      var g = ctx.createLinearGradient(0, 0, 0, 256);
      if (i === 2) {
        g.addColorStop(0, '#fff3dc');
        g.addColorStop(0.45, '#d8b083');
        g.addColorStop(1, '#7a5436');
      } else if (i === 3) {
        g.addColorStop(0, '#1a120c');
        g.addColorStop(1, '#0b0705');
      } else {
        g.addColorStop(0, '#6a4e35');
        g.addColorStop(0.5, '#322318');
        g.addColorStop(1, '#130d08');
      }
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
      if (i !== 2 && i !== 3) {
        var rg = ctx.createRadialGradient(190, 72, 4, 190, 72, 138);
        rg.addColorStop(0, 'rgba(255,220,170,0.9)');
        rg.addColorStop(0.38, 'rgba(218,154,92,0.26)');
        rg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, 256, 256);
      }
      faces.push(c);
    }
    var tex = new THREE.CubeTexture(faces);
    tex.needsUpdate = true;
    tex.encoding = THREE.sRGBEncoding;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    return tex;
  }

  function makeCanvasTexture(canvasEl, repeatX, repeatY) {
    var tex = new THREE.CanvasTexture(canvasEl);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 4;
    if (repeatX || repeatY) {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeatX || 1, repeatY || 1);
    } else {
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.minFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
    }
    return tex;
  }

  function loadDataTexture(dataUri, maxAniso, onReady) {
    if (!dataUri) return;
    new THREE.TextureLoader().load(dataUri, function (tex) {
      tex.encoding = THREE.sRGBEncoding;
      tex.anisotropy = maxAniso;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.minFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      if (onReady) onReady(tex);
    }, undefined, function () { /* white material remains */ });
  }

  function wrapLines(ctx, text, maxWidth) {
    var lines = [];
    var line = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (ch === '\n') {
        lines.push(line);
        line = '';
        continue;
      }
      var test = line + ch;
      if (line && ctx.measureText(test).width > maxWidth) {
        lines.push(line);
        line = ch;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function drawWrapped(ctx, text, x, y, maxWidth, lineHeight) {
    var lines = wrapLines(ctx, text, maxWidth);
    for (var i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, y + i * lineHeight);
    }
    return y + lines.length * lineHeight;
  }

  function fitFont(ctx, text, maxWidth, startSize, family) {
    var size = startSize;
    do {
      ctx.font = '400 ' + size + 'px ' + family;
      if (ctx.measureText(text).width <= maxWidth) break;
      size -= 2;
    } while (size > 22);
    return size;
  }

  /* ------------------------------------------------------------
     Prologue / hall / tail textures
     ------------------------------------------------------------ */

  function makePrologueTitleTexture() {
    var c = makeCanvas(900, 800);
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#e9d3b8';
    ctx.fillRect(0, 0, 900, 800);
    ctx.strokeStyle = 'rgba(30,21,16,0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, 840, 740);
    ctx.fillStyle = '#a63d2f';
    ctx.fillRect(65, 65, 5, 670);
    ctx.font = '500 22px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('A CERAMIC ARCHIVE / 元代陶瓷', 105, 105);
    ctx.fillStyle = '#1e1510';
    ctx.font = '400 92px "Kaiti SC", "STKaiti", "KaiTi", "LXGW WenKai", serif';
    ctx.fillText('草原与窑火', 100, 245);
    ctx.font = '400 28px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('元代陶瓷中的蒙古生活习俗反映', 104, 300);
    ctx.fillStyle = '#6b5b4c';
    ctx.font = '400 17px "SFMono-Regular", Menlo, Consolas, monospace';
    ctx.fillText('GRASSLAND & KILN FIRE / MONGOL LIFE IN YUAN CERAMICS', 104, 338);
    ctx.fillStyle = '#a63d2f';
    ctx.fillRect(104, 374, 132, 3);
    ctx.fillStyle = '#3a2a1e';
    ctx.font = '400 31px "PingFang SC", "Microsoft YaHei", sans-serif';
    var y = drawWrapped(ctx, EX.meta.oneLine.replace('，记录', '，\n记录'), 104, 438, 690, 47);
    ctx.fillStyle = '#6b5b4c';
    ctx.font = '400 22px "PingFang SC", "Microsoft YaHei", sans-serif';
    drawWrapped(ctx, '六件器物 · 三个动作：握、围坐、俯看', 104, y + 26, 680, 38);
    ctx.save();
    ctx.translate(760, 640);
    ctx.rotate(-0.1);
    ctx.strokeStyle = '#a63d2f';
    ctx.lineWidth = 3;
    ctx.strokeRect(-66, -66, 132, 132);
    ctx.fillStyle = '#a63d2f';
    ctx.textAlign = 'center';
    ctx.font = '400 52px "Kaiti SC", "STKaiti", "KaiTi", serif';
    ctx.fillText('序', 0, 12);
    ctx.font = '400 12px "SFMono-Regular", Menlo, monospace';
    ctx.fillText('PROLOGUE', 0, 40);
    ctx.restore();
    ctx.textAlign = 'left';
    return c;
  }

  function makePrologueTextTexture() {
    var c = makeCanvas(900, 800);
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#ead5bc';
    ctx.fillRect(0, 0, 900, 800);
    ctx.strokeStyle = 'rgba(30,21,16,0.26)';
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 28, 844, 744);

    ctx.fillStyle = '#a63d2f';
    ctx.font = '500 20px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('序厅 / 从草原来', 72, 96);
    ctx.fillStyle = '#1e1510';
    ctx.font = '400 48px "Kaiti SC", "STKaiti", "KaiTi", "LXGW WenKai", serif';
    ctx.fillText('器物的形状，先于纹饰', 70, 166);

    ctx.fillStyle = '#3a2a1e';
    ctx.font = '400 25px "PingFang SC", "Microsoft YaHei", sans-serif';
    var y = drawWrapped(ctx, EX.prologue.lead, 72, 232, 740, 42);
    ctx.fillStyle = '#6b5b4c';
    ctx.font = '400 21px "PingFang SC", "Microsoft YaHei", sans-serif';
    y = drawWrapped(ctx, EX.prologue.body[0], 72, y + 22, 730, 36);
    drawWrapped(ctx, EX.prologue.body[1], 72, y + 16, 730, 36);

    ctx.fillStyle = '#a63d2f';
    ctx.fillRect(72, 598, 100, 2);
    ctx.fillStyle = '#6b5b4c';
    ctx.font = '400 16px "SFMono-Regular", Menlo, Consolas, monospace';
    ctx.fillText('TIME LINE / 只作背景', 72, 638);
    ctx.fillStyle = '#3a2a1e';
    ctx.font = '400 19px "PingFang SC", "Microsoft YaHei", sans-serif';
    EX.prologue.timeline.forEach(function (row, i) {
      ctx.fillStyle = '#a63d2f';
      ctx.fillText(row[0], 74, 680 + i * 23);
      ctx.fillStyle = '#3a2a1e';
      ctx.fillText(row[1], 170, 680 + i * 23);
    });
    return c;
  }

  function makeTailTexture() {
    var c = makeCanvas(1300, 760);
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#ead5bc';
    ctx.fillRect(0, 0, 1300, 760);
    ctx.strokeStyle = 'rgba(30,21,16,0.26)';
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, 1228, 688);
    ctx.fillStyle = '#a63d2f';
    ctx.fillRect(70, 70, 5, 620);
    ctx.font = '500 21px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('尾厅 / CODA', 104, 112);
    ctx.fillStyle = '#1e1510';
    ctx.font = '400 78px "Kaiti SC", "STKaiti", "KaiTi", "LXGW WenKai", serif';
    ctx.fillText('器物是生活的注脚', 100, 222);
    ctx.fillStyle = '#3a2a1e';
    ctx.font = '400 26px "PingFang SC", "Microsoft YaHei", sans-serif';
    var y = drawWrapped(ctx, EX.tail.body[0], 104, 290, 1080, 44);
    y = drawWrapped(ctx, EX.tail.body[1], 104, y + 18, 1080, 44);
    ctx.fillStyle = '#7a2e24';
    ctx.font = '400 30px "Kaiti SC", "STKaiti", "KaiTi", "LXGW WenKai", serif';
    drawWrapped(ctx, '“' + EX.tail.closing + '”', 104, y + 40, 1040, 50);
    ctx.fillStyle = '#6b5b4c';
    ctx.font = '400 17px "SFMono-Regular", Menlo, Consolas, monospace';
    ctx.fillText('CREDITS / 素材授权见右上角 · 完整字段见「版权与来源.csv」', 104, 690);
    return c;
  }

  function makeHallHeaderTexture(hall) {
    var c = makeCanvas(1100, 230);
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#e6cfb3';
    ctx.fillRect(0, 0, 1100, 230);
    ctx.strokeStyle = 'rgba(30,21,16,0.32)';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 1080, 210);
    ctx.fillStyle = '#a63d2f';
    ctx.fillRect(10, 10, 7, 210);
    ctx.font = '500 22px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(hall.no + ' / ' + (hall.en || ''), 44, 60);
    ctx.fillStyle = '#1e1510';
    ctx.font = '400 74px "Kaiti SC", "STKaiti", "KaiTi", "LXGW WenKai", serif';
    ctx.fillText(hall.title, 40, 146);
    ctx.fillStyle = '#6b5b4c';
    ctx.font = '400 22px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(hall.sub || '', 44, 190);
    ctx.fillStyle = '#a63d2f';
    ctx.font = '400 15px "SFMono-Regular", Menlo, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('GRASSLAND & KILN FIRE', 1052, 188);
    ctx.textAlign = 'left';
    return c;
  }

  function makeWallPanelTexture(a, hall) {
    var c = makeCanvas(1300, 820);
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#ead5bc';
    ctx.fillRect(0, 0, 1300, 820);
    var i;
    for (i = 0; i < 700; i++) {
      var x = Math.random() * 1300;
      var y = Math.random() * 820;
      ctx.strokeStyle = 'rgba(107,91,76,' + (0.014 + Math.random() * 0.034) + ')';
      ctx.lineWidth = 0.5 + Math.random();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 3 + Math.random() * 16, y + (Math.random() - 0.5) * 1.5);
      ctx.stroke();
    }
    for (i = 0; i < 12; i++) {
      var sx = Math.random() * 1300;
      var sy = Math.random() * 820;
      var sr = 40 + Math.random() * 150;
      var sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
      sg.addColorStop(0, 'rgba(184,156,122,0.07)');
      sg.addColorStop(1, 'rgba(184,156,122,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
    }
    ctx.strokeStyle = 'rgba(30,21,16,0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(34, 34, 1232, 752);
    ctx.fillStyle = '#a63d2f';
    ctx.fillRect(66, 68, 4, 684);
    ctx.font = '500 21px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(a.wallKicker, 100, 102);
    ctx.fillStyle = '#1e1510';
    var size = fitFont(ctx, a.wallTitle, 1080, 72, '"Kaiti SC", "STKaiti", "KaiTi", "LXGW WenKai", serif');
    ctx.font = '400 ' + size + 'px "Kaiti SC", "STKaiti", "KaiTi", "LXGW WenKai", serif';
    ctx.fillText(a.wallTitle, 96, 210);
    ctx.fillStyle = '#6b5b4c';
    ctx.font = '400 18px "SFMono-Regular", Menlo, Consolas, monospace';
    ctx.fillText(a.en, 100, 250);
    ctx.fillStyle = '#a63d2f';
    ctx.fillRect(100, 280, 122, 3);
    ctx.fillStyle = '#3a2a1e';
    ctx.font = '400 30px "PingFang SC", "Microsoft YaHei", sans-serif';
    drawWrapped(ctx, a.wallText, 100, 350, 1080, 50);
    ctx.fillStyle = '#7a2e24';
    ctx.font = '400 22px "Kaiti SC", "STKaiti", "KaiTi", "LXGW WenKai", serif';
    drawWrapped(ctx, '拖动文物旋转 · 点击资料夹翻档案', 100, 580, 1000, 38);
    ctx.save();
    ctx.translate(1110, 660);
    ctx.rotate(-0.11);
    ctx.strokeStyle = '#a63d2f';
    ctx.lineWidth = 3;
    ctx.strokeRect(-58, -58, 116, 116);
    ctx.fillStyle = '#a63d2f';
    ctx.textAlign = 'center';
    ctx.font = '400 48px "Kaiti SC", "STKaiti", "KaiTi", serif';
    ctx.fillText(a.id, 0, 10);
    ctx.font = '400 11px "SFMono-Regular", Menlo, monospace';
    ctx.fillText('OBJECT', 0, 34);
    ctx.restore();
    ctx.textAlign = 'left';
    return c;
  }

  function makePlaqueTexture(a, hall) {
    var c = makeCanvas(900, 260);
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#efe3cf';
    ctx.fillRect(0, 0, 900, 260);
    ctx.strokeStyle = 'rgba(30,21,16,0.38)';
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, 876, 236);
    ctx.fillStyle = '#a63d2f';
    ctx.fillRect(12, 12, 7, 236);
    ctx.font = '500 19px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('OBJECT ' + a.id + ' · ' + hall.no + ' / ' + hall.title, 38, 52);
    var size = fitFont(ctx, a.title, 760, 50, '"Kaiti SC", "STKaiti", "KaiTi", "LXGW WenKai", serif');
    ctx.fillStyle = '#1e1510';
    ctx.font = '400 ' + size + 'px "Kaiti SC", "STKaiti", "KaiTi", "LXGW WenKai", serif';
    ctx.fillText(a.title, 36, 138);
    ctx.fillStyle = '#6b5b4c';
    ctx.font = '400 15px "SFMono-Regular", Menlo, Consolas, monospace';
    ctx.fillText(a.plaqueLine, 38, 188);
    ctx.fillStyle = '#a63d2f';
    ctx.fillRect(690, 174, 160, 3);
    return c;
  }

  function makeFolderLabelTexture(a) {
    var c = makeCanvas(700, 220);
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#f6efe3';
    ctx.fillRect(0, 0, 700, 220);
    ctx.strokeStyle = 'rgba(30,21,16,0.3)';
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, 684, 204);
    ctx.fillStyle = '#a63d2f';
    ctx.font = '500 21px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('ARCHIVE ' + a.id + ' / 点击翻档案', 34, 54);
    ctx.fillStyle = '#1e1510';
    ctx.font = '400 58px "Kaiti SC", "STKaiti", "KaiTi", "LXGW WenKai", serif';
    ctx.fillText('资料夹', 34, 132);
    ctx.fillStyle = '#6b5b4c';
    ctx.font = '400 18px "SFMono-Regular", "Source Code Pro", Menlo, monospace';
    ctx.fillText('IMAGES · VIDEO · NOTES', 34, 176);
    ctx.fillStyle = '#a63d2f';
    ctx.fillRect(566, 94, 86, 3);
    return c;
  }

  function makeShadowTexture() {
    var c = makeCanvas(256, 256);
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(128, 128, 10, 128, 128, 126);
    g.addColorStop(0, 'rgba(0,0,0,0.55)');
    g.addColorStop(0.45, 'rgba(0,0,0,0.2)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return c;
  }

  /* ------------------------------------------------------------
     Architecture
     ------------------------------------------------------------ */

  var W = 9.2;
  var HALF_W = 4.6;
  var H = 4.4;
  var Z_PROLOGUE_WALL = 6.6;
  var Z_HALL1_END = -8.8;
  var Z_HALL2_END = -24.6;
  var Z_HALL3_END = -40.4;
  var Z_TAIL_BACK = -48.5;
  var Z_ENTRANCE = 14.4;

  function buildArchitecture(ctx, world) {
    var scene = ctx.scene;
    var renderer = ctx.renderer;

    var plasterTex = makeCanvasTexture(makePlasterTexture(), 2.4, 1.2);
    plasterTex.anisotropy = ctx.maxAniso;

    var floorTex = makeCanvasTexture(makeFloorTexture(), 2.0, 2.0);
    floorTex.anisotropy = ctx.maxAniso;

    var woodTex = makeCanvasTexture(makeWoodTexture(), 2, 1);
    woodTex.anisotropy = ctx.maxAniso;

    var paperTex = makeCanvasTexture(makePaperTexture(), 2.2, 2.2);
    paperTex.anisotropy = ctx.maxAniso;

    var darkWoodMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      color: 0x3a2417,
      roughness: 0.86,
      metalness: 0.02
    });

    var brassMat = new THREE.MeshStandardMaterial({
      color: 0xb08a4a,
      roughness: 0.36,
      metalness: 0.72,
      envMap: ctx.envMap,
      envMapIntensity: 0.5
    });

    var frameMat = new THREE.MeshStandardMaterial({
      map: paperTex,
      color: 0xd9c3a6,
      roughness: 0.9,
      metalness: 0.0
    });

    var glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xe6f1ec,
      transparent: true,
      opacity: 0.042,
      roughness: 0.03,
      metalness: 0.0,
      clearcoat: 0.55,
      clearcoatRoughness: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    ctx.materials = {
      plasterTex: plasterTex,
      floorTex: floorTex,
      woodTex: woodTex,
      paperTex: paperTex,
      darkWoodMat: darkWoodMat,
      brassMat: brassMat,
      frameMat: frameMat,
      glassMat: glassMat
    };

    var segments = [
      { hallId: 'prologue', z0: Z_ENTRANCE, z1: Z_PROLOGUE_WALL },
      { hallId: 'hall1', z0: Z_PROLOGUE_WALL, z1: Z_HALL1_END },
      { hallId: 'hall2', z0: Z_HALL1_END, z1: Z_HALL2_END },
      { hallId: 'hall3', z0: Z_HALL2_END, z1: Z_HALL3_END },
      { hallId: 'tail', z0: Z_HALL3_END, z1: Z_TAIL_BACK }
    ];

    segments.forEach(function (seg) {
      var hall = seg.hallId === 'prologue' ? { mood: PROLOGUE_MOOD } : findHall(seg.hallId);
      var mood = seg.hallId === 'prologue' ? PROLOGUE_MOOD : hall.mood;
      var len = seg.z0 - seg.z1;
      var center = (seg.z0 + seg.z1) / 2;

      var wallColor = new THREE.Color(mood.wall || 0x6a4c35);
      var floorColor = new THREE.Color(seg.hallId === 'hall1' ? 0x8a6446 : seg.hallId === 'hall2' ? 0x827568 : seg.hallId === 'hall3' ? 0x5a5046 : seg.hallId === 'tail' ? 0xa37e59 : 0x967456);
      var ceilingColor = new THREE.Color(mood.ceiling || 0x24170e);

      var wallMat = new THREE.MeshStandardMaterial({
        map: plasterTex,
        color: wallColor,
        roughness: 0.96,
        metalness: 0.0
      });
      var floorMat = new THREE.MeshStandardMaterial({
        map: floorTex,
        color: floorColor,
        roughness: 0.72,
        metalness: 0.02
      });
      var ceilingMat = new THREE.MeshStandardMaterial({
        color: ceilingColor,
        roughness: 1.0,
        metalness: 0.0
      });

      var rightWall = new THREE.Mesh(new THREE.PlaneGeometry(len, H), wallMat);
      rightWall.position.set(HALF_W, H / 2, center);
      rightWall.rotation.y = -Math.PI / 2;
      rightWall.receiveShadow = true;
      world.add(rightWall);

      var leftWall = new THREE.Mesh(new THREE.PlaneGeometry(len, H), wallMat);
      leftWall.position.set(-HALF_W, H / 2, center);
      leftWall.rotation.y = Math.PI / 2;
      leftWall.receiveShadow = true;
      world.add(leftWall);

      var floor = new THREE.Mesh(new THREE.PlaneGeometry(W, len), floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(0, 0, center);
      floor.receiveShadow = true;
      world.add(floor);

      var ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W, len), ceilingMat);
      ceiling.rotation.x = Math.PI / 2;
      ceiling.position.set(0, H, center);
      world.add(ceiling);

      [1, -1].forEach(function (side) {
        var base = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.2, len), darkWoodMat);
        base.position.set(side * (HALF_W - 0.035), 0.1, center);
        base.receiveShadow = true;
        world.add(base);

        var rail = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.035, len), brassMat);
        rail.position.set(side * (HALF_W - 0.06), 1.12, center);
        world.add(rail);
      });

      var lightMat = new THREE.MeshBasicMaterial({ color: 0xffe0b4 });
      var n = Math.max(2, Math.floor(len / 3.2));
      for (var i = 0; i < n; i++) {
        var z = seg.z1 + (i + 0.5) * (len / n);
        var strip = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.03, 0.075), lightMat);
        strip.position.set(0, H - 0.045, z);
        world.add(strip);
      }
    });

    buildPortal(scene, world, Z_PROLOGUE_WALL, findHall('hall1'), true, darkWoodMat, brassMat, ctx);
    buildPortal(scene, world, Z_HALL1_END, findHall('hall2'), false, darkWoodMat, brassMat, ctx);
    buildPortal(scene, world, Z_HALL2_END, findHall('hall3'), false, darkWoodMat, brassMat, ctx);
    buildPortal(scene, world, Z_HALL3_END, findHall('tail'), false, darkWoodMat, brassMat, ctx);

    /* Entrance wall behind the visitor: closes the room. */
    var entranceWall = new THREE.Mesh(
      new THREE.BoxGeometry(W, H, 0.24),
      new THREE.MeshStandardMaterial({ map: plasterTex, color: 0x5a4030, roughness: 0.96 })
    );
    entranceWall.position.set(0, H / 2, Z_ENTRANCE);
    entranceWall.receiveShadow = true;
    world.add(entranceWall);

    var entranceDoor = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 3.2, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x130d08, roughness: 0.95 })
    );
    entranceDoor.position.set(0, 1.6, Z_ENTRANCE - 0.17);
    world.add(entranceDoor);

    /* Tail back wall */
    var tailHall = findHall('tail');
    var tailMood = TAIL_MOOD;
    var tailWall = new THREE.Mesh(
      new THREE.BoxGeometry(W, H, 0.24),
      new THREE.MeshStandardMaterial({
        map: plasterTex,
        color: new THREE.Color(tailMood.wall || 0x87674b),
        roughness: 0.95
      })
    );
    tailWall.position.set(0, H / 2, Z_TAIL_BACK);
    tailWall.receiveShadow = true;
    world.add(tailWall);

    var tailPanelTex = makeCanvasTexture(makeTailTexture());
    tailPanelTex.anisotropy = ctx.maxAniso;
    var tailPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(6.2, 3.62),
      new THREE.MeshBasicMaterial({ map: tailPanelTex })
    );
    tailPanel.position.set(0, 2.28, Z_TAIL_BACK + 0.14);
    world.add(tailPanel);

    var tailFrame = new THREE.Mesh(new THREE.BoxGeometry(6.38, 3.8, 0.08), darkWoodMat);
    tailFrame.position.set(0, 2.28, Z_TAIL_BACK + 0.09);
    world.add(tailFrame);

    /* Tail bench */
    var bench = new THREE.Group();
    var seat = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 0.62), darkWoodMat);
    seat.position.y = 0.46;
    seat.castShadow = true;
    seat.receiveShadow = true;
    bench.add(seat);
    [[-1.35, -0.2], [1.35, -0.2], [-1.35, 0.2], [1.35, 0.2]].forEach(function (p) {
      var leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.46, 0.08), darkWoodMat);
      leg.position.set(p[0], 0.23, p[1]);
      leg.castShadow = true;
      bench.add(leg);
    });
    bench.position.set(0, 0, -45.2);
    world.add(bench);

    /* Red route thread on the floor */
    var routePoints = [];
    var zs = [14.0, Z_PROLOGUE_WALL, 2.2, -4.6, Z_HALL1_END, -13.8, -20.2, Z_HALL2_END, -29.6, -36.0, Z_HALL3_END, -45.2, -47.4];
    zs.forEach(function (z, i) {
      routePoints.push(new THREE.Vector3(Math.sin(i * 0.7) * 0.12, 0.012, z));
    });
    var routeCurve = new THREE.CatmullRomCurve3(routePoints);
    var routeTube = new THREE.Mesh(
      new THREE.TubeGeometry(routeCurve, 180, 0.011, 5, false),
      new THREE.MeshBasicMaterial({ color: 0xa63d2f })
    );
    world.add(routeTube);

    [2.2, -4.6, -13.8, -20.2, -29.6, -36.0].forEach(function (z) {
      var tick = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.004, 0.012),
        new THREE.MeshBasicMaterial({ color: 0xa63d2f })
      );
      tick.position.set(0, 0.014, z);
      world.add(tick);
    });

    /* Wall panels for the six objects */
    EX.artifacts.forEach(function (a) {
      var hall = findHall(a.hall);
      var panelTex = makeCanvasTexture(makeWallPanelTexture(a, hall));
      panelTex.anisotropy = ctx.maxAniso;
      var panel = new THREE.Mesh(
        new THREE.PlaneGeometry(3.0, 1.89),
        new THREE.MeshBasicMaterial({ map: panelTex })
      );
      panel.position.set(a.side * (HALF_W - 0.065), 2.52, a.z - 0.05);
      panel.rotation.y = -a.side * Math.PI / 2;
      world.add(panel);

      var frame = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 2.04, 3.14),
        darkWoodMat
      );
      frame.position.set(a.side * (HALF_W - 0.015), 2.52, a.z - 0.05);
      world.add(frame);
    });

    /* Ceiling pilasters at hall boundaries */
    [Z_PROLOGUE_WALL, Z_HALL1_END, Z_HALL2_END, Z_HALL3_END].forEach(function (z) {
      [1, -1].forEach(function (side) {
        var pilaster = new THREE.Mesh(new THREE.BoxGeometry(0.18, H, 0.3), darkWoodMat);
        pilaster.position.set(side * (HALF_W - 0.09), H / 2, z);
        world.add(pilaster);
      });
    });

    buildProloguePanels(scene, world, darkWoodMat, ctx);
  }

  function buildPortal(scene, world, z, nextHall, isPrologue, darkWoodMat, brassMat, ctx) {
    var portalW = 3.45;
    var portalH = 3.25;
    var sideW = (W - portalW) / 2;

    var left = new THREE.Mesh(
      new THREE.BoxGeometry(sideW, H, 0.24),
      new THREE.MeshStandardMaterial({ color: isPrologue ? 0x6b4c35 : 0x4a3a2c, roughness: 0.95 })
    );
    left.position.set(-(portalW / 2 + sideW / 2), H / 2, z);
    world.add(left);

    var right = new THREE.Mesh(
      new THREE.BoxGeometry(sideW, H, 0.24),
      new THREE.MeshStandardMaterial({ color: isPrologue ? 0x6b4c35 : 0x4a3a2c, roughness: 0.95 })
    );
    right.position.set(portalW / 2 + sideW / 2, H / 2, z);
    world.add(right);

    var header = new THREE.Mesh(
      new THREE.BoxGeometry(portalW, H - portalH, 0.24),
      new THREE.MeshStandardMaterial({ color: isPrologue ? 0x6b4c35 : 0x4a3a2c, roughness: 0.95 })
    );
    header.position.set(0, portalH + (H - portalH) / 2, z);
    world.add(header);

    [1, -1].forEach(function (side) {
      var post = new THREE.Mesh(new THREE.BoxGeometry(0.13, portalH, 0.18), darkWoodMat);
      post.position.set(side * (portalW / 2 - 0.06), portalH / 2, z + 0.02);
      world.add(post);
      var brass = new THREE.Mesh(new THREE.BoxGeometry(0.025, portalH - 0.1, 0.03), brassMat);
      brass.position.set(side * (portalW / 2 - 0.135), portalH / 2, z + 0.13);
      world.add(brass);
    });

    var beam = new THREE.Mesh(new THREE.BoxGeometry(portalW, 0.14, 0.2), darkWoodMat);
    beam.position.set(0, portalH - 0.07, z + 0.02);
    world.add(beam);

    var threshold = new THREE.Mesh(
      new THREE.BoxGeometry(portalW, 0.02, 0.16),
      new THREE.MeshBasicMaterial({ color: 0xb08a4a })
    );
    threshold.position.set(0, 0.011, z);
    world.add(threshold);

    var headerTex = makeCanvasTexture(makeHallHeaderTexture(nextHall));
    headerTex.anisotropy = ctx.maxAniso;
    var plaque = new THREE.Mesh(
      new THREE.PlaneGeometry(3.18, 0.66),
      new THREE.MeshBasicMaterial({ map: headerTex })
    );
    plaque.position.set(0, portalH + 0.42, z + 0.135);
    world.add(plaque);
  }

  function buildProloguePanels(scene, world, darkWoodMat, ctx) {
    var titleTex = makeCanvasTexture(makePrologueTitleTexture());
    titleTex.anisotropy = ctx.maxAniso;
    var titlePanel = new THREE.Mesh(
      new THREE.PlaneGeometry(2.3, 2.04),
      new THREE.MeshBasicMaterial({ map: titleTex })
    );
    titlePanel.position.set(2.92, 2.26, Z_PROLOGUE_WALL + 0.16);
    world.add(titlePanel);

    var titleFrame = new THREE.Mesh(new THREE.BoxGeometry(2.44, 2.18, 0.07), darkWoodMat);
    titleFrame.position.set(2.92, 2.26, Z_PROLOGUE_WALL + 0.12);
    world.add(titleFrame);

    var textTex = makeCanvasTexture(makePrologueTextTexture());
    textTex.anisotropy = ctx.maxAniso;
    var textPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(2.3, 2.04),
      new THREE.MeshBasicMaterial({ map: textTex })
    );
    textPanel.position.set(-2.92, 2.26, Z_PROLOGUE_WALL + 0.16);
    world.add(textPanel);

    var textFrame = new THREE.Mesh(new THREE.BoxGeometry(2.44, 2.18, 0.07), darkWoodMat);
    textFrame.position.set(-2.92, 2.26, Z_PROLOGUE_WALL + 0.12);
    world.add(textFrame);
  }

  /* ------------------------------------------------------------
     Stations: plinth, vitrine, plaque, folder
     ------------------------------------------------------------ */

  function buildStations(ctx, world) {
    var stations = {};
    EX.artifacts.forEach(function (a) {
      var hall = findHall(a.hall);
      stations[a.id] = buildStation(ctx, world, a, hall);
    });
    return stations;
  }

  function buildStation(ctx, world, a, hall) {
    var side = a.side;
    var group = new THREE.Group();
    group.position.set(side * 2.98, 0, a.z);
    world.add(group);

    var materials = ctx.materials;
    var woodMat = new THREE.MeshStandardMaterial({
      map: materials.woodTex,
      color: 0x7a5236,
      roughness: 0.74,
      metalness: 0.03
    });
    var darkWoodMat = materials.darkWoodMat;

    var plinth = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.55, 1.72), woodMat);
    plinth.position.y = 0.275;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    group.add(plinth);

    var topSlab = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.055, 1.8), darkWoodMat);
    topSlab.position.y = 0.572;
    topSlab.castShadow = true;
    topSlab.receiveShadow = true;
    group.add(topSlab);

    var shadowTex = makeCanvasTexture(makeShadowTexture());
    shadowTex.anisotropy = 4;
    var shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.3, 1.3),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.68, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.604;
    group.add(shadow);

    var modelGroup = new THREE.Group();
    modelGroup.position.y = 0.6;
    modelGroup.userData.pickType = 'artifact';
    modelGroup.userData.artifactId = a.id;
    modelGroup.scale.setScalar(a.scale || 1);
    group.add(modelGroup);

    var model = buildModel(ctx, a, modelGroup);
    var spinner = null;
    if (model && model.spinner) spinner = model.spinner;

    var plaqueTex = makeCanvasTexture(makePlaqueTexture(a, hall), false, false);
    plaqueTex.anisotropy = ctx.maxAniso;
    var plaque = new THREE.Mesh(
      new THREE.PlaneGeometry(0.72, 0.208),
      new THREE.MeshBasicMaterial({ map: plaqueTex })
    );
    plaque.position.set(-side * 0.626, 0.33, 0);
    plaque.rotation.y = -side * Math.PI / 2;
    group.add(plaque);

    /* Glass vitrine */
    var glass = new THREE.Mesh(new THREE.BoxGeometry(1.34, 1.62, 1.72), materials.glassMat);
    glass.position.y = 1.385;
    glass.castShadow = false;
    group.add(glass);

    var frameMat = materials.brassMat;
    [[-0.67, -0.86], [0.67, -0.86]].forEach(function (p) {
      var post = new THREE.Mesh(new THREE.BoxGeometry(0.022, 1.62, 0.022), frameMat);
      post.position.set(p[0], 1.385, p[1]);
      group.add(post);
    });
    [[-0.67, 0.86], [0.67, 0.86]].forEach(function (p) {
      var post = new THREE.Mesh(new THREE.BoxGeometry(0.018, 1.62, 0.018), materials.glassMat);
      post.position.set(p[0], 1.385, p[1]);
      group.add(post);
    });
    [
      [1.36, 0.025, 0.022, 0, 0.86],
      [1.36, 0.025, 0.022, 0, -0.86],
      [0.022, 0.025, 1.74, 0.67, 0],
      [0.022, 0.025, 1.74, -0.67, 0]
    ].forEach(function (bar) {
      var piece = new THREE.Mesh(new THREE.BoxGeometry(bar[0], bar[1], bar[2]), frameMat);
      piece.position.set(bar[3], 2.195, bar[4]);
      group.add(piece);
    });
    var baseFrame = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.02, 1.72), frameMat);
    baseFrame.position.y = 0.575;
    group.add(baseFrame);

    /* Folder table */
    var folderData = buildFolder(ctx, a, group, side);
    group.userData.folderHit = folderData.hit;
    group.userData.folderLabel = folderData.label;

    return {
      id: a.id,
      group: group,
      modelGroup: modelGroup,
      spinner: spinner,
      folderHit: folderData.hit,
      folderLabel: folderData.label,
      artifact: a
    };
  }

  function buildFolder(ctx, a, parent, side) {
    var group = new THREE.Group();
    var table = new THREE.Group();
    table.position.set(-side * 1.02, 0, -1.12);
    table.rotation.y = -side * 0.92;

    var woodMat = new THREE.MeshStandardMaterial({
      map: ctx.materials.woodTex,
      color: 0x6b482f,
      roughness: 0.8,
      metalness: 0.02
    });
    var darkWoodMat = ctx.materials.darkWoodMat;

    var tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.055, 0.72), woodMat);
    tableTop.position.y = 0.74;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    table.add(tableTop);

    [[-0.46, -0.26], [0.46, -0.26], [-0.46, 0.26], [0.46, 0.26]].forEach(function (p) {
      var leg = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.74, 0.045), darkWoodMat);
      leg.position.set(p[0], 0.37, p[1]);
      leg.castShadow = true;
      leg.receiveShadow = true;
      table.add(leg);
    });

    var shelf = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.022, 0.54), darkWoodMat);
    shelf.position.y = 0.18;
    table.add(shelf);

    var folderGroup = new THREE.Group();
    folderGroup.position.set(0, 0.78, 0);

    var folderBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.88, 0.014, 0.64),
      new THREE.MeshStandardMaterial({ color: 0xc2a172, roughness: 0.9 })
    );
    folderBase.castShadow = true;
    folderBase.receiveShadow = true;
    folderGroup.add(folderBase);

    var paperMat = new THREE.MeshStandardMaterial({ color: 0xece2d2, roughness: 0.95 });
    [[-0.19, -0.03, 0.34, 0.26], [0.19, -0.03, 0.34, 0.26], [0, 0.20, 0.28, 0.20]].forEach(function (p) {
      var sheet = new THREE.Mesh(new THREE.BoxGeometry(p[2], 0.004, p[3]), paperMat);
      sheet.position.set(p[0], 0.011, p[1]);
      sheet.rotation.y = p[0] * 0.08;
      sheet.castShadow = true;
      sheet.receiveShadow = true;
      folderGroup.add(sheet);
    });

    var printSources = [a.images[0], a.images[1] || a.images[0]].map(function (im) {
      var embedded = window.EXHIBIT_PRINTS && window.EXHIBIT_PRINTS[im.src];
      return embedded ? { src: embedded } : im;
    });
    var printSpecs = [
      { x: -0.19, z: -0.035, w: 0.28, h: 0.21 },
      { x: 0.19, z: -0.035, w: 0.28, h: 0.18 }
    ];
    printSources.forEach(function (imgData, i) {
      if (!imgData) return;
      var p = printSpecs[i];
      var backing = new THREE.Mesh(
        new THREE.PlaneGeometry(p.w + 0.028, p.h + 0.028),
        new THREE.MeshStandardMaterial({ color: 0xf8f3e9, roughness: 0.92 })
      );
      backing.rotation.x = -Math.PI / 2;
      backing.position.set(p.x, 0.014, p.z);
      folderGroup.add(backing);

      var mat = new THREE.MeshBasicMaterial({ color: 0xd8cabb });
      var print = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.h), mat);
      print.rotation.x = -Math.PI / 2;
      print.position.set(p.x, 0.016, p.z);
      folderGroup.add(print);

      new THREE.TextureLoader().load(imgData.src, function (tex) {
        tex.encoding = THREE.sRGBEncoding;
        tex.anisotropy = ctx.maxAniso;
        tex.minFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        mat.map = tex;
        mat.color.setHex(0xffffff);
        mat.needsUpdate = true;
      }, undefined, function () { /* keep paper backing */ });
    });

    var thread = new THREE.Mesh(
      new THREE.BoxGeometry(0.74, 0.003, 0.006),
      new THREE.MeshBasicMaterial({ color: 0xa63d2f })
    );
    thread.position.set(0, 0.019, 0.07);
    folderGroup.add(thread);

    var tab = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.012, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xd8c2a8, roughness: 0.9 })
    );
    tab.position.set(-0.31, 0.014, -0.35);
    folderGroup.add(tab);

    var labelTex = makeCanvasTexture(makeFolderLabelTexture(a));
    labelTex.anisotropy = ctx.maxAniso;
    var label = new THREE.Mesh(
      new THREE.PlaneGeometry(0.62, 0.194),
      new THREE.MeshBasicMaterial({ map: labelTex, side: THREE.DoubleSide })
    );
    label.position.set(0, 0.17, 0.34);
    label.rotation.x = -0.11;
    folderGroup.add(label);

    var labelStand = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, 0.16, 0.016),
      ctx.materials.brassMat
    );
    labelStand.position.set(0, 0.08, 0.31);
    labelStand.rotation.x = -0.1;
    folderGroup.add(labelStand);

    var hit = new THREE.Mesh(
      new THREE.BoxGeometry(0.98, 0.28, 0.76),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    hit.position.set(0, 0.12, 0.01);
    hit.userData.pickType = 'folder';
    hit.userData.artifactId = a.id;
    folderGroup.add(hit);

    table.add(folderGroup);
    parent.add(table);

    return { hit: hit, label: label };
  }

  /* ------------------------------------------------------------
     Models
     ------------------------------------------------------------ */

  function buildModel(ctx, a, parent) {
    if (a.model === 'stemCup') return buildStemCup(ctx, a, parent);
    if (a.model === 'phoenixEwer') return buildPhoenixEwer(ctx, a, parent);
    if (a.model === 'dish') return buildDish(ctx, a, parent);
    if (a.model === 'spinningCup') return buildSpinningCup(ctx, a, parent);
    if (a.model === 'cizhouJar') return buildCizhouJar(ctx, a, parent);
    if (a.model === 'blueYi') return buildBlueYi(ctx, a, parent);
    return null;
  }

  function porcelainMat(ctx, color) {
    return new THREE.MeshPhysicalMaterial({
      color: color == null ? 0xeee8dd : color,
      roughness: 0.24,
      metalness: 0.0,
      clearcoat: 0.62,
      clearcoatRoughness: 0.18,
      envMap: ctx.envMap,
      envMapIntensity: 0.6
    });
  }

  function buildStemCup(ctx, a, parent) {
    var whiteCeramic = porcelainMat(ctx, 0xeee8dd);
    var innerCeramic = porcelainMat(ctx, 0xeee8dd);
    innerCeramic.side = THREE.BackSide;
    var bowlMat = porcelainMat(ctx, 0xffffff);
    loadDataTexture(TEX['01_dragonBand'], ctx.maxAniso, function (tex) {
      tex.wrapS = THREE.RepeatWrapping;
      tex.repeat.set(2, 1);
      tex.offset.x = 0.04;
      bowlMat.map = tex;
      bowlMat.needsUpdate = true;
    });

    var cupGroup = new THREE.Group();
    parent.add(cupGroup);

    var foot = new THREE.Mesh(new THREE.CylinderGeometry(0.252, 0.272, 0.018, 64), whiteCeramic);
    foot.position.y = 0.009;
    foot.castShadow = true;
    foot.receiveShadow = true;
    cupGroup.add(foot);

    var stemProfile = [
      new THREE.Vector2(0.001, 0.0),
      new THREE.Vector2(0.215, 0.0),
      new THREE.Vector2(0.248, 0.012),
      new THREE.Vector2(0.236, 0.03),
      new THREE.Vector2(0.162, 0.06),
      new THREE.Vector2(0.126, 0.1),
      new THREE.Vector2(0.116, 0.16),
      new THREE.Vector2(0.138, 0.192),
      new THREE.Vector2(0.118, 0.222),
      new THREE.Vector2(0.106, 0.3),
      new THREE.Vector2(0.134, 0.34),
      new THREE.Vector2(0.111, 0.38),
      new THREE.Vector2(0.101, 0.46),
      new THREE.Vector2(0.127, 0.5),
      new THREE.Vector2(0.108, 0.54),
      new THREE.Vector2(0.132, 0.59),
      new THREE.Vector2(0.205, 0.62)
    ];
    var stem = new THREE.Mesh(new THREE.LatheGeometry(stemProfile, 80), whiteCeramic);
    stem.castShadow = true;
    stem.receiveShadow = true;
    cupGroup.add(stem);

    var bowlProfile = [
      new THREE.Vector2(0.001, 0.615),
      new THREE.Vector2(0.195, 0.62),
      new THREE.Vector2(0.26, 0.645),
      new THREE.Vector2(0.34, 0.685),
      new THREE.Vector2(0.42, 0.735),
      new THREE.Vector2(0.50, 0.79),
      new THREE.Vector2(0.57, 0.86),
      new THREE.Vector2(0.615, 0.94),
      new THREE.Vector2(0.638, 1.015),
      new THREE.Vector2(0.642, 1.075)
    ];
    var bowl = new THREE.Mesh(new THREE.LatheGeometry(bowlProfile, 80), bowlMat);
    bowl.castShadow = true;
    bowl.receiveShadow = true;
    cupGroup.add(bowl);

    var innerProfile = [
      new THREE.Vector2(0.628, 1.072),
      new THREE.Vector2(0.605, 1.005),
      new THREE.Vector2(0.575, 0.94),
      new THREE.Vector2(0.52, 0.865),
      new THREE.Vector2(0.45, 0.79),
      new THREE.Vector2(0.36, 0.72),
      new THREE.Vector2(0.25, 0.67),
      new THREE.Vector2(0.001, 0.645)
    ];
    var inner = new THREE.Mesh(new THREE.LatheGeometry(innerProfile, 80), innerCeramic);
    inner.receiveShadow = true;
    cupGroup.add(inner);

    var rim = new THREE.Mesh(new THREE.TorusGeometry(0.636, 0.011, 10, 80), whiteCeramic);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 1.073;
    rim.castShadow = true;
    cupGroup.add(rim);

    var blueMat = new THREE.MeshStandardMaterial({
      color: 0x2e4e7e,
      roughness: 0.3,
      metalness: 0.04,
      envMap: ctx.envMap,
      envMapIntensity: 0.5
    });
    var rimLine = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.0035, 6, 80), blueMat);
    rimLine.rotation.x = Math.PI / 2;
    rimLine.position.y = 1.045;
    cupGroup.add(rimLine);

    var footLine = new THREE.Mesh(
      new THREE.TorusGeometry(0.263, 0.004, 6, 64),
      new THREE.MeshStandardMaterial({ color: 0xb89c7a, roughness: 0.82, metalness: 0 })
    );
    footLine.rotation.x = Math.PI / 2;
    footLine.position.y = 0.006;
    cupGroup.add(footLine);

    cupGroup.rotation.y = -0.35;
    return { group: cupGroup };
  }

  function makePhoenixBodyTexture(maxAniso) {
    var c = makeCanvas(1024, 1024);
    var x = c.getContext('2d');
    var base = x.createLinearGradient(0, 0, 0, 1024);
    base.addColorStop(0, '#e9dfcb');
    base.addColorStop(0.24, '#f6efdf');
    base.addColorStop(0.52, '#fbf6e9');
    base.addColorStop(0.8, '#f1e7d4');
    base.addColorStop(1, '#e2d7c1');
    x.fillStyle = base;
    x.fillRect(0, 0, 1024, 1024);

    var i;
    for (i = 0; i < 300; i++) {
      x.fillStyle = 'rgba(120,100,72,' + (0.012 + Math.random() * 0.03) + ')';
      x.beginPath();
      x.arc(Math.random() * 1024, Math.random() * 1024, 0.5 + Math.random() * 1.5, 0, Math.PI * 2);
      x.fill();
    }

    [286, 742].forEach(function (y) {
      x.strokeStyle = 'rgba(33,64,116,0.68)';
      x.lineWidth = 3.2;
      x.beginPath();
      x.moveTo(0, y);
      x.lineTo(1024, y);
      x.stroke();
    });
    for (i = 0; i < 34; i++) {
      x.fillStyle = 'rgba(33,64,116,0.5)';
      x.beginPath();
      x.arc(16 + i * 30, 756, 2.2, 0, Math.PI * 2);
      x.fill();
    }

    var tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = maxAniso || 4;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    return tex;
  }

  function makePhoenixDecalTexture(maxAniso) {
    var c = makeCanvas(1024, 640);
    var x = c.getContext('2d');
    x.clearRect(0, 0, 1024, 640);
    var blue = '#1d3c70';

    function ribbon(pts, width, alpha) {
      x.beginPath();
      x.moveTo(pts[0][0], pts[0][1]);
      x.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]);
      x.strokeStyle = alpha ? 'rgba(23,50,95,' + alpha + ')' : blue;
      x.lineWidth = width;
      x.lineCap = 'round';
      x.stroke();
    }

    function glyph(cx, cy, s, flip) {
      x.save();
      x.translate(cx, cy);
      x.scale(flip ? -s : s, s);
      x.strokeStyle = 'rgba(35,68,122,0.52)';
      x.lineWidth = 5;
      x.lineCap = 'round';
      x.beginPath();
      x.moveTo(-80, 20);
      x.bezierCurveTo(-70, -16, -28, -24, -14, 6);
      x.bezierCurveTo(-4, 28, 24, 26, 34, 0);
      x.bezierCurveTo(44, -22, 76, -16, 86, 6);
      x.stroke();
      x.beginPath();
      x.arc(-42, 8, 15, 0.4, 4.7);
      x.stroke();
      x.beginPath();
      x.arc(22, 8, 11, 0.2, 4.3);
      x.stroke();
      x.restore();
    }

    /* Tail ribbons, behind the body. */
    ribbon([[-470, 30], [-190, -40], [60, 180], [430, 150]], 30, 0.9);
    ribbon([[-500, 110], [-180, 40], [80, 250], [420, 230]], 28, 0.82);
    ribbon([[-510, 195], [-220, 140], [40, 330], [400, 310]], 24, 0.7);

    var tailBarbs = 0;
    for (tailBarbs = 0; tailBarbs < 18; tailBarbs++) {
      var u = 0.1 + tailBarbs * 0.05;
      var bx = 430 - 900 * u;
      var by = 150 + (30 - 150) * u + Math.sin(u * 3.1) * 40;
      x.beginPath();
      x.moveTo(bx, by);
      x.quadraticCurveTo(bx - 18, by + 22, bx - 32, by + 30);
      x.strokeStyle = 'rgba(23,50,95,0.62)';
      x.lineWidth = 4;
      x.stroke();
    }

    /* Painted body. */
    var bodyGrad = x.createRadialGradient(590, 300, 30, 580, 340, 190);
    bodyGrad.addColorStop(0, '#2d5691');
    bodyGrad.addColorStop(0.65, '#21457b');
    bodyGrad.addColorStop(1, '#16305a');
    x.beginPath();
    x.ellipse(570, 350, 158, 96, -0.12, 0, Math.PI * 2);
    x.fillStyle = bodyGrad;
    x.fill();

    /* Neck stump at the right edge, pointing toward the sculpted head. */
    x.beginPath();
    x.moveTo(680, 330);
    x.bezierCurveTo(760, 300, 820, 220, 848, 135);
    x.strokeStyle = '#21457b';
    x.lineWidth = 46;
    x.lineCap = 'round';
    x.stroke();
    x.beginPath();
    x.moveTo(700, 300);
    x.bezierCurveTo(770, 270, 810, 205, 836, 150);
    x.strokeStyle = 'rgba(247,240,226,0.4)';
    x.lineWidth = 4;
    x.stroke();

    /* Wing: five broad feathers sweeping back. */
    var angles = [Math.PI - 0.46, Math.PI - 0.29, Math.PI - 0.12, Math.PI + 0.06, Math.PI + 0.23];
    var lengths = [300, 344, 362, 330, 276];
    var widths = [34, 38, 40, 36, 30];
    var wing;
    for (wing = 0; wing < 5; wing++) {
      x.save();
      x.translate(650, 300 + wing * 6);
      x.rotate(angles[wing]);
      x.beginPath();
      x.moveTo(0, 0);
      x.quadraticCurveTo(lengths[wing] * 0.42, -widths[wing], lengths[wing], 0);
      x.quadraticCurveTo(lengths[wing] * 0.42, widths[wing], 0, 0);
      x.closePath();
      x.fillStyle = wing % 2 ? '#244a83' : '#1b3968';
      x.fill();
      x.beginPath();
      x.moveTo(8, 0);
      x.quadraticCurveTo(lengths[wing] * 0.5, 0, lengths[wing] * 0.93, 0);
      x.strokeStyle = 'rgba(247,240,226,0.5)';
      x.lineWidth = 3;
      x.stroke();
      /* barbs */
      var b;
      for (b = 0; b < 5; b++) {
        var t = 0.25 + b * 0.14;
        var px = lengths[wing] * t;
        x.beginPath();
        x.moveTo(px, 0);
        x.lineTo(px - 14, -widths[wing] * 0.42);
        x.moveTo(px, 0);
        x.lineTo(px - 14, widths[wing] * 0.42);
        x.strokeStyle = 'rgba(247,240,226,0.42)';
        x.lineWidth = 2;
        x.stroke();
      }
      x.restore();
    }

    /* Small covert feathers over the shoulder. */
    var cov;
    for (cov = 0; cov < 4; cov++) {
      x.beginPath();
      x.ellipse(560 - cov * 34, 300 + cov * 22, 52, 20, -0.3 + cov * 0.1, 0, Math.PI * 2);
      x.strokeStyle = 'rgba(247,240,226,0.45)';
      x.lineWidth = 3;
      x.stroke();
    }

    glyph(190, 120, 0.9, false);
    glyph(880, 480, 0.7, true);
    glyph(830, 100, 0.55, true);

    var tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = maxAniso || 4;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    return tex;
  }

  function buildPhoenixEwer(ctx, a, parent) {
    var g = new THREE.Group();
    parent.add(g);

    var white = porcelainMat(ctx, 0xefe5d2);
    var bodyMat = porcelainMat(ctx, 0xffffff);
    bodyMat.map = makePhoenixBodyTexture(ctx.maxAniso);
    bodyMat.needsUpdate = true;
    var blue = new THREE.MeshPhysicalMaterial({
      color: 0x223d68,
      roughness: 0.24,
      metalness: 0.02,
      clearcoat: 0.5,
      clearcoatRoughness: 0.18,
      envMap: ctx.envMap,
      envMapIntensity: 0.45
    });
    var blueLine = new THREE.MeshStandardMaterial({
      color: 0x2b4a7a,
      roughness: 0.34,
      metalness: 0.02,
      envMap: ctx.envMap,
      envMapIntensity: 0.3
    });
    var gold = new THREE.MeshStandardMaterial({
      color: 0xc9a23f,
      roughness: 0.32,
      metalness: 0.55,
      envMap: ctx.envMap,
      envMapIntensity: 0.45
    });

    /* Flattened flask body, with a painted phoenix on each broad face. */
    var body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 64, 48), bodyMat);
    body.scale.set(0.5, 0.84, 0.96);
    body.position.y = 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);

    /* Curved decal patches follow the flattened body, so the painted
       phoenix keeps its proportions without a pasted-on rectangle. */
    var decalTex = makePhoenixDecalTexture(ctx.maxAniso);
    var decalMat = new THREE.MeshStandardMaterial({
      map: decalTex,
      transparent: true,
      alphaTest: 0.01,
      roughness: 0.34,
      metalness: 0.0,
      envMap: ctx.envMap,
      envMapIntensity: 0.26,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      depthWrite: false
    });
    var patchGeoA = new THREE.SphereGeometry(0.5, 96, 64, -0.95, 1.9, 0.5, 2.1);
    var patchA = new THREE.Mesh(patchGeoA, decalMat);
    patchA.scale.set(0.505, 0.848, 0.97);
    patchA.position.y = 0.5;
    g.add(patchA);

    var decalTexB = decalTex.clone();
    decalTexB.needsUpdate = true;
    decalTexB.wrapS = THREE.RepeatWrapping;
    decalTexB.repeat.x = -1;
    decalTexB.offset.x = 1;
    var decalMatB = decalMat.clone();
    decalMatB.map = decalTexB;
    decalMatB.needsUpdate = true;
    var patchGeoB = new THREE.SphereGeometry(0.5, 96, 64, Math.PI - 0.95, 1.9, 0.5, 2.1);
    var patchB = new THREE.Mesh(patchGeoB, decalMatB);
    patchB.scale.set(0.505, 0.848, 0.97);
    patchB.position.y = 0.5;
    g.add(patchB);

    var foot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.07, 48), white);
    foot.position.y = 0.035;
    foot.castShadow = true;
    g.add(foot);

    var neck = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.12, 0.16, 40), white);
    neck.position.y = 0.95;
    neck.castShadow = true;
    g.add(neck);

    var collar = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.012, 8, 40), blueLine);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 1.02;
    g.add(collar);

    var mouth = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.055, 48), white);
    mouth.position.y = 1.05;
    mouth.castShadow = true;
    g.add(mouth);
    var mouthRim = new THREE.Mesh(new THREE.TorusGeometry(0.153, 0.008, 8, 48), blueLine);
    mouthRim.rotation.x = Math.PI / 2;
    mouthRim.position.y = 1.077;
    g.add(mouthRim);

    /* Phoenix head as the pouring spout, at +z. White neck and head,
       blue beak and crest: closer to a vessel than a toy bird. */
    var neckCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.87, 0.28),
      new THREE.Vector3(0, 0.97, 0.39),
      new THREE.Vector3(0, 1.03, 0.47)
    ]);
    var phoenixNeck = new THREE.Mesh(new THREE.TubeGeometry(neckCurve, 28, 0.055, 12, false), white);
    phoenixNeck.castShadow = true;
    g.add(phoenixNeck);

    var neckBand = new THREE.Mesh(new THREE.TorusGeometry(0.057, 0.007, 6, 24), blueLine);
    neckBand.rotation.x = Math.PI / 2;
    neckBand.position.set(0, 0.965, 0.408);
    g.add(neckBand);

    var head = new THREE.Mesh(new THREE.SphereGeometry(0.092, 32, 24), white);
    head.scale.set(0.92, 0.94, 1.18);
    head.position.set(0, 1.058, 0.508);
    head.castShadow = true;
    g.add(head);

    var beak = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.145, 18), blue);
    beak.rotation.x = Math.PI / 2;
    beak.rotation.z = -0.12;
    beak.position.set(0, 1.046, 0.642);
    g.add(beak);

    var crestMat = blueLine;
    [[0.16, 0.02, 0.01], [0.22, 0.0, 0.05], [0.27, -0.03, 0.0]].forEach(function (cr, idx) {
      var curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 1.125, 0.47),
        new THREE.Vector3(0.02 * (idx - 1), 1.17 + cr[0] * 0.3, 0.41),
        new THREE.Vector3(0.045 * (idx - 1), 1.17 + cr[0], 0.34 + cr[2])
      ]);
      var feather = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.016 - idx * 0.002, 7, false), crestMat);
      g.add(feather);
    });

    var eye = new THREE.Mesh(new THREE.SphereGeometry(0.0105, 12, 10), blueLine);
    eye.position.set(0.064, 1.074, 0.542);
    g.add(eye);

    /* Loop handle at -z, with a small flat tail fin. */
    var handleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.84, -0.30),
      new THREE.Vector3(0, 0.98, -0.47),
      new THREE.Vector3(0, 0.91, -0.60),
      new THREE.Vector3(0, 0.68, -0.60),
      new THREE.Vector3(0, 0.54, -0.45)
    ]);
    var handle = new THREE.Mesh(new THREE.TubeGeometry(handleCurve, 36, 0.038, 10, false), blue);
    handle.castShadow = true;
    g.add(handle);

    var tailFan = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.15, 12), blue);
    tailFan.rotation.z = Math.PI / 2;
    tailFan.rotation.x = 0.32;
    tailFan.scale.z = 0.42;
    tailFan.position.set(0.015, 0.98, -0.50);
    g.add(tailFan);

    var footLine = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.004, 6, 48), blueLine);
    footLine.rotation.x = Math.PI / 2;
    footLine.position.y = 0.008;
    g.add(footLine);

    g.rotation.y = -0.25;
    return { group: g };
  }

  function buildDish(ctx, a, parent) {
    var g = new THREE.Group();
    parent.add(g);

    var white = porcelainMat(ctx, 0xeee8dd);
    var plate = new THREE.Group();
    plate.position.y = 0.62;
    plate.scale.setScalar(0.78);
    plate.rotation.y = -a.side * 0.98;
    g.add(plate);

    var board = new THREE.Mesh(
      new THREE.BoxGeometry(1.46, 1.46, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x4b3222, roughness: 0.86 })
    );
    board.position.set(0, 0, -0.09);
    board.castShadow = true;
    plate.add(board);

    var plateGroup = new THREE.Group();
    plateGroup.rotation.x = Math.PI / 2;
    plate.add(plateGroup);

    var profile = [
      new THREE.Vector2(0.001, 0.0),
      new THREE.Vector2(0.3, 0.008),
      new THREE.Vector2(0.5, 0.03),
      new THREE.Vector2(0.64, 0.07),
      new THREE.Vector2(0.71, 0.12),
      new THREE.Vector2(0.735, 0.17),
      new THREE.Vector2(0.72, 0.2),
      new THREE.Vector2(0.65, 0.175),
      new THREE.Vector2(0.52, 0.13),
      new THREE.Vector2(0.35, 0.09),
      new THREE.Vector2(0.18, 0.07),
      new THREE.Vector2(0.001, 0.064)
    ];
    var body = new THREE.Mesh(new THREE.LatheGeometry(profile, 96), white);
    body.castShadow = true;
    body.receiveShadow = true;
    plateGroup.add(body);

    var faceMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.42,
      metalness: 0.0,
      envMap: ctx.envMap,
      envMapIntensity: 0.3,
      side: THREE.DoubleSide
    });
    loadDataTexture(TEX['03_dishFace'], ctx.maxAniso, function (tex) {
      faceMat.map = tex;
      faceMat.needsUpdate = true;
    });
    var face = new THREE.Mesh(new THREE.CircleGeometry(0.705, 96), faceMat);
    face.rotation.x = -Math.PI / 2;
    face.position.y = 0.143;
    plateGroup.add(face);

    var rim = new THREE.Mesh(new THREE.TorusGeometry(0.724, 0.013, 8, 96), white);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.192;
    plateGroup.add(rim);

    var base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.48), ctx.materials.darkWoodMat);
    base.position.set(0, -0.77, -0.02);
    base.castShadow = true;
    plate.add(base);
    var standPost = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.85, 0.06), ctx.materials.brassMat);
    standPost.position.set(0, -0.32, -0.13);
    plate.add(standPost);

    g.rotation.y = 0;
    return { group: g };
  }

  function makeRedGlazeTexture(maxAniso) {
    var c = makeCanvas(1024, 512);
    var ctx = c.getContext('2d');
    var base = ctx.createLinearGradient(0, 0, 0, 512);
    base.addColorStop(0, '#f3ead9');
    base.addColorStop(0.14, '#f3ead9');
    base.addColorStop(0.4, '#b64b3f');
    base.addColorStop(0.78, '#9b342c');
    base.addColorStop(1, '#7e2622');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 1024, 512);

    function blob(cx, cy, rx, ry, inner, outer) {
      [-1024, 0, 1024].forEach(function (dx) {
        var g = ctx.createRadialGradient(cx + dx, cy, 0, cx + dx, cy, Math.max(rx, ry));
        g.addColorStop(0, inner);
        g.addColorStop(0.55, inner);
        g.addColorStop(1, outer);
        ctx.save();
        ctx.translate(cx + dx, cy);
        ctx.scale(1, ry / rx);
        ctx.translate(-(cx + dx), -cy);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx + dx, cy, rx, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    blob(180, 205, 120, 62, 'rgba(244,234,216,0.96)', 'rgba(244,234,216,0)');
    blob(520, 150, 180, 48, 'rgba(244,234,216,0.82)', 'rgba(244,234,216,0)');
    blob(790, 275, 150, 82, 'rgba(242,231,212,0.9)', 'rgba(242,231,212,0)');
    blob(330, 390, 90, 42, 'rgba(242,231,212,0.52)', 'rgba(242,231,212,0)');
    blob(920, 105, 120, 35, 'rgba(244,234,216,0.66)', 'rgba(244,234,216,0)');

    var i;
    for (i = 0; i < 180; i++) {
      var x = Math.random() * 1024;
      var y = 120 + Math.random() * 380;
      var r = 1 + Math.random() * 5;
      ctx.fillStyle = 'rgba(70,18,16,' + (0.05 + Math.random() * 0.16) + ')';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (i = 0; i < 110; i++) {
      var x2 = Math.random() * 1024;
      var y2 = 140 + Math.random() * 330;
      ctx.fillStyle = 'rgba(255,248,235,' + (0.06 + Math.random() * 0.14) + ')';
      ctx.beginPath();
      ctx.arc(x2, y2, 0.8 + Math.random() * 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    var tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = maxAniso || 4;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    return tex;
  }

  function buildSpinningCup(ctx, a, parent) {
    var g = new THREE.Group();
    parent.add(g);

    var white = porcelainMat(ctx, 0xeee8dd);
    var inner = porcelainMat(ctx, 0xeee8dd);
    inner.side = THREE.BackSide;
    var redBody = porcelainMat(ctx, 0xffffff);
    redBody.map = makeRedGlazeTexture(ctx.maxAniso);
    redBody.needsUpdate = true;
    var red = new THREE.MeshStandardMaterial({
      color: 0x74221b,
      roughness: 0.46,
      metalness: 0.02,
      envMap: ctx.envMap,
      envMapIntensity: 0.4
    });

    var foot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.025, 48), white);
    foot.position.y = 0.012;
    foot.castShadow = true;
    g.add(foot);

    var stemProfile = [
      new THREE.Vector2(0.001, 0),
      new THREE.Vector2(0.21, 0),
      new THREE.Vector2(0.23, 0.02),
      new THREE.Vector2(0.18, 0.06),
      new THREE.Vector2(0.13, 0.14),
      new THREE.Vector2(0.12, 0.24),
      new THREE.Vector2(0.14, 0.3),
      new THREE.Vector2(0.11, 0.38),
      new THREE.Vector2(0.13, 0.46),
      new THREE.Vector2(0.18, 0.5)
    ];
    var stem = new THREE.Mesh(new THREE.LatheGeometry(stemProfile, 64), white);
    stem.castShadow = true;
    stem.receiveShadow = true;
    g.add(stem);

    var spinner = new THREE.Group();
    spinner.position.y = 0.5;
    spinner.userData.part = 'spinner';
    g.add(spinner);

    var cupProfile = [
      new THREE.Vector2(0.18, 0.0),
      new THREE.Vector2(0.28, 0.02),
      new THREE.Vector2(0.35, 0.08),
      new THREE.Vector2(0.42, 0.2),
      new THREE.Vector2(0.47, 0.32),
      new THREE.Vector2(0.49, 0.43),
      new THREE.Vector2(0.495, 0.47)
    ];
    var cup = new THREE.Mesh(new THREE.LatheGeometry(cupProfile, 80), redBody);
    cup.castShadow = true;
    cup.receiveShadow = true;
    spinner.add(cup);

    var innerProfile = [
      new THREE.Vector2(0.475, 0.46),
      new THREE.Vector2(0.44, 0.34),
      new THREE.Vector2(0.38, 0.22),
      new THREE.Vector2(0.3, 0.12),
      new THREE.Vector2(0.19, 0.055),
      new THREE.Vector2(0.001, 0.045)
    ];
    var innerWall = new THREE.Mesh(new THREE.LatheGeometry(innerProfile, 64), inner);
    spinner.add(innerWall);

    var rim = new THREE.Mesh(new THREE.TorusGeometry(0.49, 0.009, 8, 80), white);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.47;
    spinner.add(rim);

    var axis = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.045, 0.34, 24), white);
    axis.position.y = 0.24;
    spinner.add(axis);
    var knob = new THREE.Mesh(new THREE.SphereGeometry(0.055, 24, 18), red);
    knob.position.y = 0.425;
    spinner.add(knob);

    function cupRadiusAt(yy) {
      var j;
      for (j = 0; j < cupProfile.length - 1; j++) {
        if (yy >= cupProfile[j].y && yy <= cupProfile[j + 1].y) {
          var t = (yy - cupProfile[j].y) / (cupProfile[j + 1].y - cupProfile[j].y);
          return cupProfile[j].x + (cupProfile[j + 1].x - cupProfile[j].x) * t;
        }
      }
      return cupProfile[cupProfile.length - 1].x;
    }

    function surfacePoint(yy, zz, lift) {
      var rr = cupRadiusAt(yy) + (lift || 0.012);
      var xx = Math.sqrt(Math.max(0.0004, rr * rr - zz * zz));
      return new THREE.Vector3(xx, yy, zz);
    }

    var dragonPath = [
      [0.075, 0.215], [0.12, 0.235], [0.165, 0.20], [0.21, 0.145],
      [0.25, 0.085], [0.285, 0.025], [0.315, -0.035], [0.34, -0.085]
    ].map(function (p) { return surfacePoint(p[0], p[1], 0.022); });
    var dragonCurve = new THREE.CatmullRomCurve3(dragonPath);
    var dragonBody = new THREE.Mesh(new THREE.TubeGeometry(dragonCurve, 44, 0.031, 10, false), red);
    dragonBody.castShadow = true;
    spinner.add(dragonBody);

    /* Dragon head at the top end, raised from the wall. */
    var headBase = surfacePoint(0.345, -0.09, 0.045);
    var dh = new THREE.Mesh(new THREE.SphereGeometry(0.068, 22, 16), red);
    dh.scale.set(0.82, 0.78, 1.25);
    dh.position.copy(headBase);
    spinner.add(dh);
    var snout = new THREE.Mesh(new THREE.SphereGeometry(0.04, 18, 14), red);
    snout.scale.set(0.75, 0.7, 1.2);
    snout.position.copy(headBase).add(new THREE.Vector3(-0.008, 0.028, -0.058));
    spinner.add(snout);
    [-0.032, 0.032].forEach(function (off) {
      var horn = new THREE.Mesh(new THREE.ConeGeometry(0.013, 0.075, 10), red);
      horn.position.copy(headBase).add(new THREE.Vector3(off, 0.07, 0.02));
      horn.rotation.x = -0.55;
      horn.rotation.z = off > 0 ? -0.25 : 0.25;
      spinner.add(horn);
    });
    var eyeWhite = new THREE.MeshStandardMaterial({ color: 0xd9c7a0, roughness: 0.4 });
    [-0.045, 0.025].forEach(function (off) {
      var de = new THREE.Mesh(new THREE.SphereGeometry(0.008, 10, 8), eyeWhite);
      de.position.copy(headBase).add(new THREE.Vector3(off, 0.026, 0.028));
      spinner.add(de);
    });

    /* Two small clawed legs, flattened against the cup. */
    [[0.145, 0.22], [0.235, 0.10]].forEach(function (leg) {
      var base = surfacePoint(leg[0], leg[1], 0.032);
      var tip = base.clone().add(new THREE.Vector3(0.004, -0.052, 0.042));
      var legCurve = new THREE.CatmullRomCurve3([
        base,
        base.clone().add(new THREE.Vector3(0.014, -0.026, 0.03)),
        tip
      ]);
      var legMesh = new THREE.Mesh(new THREE.TubeGeometry(legCurve, 12, 0.014, 7, false), red);
      spinner.add(legMesh);
      var claw = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.04, 8), red);
      claw.position.copy(tip);
      claw.rotation.z = Math.PI / 2;
      claw.rotation.y = 0.3;
      spinner.add(claw);
    });

    var tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.13, 10), red);
    tailTip.position.copy(dragonPath[0]).add(new THREE.Vector3(0.01, -0.055, 0.035));
    tailTip.rotation.z = 0.5;
    tailTip.rotation.x = 0.4;
    spinner.add(tailTip);

    var marker = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.03), red);
    marker.position.set(0, 0.46, -0.48);
    spinner.add(marker);

    g.rotation.y = -0.25;
    return { group: g, spinner: spinner };
  }

  function buildCizhouJar(ctx, a, parent) {
    var g = new THREE.Group();
    parent.add(g);

    var white = porcelainMat(ctx, 0xf0eadc);
    var bodyMat = porcelainMat(ctx, 0xffffff);
    loadDataTexture(TEX['05_jarBand'], ctx.maxAniso, function (tex) {
      bodyMat.map = tex;
      bodyMat.needsUpdate = true;
    });
    var dark = new THREE.MeshStandardMaterial({
      color: 0x2b2118,
      roughness: 0.62,
      metalness: 0.03,
      envMap: ctx.envMap,
      envMapIntensity: 0.3
    });

    var profile = [
      new THREE.Vector2(0.001, 0),
      new THREE.Vector2(0.28, 0.004),
      new THREE.Vector2(0.33, 0.03),
      new THREE.Vector2(0.39, 0.12),
      new THREE.Vector2(0.45, 0.26),
      new THREE.Vector2(0.47, 0.4),
      new THREE.Vector2(0.44, 0.53),
      new THREE.Vector2(0.36, 0.63),
      new THREE.Vector2(0.29, 0.68),
      new THREE.Vector2(0.275, 0.715),
      new THREE.Vector2(0.295, 0.735)
    ];
    var jar = new THREE.Mesh(new THREE.LatheGeometry(profile, 80), bodyMat);
    jar.castShadow = true;
    jar.receiveShadow = true;
    g.add(jar);

    var rim = new THREE.Mesh(new THREE.TorusGeometry(0.292, 0.01, 8, 64), white);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.735;
    g.add(rim);

    var foot = new THREE.Mesh(new THREE.TorusGeometry(0.285, 0.008, 8, 64), dark);
    foot.rotation.x = Math.PI / 2;
    foot.position.y = 0.008;
    g.add(foot);

    [1, -1].forEach(function (side) {
      var lug = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.022, 8, 18, Math.PI), dark);
      lug.position.set(side * 0.34, 0.55, 0);
      lug.rotation.z = side * Math.PI / 2;
      lug.rotation.y = Math.PI / 2;
      g.add(lug);
    });

    g.rotation.y = 0.4;
    return { group: g };
  }

  function buildBlueYi(ctx, a, parent) {
    var g = new THREE.Group();
    parent.add(g);

    var blue = new THREE.MeshPhysicalMaterial({
      color: 0x1c3a68,
      roughness: 0.22,
      metalness: 0.02,
      clearcoat: 0.6,
      clearcoatRoughness: 0.15,
      envMap: ctx.envMap,
      envMapIntensity: 0.7,
      side: THREE.DoubleSide
    });
    var gold = new THREE.MeshStandardMaterial({
      color: 0xd4ad52,
      roughness: 0.28,
      metalness: 0.65,
      envMap: ctx.envMap,
      envMapIntensity: 0.55
    });

    var bowl = new THREE.Group();
    bowl.rotation.x = 0.46;
    bowl.position.y = 0.12;
    g.add(bowl);

    var profile = [
      new THREE.Vector2(0.001, 0.02),
      new THREE.Vector2(0.28, 0.03),
      new THREE.Vector2(0.37, 0.07),
      new THREE.Vector2(0.44, 0.15),
      new THREE.Vector2(0.47, 0.25),
      new THREE.Vector2(0.455, 0.28),
      new THREE.Vector2(0.4, 0.25),
      new THREE.Vector2(0.32, 0.18),
      new THREE.Vector2(0.2, 0.11),
      new THREE.Vector2(0.001, 0.085)
    ];
    var body = new THREE.Mesh(new THREE.LatheGeometry(profile, 80), blue);
    body.castShadow = true;
    body.receiveShadow = true;
    bowl.add(body);

    var innerMat = new THREE.MeshStandardMaterial({
      color: 0x1d3a63,
      roughness: 0.34,
      metalness: 0.02,
      envMap: ctx.envMap,
      envMapIntensity: 0.25
    });
    loadDataTexture(TEX['06_blueGold'], ctx.maxAniso, function (tex) {
      innerMat.map = tex;
      innerMat.needsUpdate = true;
    });
    var inner = new THREE.Mesh(new THREE.CircleGeometry(0.4, 80), innerMat);
    inner.rotation.x = -Math.PI / 2;
    inner.position.y = 0.245;
    bowl.add(inner);

    var rim = new THREE.Mesh(new THREE.TorusGeometry(0.465, 0.012, 8, 80), gold);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.28;
    bowl.add(rim);

    /* Spout: a flattened half-open tapered trough at +z */
    var spout = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.14, 0.24, 24, 1, true, 0, Math.PI),
      blue
    );
    spout.rotation.x = Math.PI / 2;
    spout.position.set(0, 0.28, 0.52);
    spout.scale.set(1, 1, 0.55);
    spout.castShadow = true;
    bowl.add(spout);

    /* Handle: a low loop at -z */
    var handleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.24, -0.4),
      new THREE.Vector3(0, 0.18, -0.6),
      new THREE.Vector3(0, 0.1, -0.66),
      new THREE.Vector3(0, 0.08, -0.46)
    ]);
    var handle = new THREE.Mesh(new THREE.TubeGeometry(handleCurve, 24, 0.035, 8, false), blue);
    handle.castShadow = true;
    bowl.add(handle);

    var base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.06, 48), ctx.materials.darkWoodMat);
    base.position.y = -0.01;
    g.add(base);

    g.rotation.y = 0.25;
    return { group: g };
  }

  /* ------------------------------------------------------------
     Lighting, dust, camera
     ------------------------------------------------------------ */

  function buildLightRig(scene) {
    var hemi = new THREE.HemisphereLight(0xffe1b8, 0x1a110a, 0.76);
    scene.add(hemi);

    var ambient = new THREE.AmbientLight(0xffdfbe, 0.17);
    scene.add(ambient);

    var key = new THREE.SpotLight(0xffcb92, 2.45, 16, Math.PI / 6.2, 0.58, 1.25);
    key.position.set(0, 4.1, 10.2);
    key.target.position.set(0, 2.0, 6.95);
    key.castShadow = true;
    key.shadow.mapSize.width = 1024;
    key.shadow.mapSize.height = 1024;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 18;
    key.shadow.bias = -0.0006;
    scene.add(key);
    scene.add(key.target);

    var rim = new THREE.PointLight(0x9b6a3e, 0.7, 8, 2);
    rim.position.set(3.9, 2.4, 1.4);
    scene.add(rim);

    var caseLight = new THREE.PointLight(0xffd7a5, 0.55, 4, 2);
    caseLight.position.set(2.9, 2.4, 2.4);
    scene.add(caseLight);

    var wallWash = new THREE.PointLight(0xffc58c, 0.35, 5, 2);
    wallWash.position.set(3.8, 3.2, 2.1);
    scene.add(wallWash);

    return {
      hemi: hemi,
      ambient: ambient,
      key: key,
      rim: rim,
      caseLight: caseLight,
      wallWash: wallWash
    };
  }

  function buildDust(world) {
    var count = 420;
    var positions = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8.0;
      positions[i * 3 + 1] = 0.4 + Math.random() * 3.4;
      positions[i * 3 + 2] = 14 - Math.random() * 62;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.PointsMaterial({
      color: 0xffe7c9,
      size: 0.022,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
      sizeAttenuation: true
    });
    var points = new THREE.Points(geo, mat);
    world.add(points);
    return points;
  }

  function lightPoseForStop(stop) {
    if (!stop) return null;
    if (stop.kind === 'prologue') {
      return {
        keyPos: new THREE.Vector3(0, 4.0, 10.6),
        keyTarget: new THREE.Vector3(0, 2.0, 6.95),
        rimPos: new THREE.Vector3(3.6, 2.5, 8.0),
        caseIntensity: 0.0,
        wallIntensity: 0.22
      };
    }
    if (stop.kind === 'tail') {
      return {
        keyPos: new THREE.Vector3(0, 4.1, -43.8),
        keyTarget: new THREE.Vector3(0, 2.0, -48.2),
        rimPos: new THREE.Vector3(3.7, 2.6, -45.2),
        caseIntensity: 0.0,
        wallIntensity: 0.28
      };
    }
    var a = findArtifact(stop.id);
    var side = a.side;
    return {
      keyPos: new THREE.Vector3(side * 2.2, 4.05, a.z + 2.4),
      keyTarget: new THREE.Vector3(side * 2.98, 1.18, a.z),
      rimPos: new THREE.Vector3(side * 4.2, 2.6, a.z - 0.4),
      caseIntensity: 0.55,
      wallIntensity: 0.38
    };
  }

  function setMoodImmediate(api, mood) {
    var scene = api.scene;
    var rig = api.lightRig;
    var color = new THREE.Color(mood.fog);
    scene.fog.color.copy(color);
    scene.background.copy(color);
    scene.fog.density = mood.fogDensity || 0.026;
    api.ctx.renderer.toneMappingExposure = mood.exposure;
    rig.hemi.color.setHex(mood.hemiSky);
    rig.hemi.groundColor.setHex(mood.hemiGround);
    rig.hemi.intensity = mood.hemiIntensity;
    rig.ambient.intensity = mood.ambient;
    rig.key.color.setHex(mood.key);
    rig.key.intensity = mood.keyIntensity;
    rig.rim.color.setHex(mood.rim);
    api.mood = mood;
  }

  function lerpMood(api, from, to, t, lightFrom, lightTo) {
    var scene = api.scene;
    var rig = api.lightRig;
    var fog = new THREE.Color(from.fog).lerp(new THREE.Color(to.fog), t);
    scene.fog.color.copy(fog);
    scene.background.copy(fog);
    scene.fog.density = (from.fogDensity || 0.026) + ((to.fogDensity || 0.026) - (from.fogDensity || 0.026)) * t;
    api.ctx.renderer.toneMappingExposure = from.exposure + (to.exposure - from.exposure) * t;
    rig.hemi.color.copy(new THREE.Color(from.hemiSky).lerp(new THREE.Color(to.hemiSky), t));
    rig.hemi.groundColor.copy(new THREE.Color(from.hemiGround).lerp(new THREE.Color(to.hemiGround), t));
    rig.hemi.intensity = from.hemiIntensity + (to.hemiIntensity - from.hemiIntensity) * t;
    rig.ambient.intensity = from.ambient + (to.ambient - from.ambient) * t;
    rig.key.color.copy(new THREE.Color(from.key).lerp(new THREE.Color(to.key), t));
    rig.key.intensity = from.keyIntensity + (to.keyIntensity - from.keyIntensity) * t;
    rig.rim.color.copy(new THREE.Color(from.rim).lerp(new THREE.Color(to.rim), t));

    if (lightFrom && lightTo) {
      rig.key.position.lerpVectors(lightFrom.keyPos, lightTo.keyPos, t);
      rig.key.target.position.lerpVectors(lightFrom.keyTarget, lightTo.keyTarget, t);
      rig.rim.position.lerpVectors(lightFrom.rimPos, lightTo.rimPos, t);
      rig.caseLight.intensity = lightFrom.caseIntensity + (lightTo.caseIntensity - lightFrom.caseIntensity) * t;
      rig.wallWash.intensity = lightFrom.wallIntensity + (lightTo.wallIntensity - lightFrom.wallIntensity) * t;
      rig.caseLight.position.lerpVectors(
        new THREE.Vector3(lightFrom.keyPos.x * 0.72, 2.2, lightFrom.keyPos.z),
        new THREE.Vector3(lightTo.keyPos.x * 0.72, 2.2, lightTo.keyPos.z),
        t
      );
      rig.wallWash.position.lerpVectors(
        new THREE.Vector3(lightFrom.rimPos.x * 0.92, 3.0, lightFrom.rimPos.z),
        new THREE.Vector3(lightTo.rimPos.x * 0.92, 3.0, lightTo.rimPos.z),
        t
      );
    }
  }

  function updateOrbitCamera(api, orbit) {
    var t = orbit.target;
    var r = orbit.radius;
    var phi = orbit.phi;
    var theta = orbit.theta;
    var sinPhi = Math.sin(phi);
    api.camera.position.set(
      t.x + r * sinPhi * Math.sin(theta),
      t.y + r * Math.cos(phi),
      t.z + r * sinPhi * Math.cos(theta)
    );
    api.camera.lookAt(t);
  }

  /* ------------------------------------------------------------
     Camera moves
     ------------------------------------------------------------ */

  function moveTo(api, stop, opts, onDone) {
    if (api.transition) return;
    var fromPos = api.camera.position.clone();
    var fromTarget = api.orbit ? api.orbit.target.clone() : new THREE.Vector3(0, 2.0, 6.95);
    if (opts.intro) {
      fromPos.copy(api.introStart.position);
      fromTarget.copy(api.introStart.target);
      api.camera.position.copy(fromPos);
      api.camera.lookAt(fromTarget);
    }

    var midZ = (fromPos.z + stop.position.z) / 2;
    var posPoints = [
      fromPos.clone(),
      new THREE.Vector3(0, 1.82, midZ),
      stop.position.clone()
    ];
    var targetPoints = [
      fromTarget.clone(),
      new THREE.Vector3(0, Math.max(1.5, Math.min(2.1, (fromTarget.y + stop.target.y) / 2)), midZ),
      stop.target.clone()
    ];
    var posCurve = new THREE.CatmullRomCurve3(posPoints);
    var targetCurve = new THREE.CatmullRomCurve3(targetPoints);
    var lightFrom = lightPoseForStop(api.currentStop);
    var lightTo = lightPoseForStop(stop);
    var prevMood = api.mood || moodForHall(api.hallId);
    var nextMood = moodForHall(stop.hallId);
    var t0 = Date.now();

    api.transition = {
      stop: stop,
      start: t0,
      duration: Math.max(80, opts.duration || 1400),
      posCurve: posCurve,
      targetCurve: targetCurve,
      lightFrom: lightFrom,
      lightTo: lightTo,
      moodFrom: prevMood,
      moodTo: nextMood,
      onDone: onDone || function () {}
    };
    api.currentPicks = [];
    api.currentArtifact = null;
    api.currentSpinner = null;
  }

  function finishTransition(api) {
    var tr = api.transition;
    if (!tr) return;
    api.camera.position.copy(tr.stop.position);
    api.camera.lookAt(tr.stop.target);
    api.orbit = {
      target: tr.stop.target.clone(),
      theta: tr.stop.theta,
      phi: tr.stop.phi,
      radius: tr.stop.radius,
      thetaMin: tr.stop.theta - tr.stop.thetaRange,
      thetaMax: tr.stop.theta + tr.stop.thetaRange,
      phiMin: tr.stop.phiMin,
      phiMax: tr.stop.phiMax,
      radiusMin: tr.stop.radiusMin,
      radiusMax: tr.stop.radiusMax
    };
    api.currentStop = tr.stop;
    api.hallId = tr.stop.hallId;
    setMoodImmediate(api, tr.moodTo);
    var lp = tr.lightTo;
    if (lp) {
      api.lightRig.key.position.copy(lp.keyPos);
      api.lightRig.key.target.position.copy(lp.keyTarget);
      api.lightRig.rim.position.copy(lp.rimPos);
      api.lightRig.caseLight.intensity = lp.caseIntensity;
      api.lightRig.wallWash.intensity = lp.wallIntensity;
      api.lightRig.caseLight.position.set(lp.keyPos.x * 0.72, 2.2, lp.keyPos.z);
      api.lightRig.wallWash.position.set(lp.rimPos.x * 0.92, 3.0, lp.rimPos.z);
    }

    if (tr.stop.kind === 'artifact') {
      var station = api.stations[tr.stop.id];
      if (station) {
        api.currentPicks = [station.modelGroup, station.folderHit];
        api.currentArtifact = station.modelGroup;
        api.currentArtifactId = tr.stop.id;
        api.currentSpinner = station.spinner || null;
      }
    }
    api.lastInteract = Date.now();
    var done = tr.onDone;
    api.transition = null;
    done();
  }

  function animationLoop(api) {
    requestAnimationFrame(function () { animationLoop(api); });
    if (!api.active || api.lost) return;

    var dt = Math.min(api.ctx.clock.getDelta(), 0.05);
    var now = Date.now();

    if (api.transition) {
      var t = clamp((now - api.transition.start) / api.transition.duration, 0, 1);
      var e = easeInOutCubic(t);
      var pos = api.transition.posCurve.getPoint(e);
      var target = api.transition.targetCurve.getPoint(e);
      api.camera.position.copy(pos);
      api.camera.lookAt(target);
      lerpMood(api, api.transition.moodFrom, api.transition.moodTo, e, api.transition.lightFrom, api.transition.lightTo);
      if (t >= 1) finishTransition(api);
    } else if (api.orbit) {
      updateOrbitCamera(api, api.orbit);
      if (api.currentArtifact && !api.drag && now - api.lastInteract > 4200) {
        if (api.currentSpinner) api.currentSpinner.rotation.y += dt * 0.25;
        else api.currentArtifact.rotation.y += dt * 0.11;
      }
    }

    if (api.dust) {
      api.dust.rotation.y += dt * 0.004;
      api.dust.position.y = Math.sin(now * 0.00013) * 0.04;
    }

    api.ctx.renderer.render(api.scene, api.camera);
  }

  /* ------------------------------------------------------------
     Pointer controls
     ------------------------------------------------------------ */

  function setRayFromEvent(api, event) {
    var rect = api.renderer.domElement.getBoundingClientRect();
    api.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    api.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    api.raycaster.setFromCamera(api.pointer, api.camera);
  }

  function pickAt(api, event) {
    if (!api.currentPicks.length) return null;
    setRayFromEvent(api, event);
    var hits = api.raycaster.intersectObjects(api.currentPicks, true);
    if (!hits.length) return null;
    var obj = hits[0].object;
    var type = null;
    var part = null;
    var artifactId = null;
    while (obj) {
      if (obj.userData) {
        if (obj.userData.pickType) type = obj.userData.pickType;
        if (obj.userData.part) part = obj.userData.part;
        if (obj.userData.artifactId) artifactId = obj.userData.artifactId;
      }
      obj = obj.parent;
    }
    return { type: type, part: part, artifactId: artifactId, hit: hits[0] };
  }

  function bindPointer(api, el) {
    el.addEventListener('pointerdown', function (e) {
      if (!api.active || api.transition) return;
      el.setPointerCapture(e.pointerId);
      var pick = pickAt(api, e);
      if (pick && pick.type === 'folder') {
        api.drag = {
          mode: 'folder',
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          moved: 0,
          artifactId: pick.artifactId
        };
        return;
      }
      if (pick && pick.type === 'artifact') {
        api.drag = {
          mode: 'artifact',
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          lastX: e.clientX,
          part: pick.part,
          artifactId: pick.artifactId
        };
        api.lastInteract = Date.now();
        return;
      }
      api.drag = {
        mode: 'orbit',
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY
      };
      api.lastInteract = Date.now();
      if (api.orbit) api.orbit.thetaStart = api.orbit.theta;
    });

    el.addEventListener('pointermove', function (e) {
      if (!api.active) return;
      if (!api.drag) {
        var hover = pickAt(api, e);
        if (hover && hover.type === 'folder') el.style.cursor = 'pointer';
        else el.style.cursor = 'grab';
        return;
      }
      if (e.pointerId !== api.drag.pointerId) return;
      var dx = e.clientX - api.drag.lastX;
      var dy = e.clientY - api.drag.lastY;

      if (api.drag.mode === 'folder') {
        api.drag.moved += Math.abs(dx) + Math.abs(dy);
        api.drag.lastX = e.clientX;
        api.drag.lastY = e.clientY;
        return;
      }

      if (api.drag.mode === 'artifact') {
        var delta = (e.clientX - api.drag.startX) * 0.012;
        if (api.currentSpinner) {
          api.currentSpinner.rotation.y += delta * 0.06;
        } else if (api.currentArtifact) {
          api.currentArtifact.rotation.y += delta * 0.06;
        }
        api.lastInteract = Date.now();
        return;
      }

      if (api.orbit) {
        var o = api.orbit;
        o.theta = clamp(o.theta - dx * 0.0042, o.thetaMin, o.thetaMax);
        o.phi = clamp(o.phi - dy * 0.0032, o.phiMin, o.phiMax);
        updateOrbitCamera(api, o);
        api.lastInteract = Date.now();
      }
    });

    function endPointer(e) {
      if (!api.drag) return;
      var drag = api.drag;
      if (e.pointerId !== drag.pointerId) return;
      if (drag.mode === 'folder' && drag.moved < 8) {
        openArchive(drag.artifactId, '3d');
      }
      api.drag = null;
      api.lastInteract = Date.now();
    }

    el.addEventListener('pointerup', endPointer);
    el.addEventListener('pointercancel', endPointer);
  }

  function bindWheel(api, el) {
    el.addEventListener('wheel', function (e) {
      if (!api.active || api.transition || !api.orbit) return;
      e.preventDefault();
      var o = api.orbit;
      o.radius = clamp(o.radius + e.deltaY * 0.0018, o.radiusMin, o.radiusMax);
      updateOrbitCamera(api, o);
      api.lastInteract = Date.now();
    }, { passive: false });
  }

  /* ------------------------------------------------------------
     API methods
     ------------------------------------------------------------ */

  function attachThreeMethods(api) {
    api.setActive = function (active) {
      api.active = !!active;
      if (active) api.ctx.clock.getDelta();
    };
    api.beginIntro = function () {
      api.transition = null;
      api.currentStop = null;
      api.hallId = 'prologue';
      api.camera.position.copy(api.introStart.position);
      api.camera.lookAt(api.introStart.target);
      api.orbit = {
        target: api.introStart.target.clone(),
        theta: 0,
        phi: 1.54,
        radius: 5.05,
        thetaMin: -0.4,
        thetaMax: 0.4,
        phiMin: 1.28,
        phiMax: 1.56,
        radiusMin: 3.6,
        radiusMax: 6.2
      };
    };
    api.moveTo = function (stop, opts, onDone) {
      if (api.transition) return;
      moveTo(api, stop, opts || {}, onDone);
    };
    api.isTransitioning = function () { return !!api.transition; };
    api.getCameraPosition = function () { return api.camera.position.clone(); };
    api.getHallId = function () { return api.hallId; };
    api.getCurrentStop = function () { return api.currentStop; };
  }

  /* ------------------------------------------------------------
     Init / events / boot
     ------------------------------------------------------------ */

  function bindEvents() {
    btnEnter.addEventListener('click', function () { enterExhibition(false); });
    btnSkipIntro.addEventListener('click', function () { enterExhibition(true); });
    btnNext.addEventListener('click', function () {
      if (!state.three || state.three.isTransitioning()) return;
      var next = state.current + 1;
      if (next >= route.length) next = 0;
      goToRoute(next);
    });
    btnPrev.addEventListener('click', function () {
      if (!state.three || state.three.isTransitioning()) return;
      if (state.current > 0) goToRoute(state.current - 1);
    });
    btn2D.addEventListener('click', function () {
      if (state.mode !== '3d') return;
      var item = route[state.current];
      if (item.kind === 'artifact') openArchive(item.id, '3d');
      else openIndex();
    });
    btnSound.addEventListener('click', toggleSound);
    btnFull.addEventListener('click', toggleFullscreen);
    doc.addEventListener('fullscreenchange', updateFullscreenButton);
    doc.addEventListener('webkitfullscreenchange', updateFullscreenButton);

    btnCloseArchive.addEventListener('click', function () { closeArchive(); });
    btnArchiveIndex.addEventListener('click', showIndexFromArchive);
    btnIndex3D.addEventListener('click', returnTo3D);
    btnCredits.addEventListener('click', openCredits);
    btnIndexCredits.addEventListener('click', openCredits);
    btnIndexCredits2.addEventListener('click', openCredits);
    btnCloseCredits.addEventListener('click', closeCredits);

    doc.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        if (state.creditsOpen) {
          closeCredits();
        } else if (state.archiveOpen) {
          closeArchive();
        } else if (state.indexOpen) {
          if (!state.isMobile && !state.fallback) returnTo3D();
        } else if (state.mode === 'intro') {
          enterExhibition(true);
        }
      }
      if ((event.key === 'ArrowRight' || event.key === 'ArrowLeft') && state.mode === '3d' && !state.archiveOpen && !state.indexOpen && !state.creditsOpen) {
        var tag = (event.target && event.target.tagName) || '';
        if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        if (!state.three || state.three.isTransitioning()) return;
        if (event.key === 'ArrowRight') {
          var n = state.current + 1;
          if (n >= route.length) n = 0;
          goToRoute(n);
        } else if (state.current > 0) {
          goToRoute(state.current - 1);
        }
      }
    });

    window.addEventListener('resize', function () {
      var wasMobile = state.isMobile;
      state.isMobile = window.matchMedia('(max-width: 820px)').matches;
      if (wasMobile !== state.isMobile) {
        if (state.isMobile && state.mode === '3d') {
          openIndex();
        } else if (!state.isMobile && state.mode === 'index' && state.three && !state.fallback) {
          btnIndex3D.style.display = '';
        }
      }
      if (state.archiveOpen) positionHotspots();
    });
  }

  function boot() {
    body.classList.remove('is-loading');
    body.classList.toggle('is-mobile', state.isMobile);
    buildRouteUI();
    renderIndex();
    renderCredits();
    updateHudForRoute(0);
    updateFullscreenButton();
    setSoundButton(false);
    bindEvents();

    if (!state.isMobile && supportsWebGL()) {
      try {
        var api = initThree();
        attachThreeMethods(api);
        state.three.setActive(false);
      } catch (err) {
        state.fallback = true;
        btnIndex3D.style.display = 'none';
        body.classList.add('is-fallback');
        if (window.console && console.warn) console.warn('3D init failed:', err);
      }
    } else {
      state.fallback = true;
      btnIndex3D.style.display = 'none';
      body.classList.add('is-fallback');
    }

    if (state.isMobile) {
      btnIndex3D.style.display = 'none';
    }
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
