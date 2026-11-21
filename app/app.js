// app.js — Leonida Trophy Guide UI. Classic script, no modules, no dependencies.
// Data comes from window.LEONIDA_TROPHIES (app/data.js); if that did not load,
// it falls back to fetching app/data/trophies.json (works over http, not file://).
(function () {
  'use strict';

  var STORE_KEY = 'leonida-trophy-guide-earned-v1';
  var KIND_LABELS = {
    platinum: 'Platinum', story: 'Story', side: 'Side', activities: 'Activities',
    collectibles: 'Collectibles', exploration: 'Exploration', combat: 'Combat',
    economy: 'Economy', odd: 'Odd & secret'
  };
  var GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

  var data = window.LEONIDA_TROPHIES || null;
  var earned = new Set();
  var selectedId = null;

  // ----- elements -----------------------------------------------------------
  function $(id) { return document.getElementById(id); }
  var els = {
    progressFill: $('progressFill'), progressText: $('progressText'),
    progressGrades: $('progressGrades'), q: $('q'), grade: $('grade'), kind: $('kind'),
    missableOnly: $('missableOnly'), earnedOnly: $('earnedOnly'),
    hideEarned: $('hideEarned'), spoilers: $('spoilers'), reset: $('reset'),
    count: $('count'), list: $('list'), guide: $('guide'),
    missableBox: $('missableBox'), stages: $('stages')
  };

  // ----- progress -----------------------------------------------------------
  function loadEarned() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      JSON.parse(raw).forEach(function (id) { earned.add(id); });
    } catch (e) { /* storage unavailable: progress just does not persist */ }
  }
  function saveEarned() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(Array.from(earned).sort(function (a, b) { return a - b; }))); }
    catch (e) { /* ignore */ }
  }
  function toggleEarned(id) {
    if (earned.has(id)) earned.delete(id); else earned.add(id);
    saveEarned();
    renderAll();
  }

  // ----- filtering ----------------------------------------------------------
  function filtered() {
    var q = els.q.value.trim().toLowerCase();
    var grade = els.grade.value;
    var kind = els.kind.value;
    return data.trophies.filter(function (t) {
      if (grade && t.grade !== grade) return false;
      if (kind && t.kind !== kind) return false;
      if (els.missableOnly.checked && !t.missable) return false;
      if (els.earnedOnly.checked && !earned.has(t.id)) return false;
      if (els.hideEarned.checked && earned.has(t.id)) return false;
      if (q && (t.name + ' ' + t.description).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }

  // ----- rendering ----------------------------------------------------------
  function tag(text, cls) {
    var s = document.createElement('span');
    s.className = 'tag' + (cls ? ' ' + cls : '');
    s.textContent = text;
    return s;
  }
  function fmtCount(t) {
    if (t.count == null) return null;
    if (t.count >= 1000) return '$' + t.count.toLocaleString('en-US');
    return '×' + t.count;
  }

  function renderProgress() {
    var total = data.trophies.length;
    var n = earned.size;
    els.progressFill.style.width = (total ? Math.round(100 * n / total) : 0) + '%';
    els.progressText.textContent = n + ' / ' + total + ' earned' + (n === total ? ' — Leonida Legend!' : '');
    var parts = GRADE_ORDER.map(function (g) {
      var all = data.trophies.filter(function (t) { return t.grade === g; }).length;
      var got = data.trophies.filter(function (t) { return t.grade === g && earned.has(t.id); }).length;
      return g + ' ' + got + '/' + all;
    });
    els.progressGrades.textContent = parts.join('  ·  ');
  }

  function renderList() {
    var rows = filtered();
    els.count.textContent = 'Showing ' + rows.length + ' of ' + data.trophies.length + ' trophies';
    els.list.innerHTML = '';
    rows.forEach(function (t) {
      var li = document.createElement('li');
      li.className = 'row' + (earned.has(t.id) ? ' earned' : '');
      li.id = 'trophy-' + t.id;

      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = earned.has(t.id);
      cb.setAttribute('aria-label', 'Mark ' + t.name + ' as earned');
      cb.addEventListener('change', function () { toggleEarned(t.id); });

      var dot = document.createElement('span');
      dot.className = 'grade-dot grade-' + t.grade;
      dot.title = t.grade;

      var body = document.createElement('div');
      var name = document.createElement('div');
      name.className = 'name';
      var open = document.createElement('button');
      open.type = 'button';
      open.textContent = t.name;
      open.addEventListener('click', function () { selectTrophy(t.id, true); });
      name.appendChild(open);
      var desc = document.createElement('p');
      desc.className = 'desc';
      desc.textContent = t.description;
      var tags = document.createElement('div');
      tags.className = 'tags';
      tags.appendChild(tag(t.grade, 'grade-' + t.grade));
      tags.appendChild(tag(KIND_LABELS[t.kind] || t.kind));
      var c = fmtCount(t);
      if (c) tags.appendChild(tag(c, 'count'));
      if (t.missable) tags.appendChild(tag('Provisional missable', 'missable'));
      tags.appendChild(tag('Roadmap stage ' + t.stage));
      body.appendChild(name);
      body.appendChild(desc);
      body.appendChild(tags);

      var label = document.createElement('span');
      label.className = 'grade-label';
      label.textContent = t.grade;

      li.appendChild(cb);
      li.appendChild(dot);
      li.appendChild(body);
      li.appendChild(label);
      els.list.appendChild(li);
    });
    if (rows.length === 0) {
      var p = document.createElement('p');
      p.className = 'count';
      p.textContent = 'No trophies match these filters.';
      els.list.appendChild(p);
    }
  }

  function renderRoadmap() {
    var missables = data.trophies.filter(function (t) { return t.missable; });
    els.missableBox.innerHTML = '';
    var h = document.createElement('h2');
    h.textContent = 'Watch out: 4 provisional missables';
    var p = document.createElement('p');
    p.textContent = 'These four may only be possible inside a story window. Do them the first time the chance appears — the flag is provisional (from the trophy descriptions, not a confirmed in-game test).';
    var ul = document.createElement('ul');
    missables.forEach(function (t) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#/trophy/' + t.id;
      a.textContent = t.name;
      li.appendChild(a);
      li.appendChild(document.createTextNode(' — ' + t.description));
      ul.appendChild(li);
    });
    els.missableBox.appendChild(h);
    els.missableBox.appendChild(p);
    els.missableBox.appendChild(ul);

    els.stages.innerHTML = '';
    data.stages.forEach(function (st) {
      var items = data.trophies.filter(function (t) { return t.stage === st.n; });
      var got = items.filter(function (t) { return earned.has(t.id); }).length;
      var li = document.createElement('li');
      li.className = 'stage';
      var h3 = document.createElement('h3');
      var n = document.createElement('span');
      n.className = 'n';
      n.textContent = 'Stage ' + st.n + ' — ';
      h3.appendChild(n);
      h3.appendChild(document.createTextNode(st.title));
      var note = document.createElement('p');
      note.textContent = st.note;
      var prog = document.createElement('p');
      prog.className = 'stage-progress';
      prog.textContent = got + ' / ' + items.length + ' earned';
      var list = document.createElement('ul');
      items.forEach(function (t) {
        var row = document.createElement('li');
        if (earned.has(t.id)) row.className = 'earned';
        var a = document.createElement('a');
        a.href = '#/trophy/' + t.id;
        a.textContent = t.name;
        row.appendChild(a);
        row.appendChild(document.createTextNode(' (' + t.grade + (t.missable ? ', provisional missable' : '') + ')'));
        list.appendChild(row);
      });
      li.appendChild(h3);
      li.appendChild(note);
      li.appendChild(prog);
      li.appendChild(list);
      els.stages.appendChild(li);
    });
  }

  function renderGuide() {
    var t = data.trophies.find(function (x) { return x.id === selectedId; });
    if (!t) { els.guide.hidden = true; els.guide.innerHTML = ''; return; }
    els.guide.hidden = false;
    els.guide.innerHTML = '';
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'btn ghost close';
    close.textContent = 'Close';
    close.addEventListener('click', function () { selectTrophy(null, false); });
    var h2 = document.createElement('h2');
    h2.textContent = t.name;
    var meta = document.createElement('p');
    meta.className = 'desc';
    meta.textContent = t.grade + ' · ' + (KIND_LABELS[t.kind] || t.kind) + ' · Roadmap stage ' + t.stage + (t.missable ? ' · Provisional missable' : '');
    var desc = document.createElement('p');
    desc.textContent = t.description;
    els.guide.appendChild(close);
    els.guide.appendChild(h2);
    els.guide.appendChild(meta);
    els.guide.appendChild(desc);
    if (t.missable) {
      var warn = document.createElement('p');
      warn.className = 'warn';
      warn.textContent = 'Provisional missable: this may only be possible inside a story window. Do it the first time the chance appears.';
      els.guide.appendChild(warn);
    }
    var isSpoiler = t.kind === 'story' && !els.spoilers.checked;
    var guideText = document.createElement('p');
    guideText.textContent = t.guide;
    if (isSpoiler) {
      guideText.className = 'spoiler-hidden';
      var note = document.createElement('p');
      note.className = 'spoiler-note';
      note.textContent = 'Story spoiler hidden — turn on “Show story spoilers” to read this guide.';
      els.guide.appendChild(note);
    }
    els.guide.appendChild(guideText);
    var ol = document.createElement('ol');
    t.steps.forEach(function (s) {
      var li = document.createElement('li');
      li.textContent = s;
      if (isSpoiler) li.className = 'spoiler-hidden';
      ol.appendChild(li);
    });
    els.guide.appendChild(ol);
    var src = document.createElement('p');
    src.className = 'sources';
    src.textContent = 'Sources: ' + t.sources.join('; ') + '.';
    els.guide.appendChild(src);
    var done = document.createElement('label');
    done.className = 'check';
    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = earned.has(t.id);
    cb.addEventListener('change', function () { toggleEarned(t.id); });
    done.appendChild(cb);
    done.appendChild(document.createTextNode(' Mark as earned'));
    els.guide.appendChild(done);
  }

  function renderAll() {
    renderProgress();
    renderList();
    renderRoadmap();
    renderGuide();
  }

  // ----- selection + routing ------------------------------------------------
  function selectTrophy(id, pushHash) {
    selectedId = id;
    renderGuide();
    if (pushHash && id != null) {
      if (location.hash !== '#/trophy/' + id) location.hash = '#/trophy/' + id;
    }
    if (id == null && location.hash.indexOf('#/trophy/') === 0) {
      history.replaceState(null, '', '#/checklist');
      showView('checklist');
    }
  }

  function showView(name) {
    ['checklist', 'roadmap', 'about'].forEach(function (v) {
      var el = $('view-' + v);
      if (el) el.hidden = (v !== name);
    });
    document.querySelectorAll('.tabs a').forEach(function (a) {
      if (a.getAttribute('data-view') === name) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function route() {
    var h = location.hash || '#/checklist';
    var m = h.match(/^#\/trophy\/(\d+)$/);
    if (m) {
      var id = parseInt(m[1], 10);
      if (data.trophies.some(function (t) { return t.id === id; })) {
        showView('checklist');
        selectedId = id;
        renderGuide();
        var row = $('trophy-' + id);
        if (row) row.scrollIntoView({ block: 'nearest' });
        return;
      }
    }
    var view = h.replace(/^#\//, '');
    if (['checklist', 'roadmap', 'about'].indexOf(view) === -1) view = 'checklist';
    showView(view);
    if (view !== 'checklist') { selectedId = null; renderGuide(); }
  }

  // ----- boot ---------------------------------------------------------------
  function boot(d) {
    data = d;
    loadEarned();
    ['q', 'grade', 'kind', 'missableOnly', 'earnedOnly', 'hideEarned', 'spoilers'].forEach(function (id) {
      els[id].addEventListener('input', renderList);
      els[id].addEventListener('change', renderList);
    });
    els.spoilers.addEventListener('change', renderGuide);
    els.reset.addEventListener('click', function () {
      if (window.confirm('Reset all progress? This clears the 55 checkboxes stored in this browser.')) {
        earned.clear();
        saveEarned();
        renderAll();
      }
    });
    window.addEventListener('hashchange', route);
    renderAll();
    route();
  }

  function fail(msg) {
    document.querySelector('.wrap').innerHTML = '<p>' + msg + '</p>';
  }

  if (data) {
    boot(data);
  } else if (window.fetch) {
    fetch('data/trophies.json').then(function (r) { return r.json(); }).then(boot).catch(function () {
      fail('Could not load the trophy data. Open this page from its folder (data.js next to index.html) or serve it over http.');
    });
  } else {
    fail('Could not load the trophy data. Open this page from its folder (data.js next to index.html).');
  }
})();
