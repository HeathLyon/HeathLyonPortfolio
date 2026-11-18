/* Article feed: reads the generated articles/index.json (no GitHub API token needed). */
(() => {
  'use strict';
  const latestHolder = document.getElementById('featured-latest');
  const randomHolder = document.getElementById('featured-random');
  const listHolder = document.getElementById('article-list');
  const status = document.getElementById('article-feed-status');
  if (!latestHolder || !randomHolder || !listHolder) return;

  const dateLabel = iso => {
    const d = new Date(`${iso}T12:00:00Z`);
    return Number.isNaN(d.getTime()) || iso === '1970-01-01'
      ? 'Undated' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
  };
  const element = (tag, css, content) => {
    const el = document.createElement(tag);
    if (css) el.className = css;
    if (content != null) el.textContent = content;
    return el;
  };
  function createCard(item, featureLabel = '') {
    const article = element('article','portfolio-card');
    if (item.image) {
      const img = element('img','card-photo');
      img.src = item.image;
      img.alt = `Image for ${item.title}`;
      img.loading = 'lazy'; img.decoding = 'async';
      article.append(img);
    }
    const copy = element('div','card-copy');
    if (featureLabel) copy.append(element('p','eyebrow',featureLabel));
    const meta = element('p','eyebrow');
    meta.append(document.createTextNode(`${item.category || 'Article'} · `));
    const time = element('time',null,dateLabel(item.date));
    if (item.date && item.date !== '1970-01-01') time.dateTime = item.date;
    meta.append(time); copy.append(meta);
    const heading = element('h3');
    const headingLink = element('a',null,item.title); headingLink.href = item.url;
    heading.append(headingLink); copy.append(heading);
    if (item.description) copy.append(element('p',null,item.description));
    const read = element('a','text-link','Read article →'); read.href = item.url;
    copy.append(read); article.append(copy);
    return article;
  }
  async function load() {
    try {
      const resp = await fetch('articles/index.json', {cache:'no-store'});
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const raw = await resp.json();
      if (!Array.isArray(raw)) throw new Error('Article feed is not an array');
      const articles = raw.filter(x=>x && x.url && x.title).sort((a,b)=>
        b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
      if (!articles.length) { status.textContent='No articles published yet.'; return; }
      latestHolder.replaceChildren(createCard(articles[0],'Latest story'));
      if (articles.length > 1) {
        const alternatives = articles.slice(1);
        let pool = alternatives;
        try {
          const previous = sessionStorage.getItem('heathfpv-featured-story');
          if (alternatives.length > 1) pool = alternatives.filter(a => a.url !== previous);
        } catch (_) { /* Storage may be unavailable; randomness still works. */ }
        const random = pool[Math.floor(Math.random() * pool.length)];
        try { sessionStorage.setItem('heathfpv-featured-story', random.url); }
        catch (_) { /* Ignore private-mode storage restrictions. */ }
        randomHolder.replaceChildren(createCard(random,'From the archive'));
        randomHolder.hidden = false;
      } else randomHolder.hidden = true;
      listHolder.replaceChildren(...articles.map(a=>createCard(a)));
      status.textContent = `${articles.length} article${articles.length === 1?'':'s'} published`;
    } catch(err) {
      console.error('Cannot load article feed:',err);
      status.textContent='The article list could not load. Please refresh or try again shortly.';
    }
  }
  load();
})();
