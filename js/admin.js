// ══════════════════════════════════════════════════════════════
// SSC ADMIN SYSTEM — Blog CMS
// Access: navigate to #admin in the URL, or press Ctrl+Shift+A
// Password: set PASS below
// ══════════════════════════════════════════════════════════════

var adminSystem = (function () {
  'use strict';

  // ── CHANGE THIS PASSWORD ────────────────────────────────────
  var PASS = 'ssc2025';
  // ────────────────────────────────────────────────────────────

  var STORAGE_KEY = 'ssc-blog-posts';
  var posts = [];       // loaded from storage
  var editingId = null; // null = new post, string = editing existing

  // ── Storage helpers (uses artifact persistent storage API) ──
  function loadPosts() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      posts = raw ? JSON.parse(raw) : [];
    } catch (e) { posts = []; }
  }

  function savePosts() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch (e) {
      showToast('Storage error — posts may not persist');
    }
  }

  // ── Open / Close ────────────────────────────────────────────
  function open() {
    var overlay = document.getElementById('admin-overlay');
    if (!overlay) return;
    overlay.classList.add('open');
    // If already authed this session
    if (sessionStorage.getItem('ssc-admin-auth') === '1') {
      showPanel();
    } else {
      document.getElementById('admin-login').style.display = 'flex';
      document.getElementById('admin-panel').classList.remove('open');
      setTimeout(function () {
        var inp = document.getElementById('admin-pass-input');
        if (inp) inp.focus();
      }, 100);
    }
  }

  function close() {
    document.getElementById('admin-overlay').classList.remove('open');
    // Re-enable page scroll
    document.body.style.overflow = '';
  }

  function showPanel() {
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-panel').classList.add('open');
    document.body.style.overflow = 'hidden';
    loadPosts();
    renderPostsList();
    renderDynamicPosts();
  }

  // ── Auth ────────────────────────────────────────────────────
  function login() {
    var val = (document.getElementById('admin-pass-input').value || '').trim();
    var err = document.getElementById('admin-login-error');
    if (val === PASS) {
      sessionStorage.setItem('ssc-admin-auth', '1');
      document.getElementById('admin-pass-input').value = '';
      err.textContent = '';
      showPanel();
    } else {
      err.textContent = 'Incorrect passphrase.';
      document.getElementById('admin-pass-input').value = '';
      document.getElementById('admin-pass-input').focus();
    }
  }

  // ── Tab switching ────────────────────────────────────────────
  function switchTab(name) {
    document.querySelectorAll('.admin-tab').forEach(function (t) { t.classList.remove('active'); });
    document.querySelectorAll('.admin-tab-btn').forEach(function (b) { b.classList.remove('active'); });
    var tab = document.getElementById('tab-' + name);
    var btn = document.getElementById('tab-btn-' + name);
    if (tab) tab.classList.add('active');
    if (btn) btn.classList.add('active');
    if (name === 'preview') buildPreview();
    if (name === 'posts')   renderPostsList();
  }

  // ── Toolbar helpers ──────────────────────────────────────────
  function wrap(before, after, mode) {
    var ta = document.getElementById('admin-body');
    var start = ta.selectionStart, end = ta.selectionEnd;
    var sel   = ta.value.substring(start, end);
    var replacement;
    if (mode === 'heading' || mode === 'quote') {
      replacement = before + (sel || 'Text here');
    } else {
      replacement = before + (sel || 'text') + after;
    }
    ta.value = ta.value.substring(0, start) + replacement + ta.value.substring(end);
    ta.focus();
    ta.selectionStart = start + before.length;
    ta.selectionEnd   = start + replacement.length - after.length;
  }

  function insertBreak() {
    var ta = document.getElementById('admin-body');
    var pos = ta.selectionStart;
    ta.value = ta.value.substring(0, pos) + '\n\n' + ta.value.substring(pos);
    ta.selectionStart = ta.selectionEnd = pos + 2;
    ta.focus();
  }

  // ── Markdown → HTML converter (lightweight) ─────────────────
  function markdownToHtml(md) {
    var lines  = (md || '').split('\n');
    var html   = '';
    var inPara = false;

    function closePara() { if (inPara) { html += '</p>\n'; inPara = false; } }

    lines.forEach(function (line) {
      line = line
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        // Re-allow our own tags after escaping... use markers instead
      ;
      var trimmed = line.trim();

      // Headings
      if (/^#{1,3}\s/.test(trimmed)) {
        closePara();
        var text = trimmed.replace(/^#+\s/, '');
        text = inlineFormat(text);
        html += '<h3>' + text + '</h3>\n';
        return;
      }
      // Blockquote
      if (/^>\s/.test(trimmed)) {
        closePara();
        html += '<blockquote>' + inlineFormat(trimmed.slice(2)) + '</blockquote>\n';
        return;
      }
      // Blank line — close para
      if (!trimmed) {
        closePara();
        return;
      }
      // Regular text — open/extend para
      if (!inPara) { html += '<p>'; inPara = true; }
      else { html += ' '; }
      html += inlineFormat(trimmed);
    });
    closePara();
    return html;
  }

  function inlineFormat(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
  }

  // ── Category badge ───────────────────────────────────────────
  function categoryBadge(cat) {
    var labels = { numerology: 'Numerology', philosophy: 'Philosophy', numbers: 'The Numbers', practice: 'Practice' };
    var cls    = { philosophy: ' gold', numbers: ' teal', practice: ' rose' };
    return '<span class="blog-tag' + (cls[cat] || '') + '">' + (labels[cat] || cat) + '</span>';
  }

  // Glyph per category
  function categoryGlyph(cat) {
    return { numerology: '&#9732;', philosophy: '&#10022;', numbers: '&#9651;', practice: '&#9998;' }[cat] || '&#10022;';
  }

  // ── Preview ──────────────────────────────────────────────────
  function buildPreview() {
    var title    = (document.getElementById('admin-title').value    || '').trim();
    var category = document.getElementById('admin-category').value;
    var date     = (document.getElementById('admin-date').value     || '').trim();
    var body     = document.getElementById('admin-body').value;
    var el       = document.getElementById('admin-preview-content');

    if (!title && !body) {
      el.innerHTML = '<div class="admin-empty">Fill in the Write tab to see a preview.</div>';
      return;
    }

    var readTime = Math.max(1, Math.round(body.split(/\s+/).length / 200));

    el.innerHTML =
      '<div class="blog-post-eyebrow">' + categoryBadge(category) + '</div>' +
      '<h1 class="preview-banner">' + (title || 'Untitled') + '</h1>' +
      '<div class="preview-meta">' +
        '<span class="blog-date">' + (date || 'Draft') + '</span>' +
        '<span style="color:var(--text-muted)">&middot;</span>' +
        '<span class="blog-date">' + readTime + ' min read</span>' +
      '</div>' +
      '<div class="preview-body">' + markdownToHtml(body) + '</div>';
  }

  // ── Publish ──────────────────────────────────────────────────
  function publish() {
    var title    = (document.getElementById('admin-title').value    || '').trim();
    var category = document.getElementById('admin-category').value;
    var date     = (document.getElementById('admin-date').value     || '').trim() || formatDate(new Date());
    var excerpt  = (document.getElementById('admin-excerpt').value  || '').trim();
    var body     = (document.getElementById('admin-body').value     || '').trim();
    var idInput  = document.getElementById('admin-editing-id').value;

    if (!title) { showToast('Please add a title first.'); return; }
    if (!body)  { showToast('Please write some content.'); return; }

    loadPosts();

    if (idInput) {
      // Edit existing
      var idx = posts.findIndex(function (p) { return p.id === idInput; });
      if (idx >= 0) {
        posts[idx] = { id: idInput, title: title, category: category, date: date, excerpt: excerpt, body: body };
      }
    } else {
      // New post
      var id = 'dyn-' + Date.now();
      posts.push({ id: id, title: title, category: category, date: date, excerpt: excerpt, body: body });
    }

    savePosts();
    renderDynamicPosts();
    renderPostsList();
    clearForm();
    showToast(idInput ? 'Post updated!' : 'Post published!');
    switchTab('posts');
  }

  function formatDate(d) {
    var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return months[d.getMonth()] + ' ' + d.getFullYear();
  }

  // ── Edit existing ────────────────────────────────────────────
  function editPost(id) {
    var post = posts.find(function (p) { return p.id === id; });
    if (!post) return;
    document.getElementById('admin-editing-id').value = id;
    document.getElementById('admin-title').value    = post.title;
    document.getElementById('admin-category').value = post.category;
    document.getElementById('admin-date').value     = post.date;
    document.getElementById('admin-excerpt').value  = post.excerpt || '';
    document.getElementById('admin-body').value     = post.body;
    switchTab('write');
  }

  // ── Delete ───────────────────────────────────────────────────
  function deletePost(id) {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    posts = posts.filter(function (p) { return p.id !== id; });
    savePosts();
    renderDynamicPosts();
    renderPostsList();
    showToast('Post deleted.');
  }

  // ── Clear form ───────────────────────────────────────────────
  function clearForm() {
    document.getElementById('admin-editing-id').value = '';
    document.getElementById('admin-title').value    = '';
    document.getElementById('admin-category').value = 'numerology';
    document.getElementById('admin-date').value     = '';
    document.getElementById('admin-excerpt').value  = '';
    document.getElementById('admin-body').value     = '';
    editingId = null;
  }

  // ── Render dynamic posts into blog listing ───────────────────
  function renderDynamicPosts() {
    // Remove any previously injected dynamic cards + post articles
    document.querySelectorAll('.dyn-blog-card, .dyn-blog-post').forEach(function (el) { el.remove(); });

    var grid = document.getElementById('blog-grid');
    if (!grid) return;

    posts.forEach(function (post) {
      // Card
      var card = document.createElement('div');
      card.className = 'blog-card dyn-blog-card';
      card.setAttribute('data-category', post.category);
      card.onclick = function () { openDynPost(post.id); };
      card.innerHTML =
        '<div class="blog-card-banner" style="height:120px">' +
          '<div class="blog-card-glyph" style="font-size:38px">' + categoryGlyph(post.category) + '</div>' +
        '</div>' +
        '<div class="blog-card-body">' +
          '<div class="blog-card-meta">' + categoryBadge(post.category) + '<span class="blog-date">' + post.date + '</span></div>' +
          '<div class="blog-card-title">' + escHtml(post.title) + '</div>' +
          (post.excerpt ? '<p class="blog-card-excerpt">' + escHtml(post.excerpt) + '</p>' : '') +
          '<div class="blog-read-more">Read Article &#8594;</div>' +
        '</div>';
      grid.appendChild(card);

      // Full post article
      var article = document.createElement('div');
      article.className = 'blog-post dyn-blog-post';
      article.id = 'dyn-post-' + post.id;
      var readTime = Math.max(1, Math.round(post.body.split(/\s+/).length / 200));
      article.innerHTML =
        '<button class="blog-post-back" onclick="closePosts()">&#8592; Back to Blog</button>' +
        '<div class="blog-post-eyebrow">' + categoryBadge(post.category) + '</div>' +
        '<h1 class="blog-post-title">' + escHtml(post.title) + '</h1>' +
        '<div class="blog-post-meta">' + escHtml(post.date) + ' &middot; ' + readTime + ' min read</div>' +
        '<div class="blog-post-content">' + markdownToHtml(post.body) + '</div>';
      document.getElementById('page-blog').appendChild(article);
    });
  }

  function openDynPost(id) {
    document.getElementById('blog-listing').style.display = 'none';
    document.querySelectorAll('.blog-post').forEach(function (p) { p.classList.remove('active'); });
    var post = document.getElementById('dyn-post-' + id);
    if (post) { post.classList.add('active'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  }

  // ── Render posts list in admin ───────────────────────────────
  function renderPostsList() {
    var container = document.getElementById('admin-posts-list-inner');
    if (!container) return;
    if (!posts.length) {
      container.innerHTML = '<div class="admin-empty">No dynamic posts yet. Write one!</div>';
      return;
    }
    container.innerHTML = posts.slice().reverse().map(function (post) {
      return (
        '<div class="admin-post-item">' +
          '<div class="admin-post-info">' +
            '<div class="admin-post-title">' + escHtml(post.title) + '</div>' +
            '<div class="admin-post-meta">' + categoryBadge(post.category) + ' &nbsp;' + escHtml(post.date) + '</div>' +
          '</div>' +
          '<div class="admin-post-btns">' +
            '<button class="admin-post-edit"   onclick="adminSystem.editPost(\'' + post.id + '\')">Edit</button>' +
            '<button class="admin-post-delete" onclick="adminSystem.deletePost(\'' + post.id + '\')">Delete</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  // ── Toast ────────────────────────────────────────────────────
  function showToast(msg) {
    var t = document.getElementById('admin-toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function () { t.classList.remove('show'); }, 2800);
  }

  // ── Escape HTML ──────────────────────────────────────────────
  function escHtml(s) {
    return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Boot ─────────────────────────────────────────────────────
  function boot() {
    // Load and render any stored posts immediately
    loadPosts();
    if (posts.length) renderDynamicPosts();

    // Keyboard shortcut: Ctrl+Shift+A
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') { e.preventDefault(); open(); }
    });

    // Hash trigger: navigate to #admin
    function checkHash() {
      if (window.location.hash === '#admin') {
        window.location.hash = '';
        open();
      }
    }
    checkHash();
    window.addEventListener('hashchange', checkHash);

    // Hidden trigger button (click 5 times fast)
    var triggerClicks = 0, triggerTimer = null;
    var trigger = document.getElementById('admin-trigger');
    if (trigger) {
      trigger.addEventListener('click', function () {
        triggerClicks++;
        clearTimeout(triggerTimer);
        if (triggerClicks >= 5) { triggerClicks = 0; open(); }
        else { triggerTimer = setTimeout(function () { triggerClicks = 0; }, 1200); }
      });
    }

    // Close on overlay background click
    document.getElementById('admin-overlay').addEventListener('click', function (e) {
      if (e.target === this) close();
    });
  }

  // ── Public API ─────────────────────────────────────────────
  return {
    open:       open,
    close:      close,
    login:      login,
    switchTab:  switchTab,
    wrap:       wrap,
    insertBreak:insertBreak,
    publish:    publish,
    editPost:   editPost,
    deletePost: deletePost,
    clearForm:  clearForm,
    buildPreview: buildPreview,
    exportCode: exportCode,
    boot:       boot,
  };

  // ── Export code ──────────────────────────────────────────────
  function exportCode() {
    loadPosts();
    if (!posts.length) { showToast('No dynamic posts to export yet.'); return; }

    var cardsHtml = posts.map(function(post) {
      var readTime = Math.max(1, Math.round(post.body.split(/\s+/).length / 200));
      var labels = { numerology: 'Numerology', philosophy: 'Philosophy', numbers: 'The Numbers', practice: 'Practice' };
      var cls    = { philosophy: ' gold', numbers: ' teal', practice: ' rose' };
      var glyph  = { numerology: '&#9732;', philosophy: '&#10022;', numbers: '&#9651;', practice: '&#9998;' }[post.category] || '&#10022;';
      return (
        '<div class="blog-card" onclick="openPost('' + post.id + '')" data-category="' + post.category + '">
' +
        '  <div class="blog-card-banner" style="height:120px"><div class="blog-card-glyph" style="font-size:38px">' + glyph + '</div></div>
' +
        '  <div class="blog-card-body">
' +
        '    <div class="blog-card-meta"><span class="blog-tag' + (cls[post.category]||'') + '">' + (labels[post.category]||post.category) + '</span><span class="blog-date">' + escHtml(post.date) + '</span></div>
' +
        '    <div class="blog-card-title">' + escHtml(post.title) + '</div>
' +
        '    ' + (post.excerpt ? '<p class="blog-card-excerpt">' + escHtml(post.excerpt) + '</p>
' : '') +
        '    <div class="blog-read-more">Read Article &#8594;</div>
' +
        '  </div>
' +
        '</div>'
      );
    }).join('
');

    var postsHtml = posts.map(function(post) {
      var readTime = Math.max(1, Math.round(post.body.split(/\s+/).length / 200));
      var labels = { numerology: 'Numerology', philosophy: 'Philosophy', numbers: 'The Numbers', practice: 'Practice' };
      var cls    = { philosophy: ' gold', numbers: ' teal', practice: ' rose' };
      return (
        '<div class="blog-post" id="' + post.id + '">
' +
        '  <button class="blog-post-back" onclick="closePosts()">&#8592; Back to Blog</button>
' +
        '  <div class="blog-post-eyebrow"><span class="blog-tag' + (cls[post.category]||'') + '">' + (labels[post.category]||post.category) + '</span></div>
' +
        '  <h1 class="blog-post-title">' + escHtml(post.title) + '</h1>
' +
        '  <div class="blog-post-meta">' + escHtml(post.date) + ' &middot; ' + readTime + ' min read</div>
' +
        '  <div class="blog-post-content">
    ' + markdownToHtml(post.body).replace(/
/g,'
    ') + '
  </div>
' +
        '</div>'
      );
    }).join('

');

    var out = '<!-- PASTE CARDS into #blog-grid -->
' + cardsHtml + '

<!-- PASTE POSTS before </div><!-- /page-blog --> -->
' + postsHtml;

    var ta = document.getElementById('admin-export-output');
    ta.value = out;
    switchTab('export');
    showToast('Code ready — copy and paste into your index.html');
  }

})(); // end adminSystem IIFE
