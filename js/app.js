// ─── Init (called after all HTML fragments are loaded) ───
function initApp() {
  showPage('home');
}

// ─── Page routing ───
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const page = document.getElementById('page-' + name);
  if (page) {
    page.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  const navLink = document.getElementById('nav-' + name);
  if (navLink) navLink.classList.add('active');
}

// ─── Mobile menu ───
function toggleMenu() {
  const menu = document.getElementById('mobile-menu');
  menu.classList.toggle('open');
}

// ─── Numerology calculations ───
function reduceNumber(n) {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split('').reduce((a, d) => a + parseInt(d), 0);
  }
  return n;
}

const LETTER_VALUES = {
  A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,
  J:1,K:11,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,
  S:1,T:2,U:3,V:22,W:5,X:6,Y:7,Z:8
};
const VOWELS = new Set(['A','E','I','O','U','Y']);

function nameToValues(name) {
  return name.toUpperCase().replace(/[^A-Z]/g,'').split('');
}

function calcLifePath(m, d, y) {
  const sum = [...String(m), ...String(d), ...String(y)].reduce((a,c) => a + parseInt(c), 0);
  return reduceNumber(sum);
}

function calcExpression(full) {
  // Reduce each name separately, then sum
  return reduceNumber(
    full.trim().split(/\s+/).reduce((total, word) => {
      const wordSum = word.toUpperCase().replace(/[^A-Z]/g,'').split('').reduce((a,c) => a + (LETTER_VALUES[c]||0), 0);
      return total + reduceNumber(wordSum);
    }, 0)
  );
}

function calcSoul(full) {
  const sum = nameToValues(full).filter(c => VOWELS.has(c)).reduce((a,c) => a + (LETTER_VALUES[c]||0), 0);
  return reduceNumber(sum);
}

function calcOuter(full) {
  const sum = nameToValues(full).filter(c => !VOWELS.has(c)).reduce((a,c) => a + (LETTER_VALUES[c]||0), 0);
  return reduceNumber(sum);
}

const FREQ_LABELS = ['Life Path','Expression','Life Calling','Soul','Outer','Achievement','Theme'];
const FREQ_ROLES  = ['What You Learn','What You Carry','Your Mission','Your Inner Desire','Your Public Persona','How You Accomplish','Your Life Curriculum'];
const FREQ_DESC = {
  1:  'Independence, leadership, originality. You are here to forge your own path.',
  2:  'Harmony, cooperation, sensitivity. You are here to build bridges between worlds.',
  3:  'Creativity, expression, joy. You are here to bring beauty and communication into being.',
  4:  'Structure, discipline, foundation. You are here to build something that lasts.',
  5:  'Freedom, change, versatility. You are here to experience and catalyse transformation.',
  6:  'Love, responsibility, nurturing. You are here to care, heal, and create beauty.',
  7:  'Wisdom, introspection, mystery. You are here to seek truth beneath appearances.',
  8:  'Power, ambition, manifestation. You are here to master the material and leave a legacy.',
  9:  'Compassion, completion, universality. You are here to serve the greater whole.',
  11: 'Illumination, inspiration, spiritual sensitivity. A master number — heightened purpose.',
  22: 'Master builder, visionary pragmatism. A master number — world-scale creation.',
  33: 'Master teacher, compassionate wisdom. A master number — the highest service.'
};

function calculateReading() {
  const month = parseInt(document.getElementById('calc-month').value);
  const day   = parseInt(document.getElementById('calc-day').value);
  const year  = parseInt(document.getElementById('calc-year').value);
  const first  = document.getElementById('calc-first').value.trim();
  const middle = document.getElementById('calc-middle').value.trim();
  const last   = document.getElementById('calc-last').value.trim();

  if (!month || !day || !year || !first || !last) {
    document.getElementById('results-area').innerHTML =
      `<div class="results-placeholder-icon" style="color:var(--rose)">⚠</div>
       <div class="results-placeholder-text">Please fill in all required fields</div>`;
    return;
  }

  const fullName = [first, middle, last].filter(Boolean).join(' ');

  const lp      = calcLifePath(month, day, year);
  const exp     = calcExpression(fullName);
  const soul    = calcSoul(fullName);
  const outer   = calcOuter(fullName);
  // Life Calling: concatenate Expression root + Life Path root, then reduce
  const calling = reduceNumber(parseInt(String(exp) + String(lp)));
  // Achievement: Month + Day
  const achieve = reduceNumber(month + day);
  // Theme: sum of year digits
  const theme   = reduceNumber(String(year).split('').reduce((a,c) => a + parseInt(c), 0));

  const numbers = [lp, exp, calling, soul, outer, achieve, theme];

  document.getElementById('results-area').innerHTML = `
    <div style="text-align:center;margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid var(--border-dim)">
      <div style="font-family:'Cinzel',serif;font-size:9px;letter-spacing:.4em;text-transform:uppercase;color:var(--gold-dim);margin-bottom:8px">Reading for</div>
      <div style="font-family:'Cinzel Decorative',serif;font-size:20px;color:var(--gold)">${fullName}</div>
    </div>
    ${numbers.map((n, i) => `
      <div style="padding:20px 0;border-bottom:1px solid var(--border-dim);display:grid;grid-template-columns:50px 1fr;gap:16px;align-items:start">
        <div style="font-family:'Cinzel Decorative',serif;font-size:32px;color:var(--gold);line-height:1;text-align:center">${n}</div>
        <div>
          <div style="font-family:'Cinzel',serif;font-size:8px;letter-spacing:.3em;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px">${FREQ_ROLES[i]}</div>
          <div style="font-family:'Cinzel',serif;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--gold-light);margin-bottom:8px">${FREQ_LABELS[i]}</div>
          <p style="font-size:15px;line-height:1.7;color:var(--text-dim);font-style:italic">${FREQ_DESC[n] || 'A complex frequency — explore its depths.'}</p>
        </div>
      </div>
    `).join('')}
    <p style="text-align:center;font-size:13px;color:var(--text-muted);font-style:italic;margin-top:24px">Download the full app for complete interpretations, archetype analysis, and personal insights.</p>
  `;
}

// ─── Blog ───
function openPost(id) {
  document.getElementById('blog-listing').style.display = 'none';
  document.querySelectorAll('.blog-post').forEach(p => p.classList.remove('active'));
  const post = document.getElementById(id);
  if (post) { post.classList.add('active'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
}

function closePosts() {
  document.querySelectorAll('.blog-post').forEach(p => p.classList.remove('active'));
  document.getElementById('blog-listing').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function filterBlog(category, btn) {
  document.querySelectorAll('.blog-filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const allCards = document.querySelectorAll('#page-blog .blog-card');
  allCards.forEach(card => {
    const show = category === 'all' || card.dataset.category === category;
    card.style.display = show ? 'flex' : 'none';
  });
}