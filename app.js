/* =========================================================
   Alpha Books — catalogue rendering, search, ISBN lookup
   Plain vanilla JS. No build step. Runs on GitHub Pages.
   ========================================================= */

/* ---- 1. Set these once ---------------------------------------------- */
const SITE = {
  // From your PayFast dashboard (Settings > Integration):
  payfastMerchantId:  "PAYFAST_MERCHANT_ID",
  payfastMerchantKey: "PAYFAST_MERCHANT_KEY",
  // Live: https://www.payfast.co.za/eng/process
  // Test: https://sandbox.payfast.co.za/eng/process
  payfastUrl: "https://www.payfast.co.za/eng/process",
  // Your GitHub Pages URLs:
  returnUrl: "https://YOURUSERNAME.github.io/thanks.html",
  cancelUrl: "https://YOURUSERNAME.github.io/index.html"
};

const PLACEHOLDER_COVER = "https://placehold.co/300x400/eef0ef/5b6468?text=No+cover";
const coverCache = {};

/* ---- 2. Small helpers ----------------------------------------------- */
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function cleanIsbn(s) {
  return (s || "").replace(/[^0-9Xx]/g, "").toUpperCase();
}

function coverUrl(book) {
  if (book.cover) return book.cover;
  const isbn = cleanIsbn(book.isbn);
  if (isbn && coverCache[isbn]) return coverCache[isbn];
  return isbn ? "https://covers.openlibrary.org/b/isbn/" + isbn + "-L.jpg" : PLACEHOLDER_COVER;
}

/* ---- 3. Catalogue rendering ----------------------------------------- */
function payfastForm(book, label, amount, suffix, alt) {
  const amt = Number(amount).toFixed(2);
  return ''
    + '<form class="paystation" action="' + esc(SITE.payfastUrl) + '" method="post">'
    +   '<input type="hidden" name="merchant_id"  value="' + esc(SITE.payfastMerchantId) + '">'
    +   '<input type="hidden" name="merchant_key" value="' + esc(SITE.payfastMerchantKey) + '">'
    +   '<input type="hidden" name="return_url"   value="' + esc(SITE.returnUrl) + '">'
    +   '<input type="hidden" name="cancel_url"   value="' + esc(SITE.cancelUrl) + '">'
    +   '<input type="hidden" name="amount"       value="' + amt + '">'
    +   '<input type="hidden" name="item_name"    value="' + esc(book.title) + ' (' + esc(suffix) + ')">'
    +   '<button type="submit" class="buy' + (alt ? ' alt' : '') + '">'
    +     '<span class="label">' + esc(label) + '</span>'
    +     '<span class="price">R' + Math.round(amount) + '</span>'
    +   '</button>'
    + '</form>';
}

function bookCard(book) {
  const stamp = book.condition ? '<span class="stamp">' + esc(book.condition) + '</span>' : '';
  const detail = [book.edition, book.year].filter(Boolean).join(' \u00b7 ');
  const isbn = cleanIsbn(book.isbn);
  return ''
    + '<article class="book">'
    +   stamp
    +   '<div class="cover">'
    +     '<img src="' + esc(coverUrl(book)) + '" alt="Cover of ' + esc(book.title) + '" loading="lazy" '
    +          'data-isbn="' + esc(cleanIsbn(book.isbn)) + '" '
    +          'onerror="this.onerror=null;this.src=\'' + PLACEHOLDER_COVER + '\';">'
    +   '</div>'
    +   '<h3>' + esc(book.title) + '</h3>'
    +   (book.author ? '<p class="author">' + esc(book.author) + '</p>' : '')
    +   (detail ? '<p class="detail">' + esc(detail) + '</p>' : '')
    +   (isbn ? '<p class="isbn-line">ISBN ' + esc(isbn) + '</p>' : '')
    +   '<p class="blurb">' + esc(book.blurb || '') + '</p>'
    +   '<div class="buy-row">'
    +     payfastForm(book, 'Hatfield \u00b7 collect or deliver', book.priceLocal, 'Hatfield delivery/collection', false)
    +     payfastForm(book, 'Courier \u00b7 anywhere in SA', book.priceCourier, 'courier', true)
    +     '<a class="cod-link" href="https://wa.me/27608837967?text='
    +       + encodeURIComponent('Hi Alpha Books, I would like to reserve and pay cash for: '
    +           + book.title + ' (ISBN ' + isbn + '). Is it still available?')
    +       + '" target="_blank" rel="noopener">Reserve &amp; pay cash on WhatsApp</a>'
    +   '</div>'
    + '</article>';
}

function renderBooks(list) {
  const shelf = document.getElementById('shelf');
  if (!shelf) return;
  shelf.innerHTML = list.map(bookCard).join('');
  revealCards(shelf);
  const count = document.getElementById('count');
  if (count) count.textContent = list.length + (list.length === 1 ? ' title' : ' titles');
  const empty = document.getElementById('no-results');
  if (empty) empty.hidden = list.length !== 0;
}

function searchBooks(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return BOOKS.slice();
  const qIsbn = cleanIsbn(q);
  return BOOKS.filter(function (b) {
    const byIsbn = qIsbn && cleanIsbn(b.isbn).indexOf(qIsbn) !== -1;
    const byText = (b.title + ' ' + (b.author || '')).toLowerCase().indexOf(q) !== -1;
    return byIsbn || byText;
  });
}

/* Pull cover thumbnails from Google Books (strong on textbooks) and swap
   them in once they arrive. Cached so search re-renders don't refetch. */
async function enrichCovers() {
  for (const book of BOOKS) {
    const isbn = cleanIsbn(book.isbn);
    if (book.cover || !isbn || coverCache[isbn]) continue;
    try {
      const res = await fetch('https://www.googleapis.com/books/v1/volumes?q=isbn:' + isbn);
      if (!res.ok) continue;
      const data = await res.json();
      const info = data.totalItems > 0 && data.items && data.items[0].volumeInfo;
      if (info && info.imageLinks) {
        const url = (info.imageLinks.thumbnail || info.imageLinks.smallThumbnail || '').replace('http://', 'https://');
        if (url) {
          coverCache[isbn] = url;
          document.querySelectorAll('img[data-isbn="' + isbn + '"]').forEach(function (img) { img.src = url; });
        }
      }
    } catch (e) { /* keep the existing fallback cover */ }
  }
}

/* ---- 3b. Search that falls through to a live ISBN lookup ------------ */
let lookupTimer = null;

function showSearching() {
  const shelf = document.getElementById('shelf');
  const count = document.getElementById('count');
  const empty = document.getElementById('no-results');
  if (empty) empty.hidden = true;
  if (count) count.textContent = 'Searching\u2026';
  if (shelf) shelf.innerHTML = '<p class="searching">Checking the book databases\u2026</p>';
}

/* A valid book that is not in stock: shown with a Not available mark
   and a route to sell it. */
function unavailableCard(b) {
  const isbn = cleanIsbn(b.isbn);
  const cover = b.cover || (isbn ? 'https://covers.openlibrary.org/b/isbn/' + isbn + '-L.jpg' : PLACEHOLDER_COVER);
  return ''
    + '<article class="book unavailable">'
    +   '<span class="stamp out">Not available</span>'
    +   '<div class="cover"><img src="' + esc(cover) + '" alt="Cover of ' + esc(b.title) + '" loading="lazy" '
    +        'onerror="this.onerror=null;this.src=\'' + PLACEHOLDER_COVER + '\';"></div>'
    +   '<h3>' + esc(b.title) + '</h3>'
    +   (b.author ? '<p class="author">' + esc(b.author) + '</p>' : '')
    +   (b.year ? '<p class="detail">' + esc(b.year) + '</p>' : '')
    +   (isbn ? '<p class="isbn-line">ISBN ' + esc(isbn) + '</p>' : '')
    +   '<p class="blurb">Not in stock right now. If you have a copy, you can sell it through Alpha Books.</p>'
    +   '<div class="buy-row">'
    +     '<a class="buy alt sell-this" href="sell.html?isbn=' + encodeURIComponent(isbn) + '">'
    +       '<span class="label">Have a copy? Sell it here</span></a>'
    +   '</div>'
    + '</article>';
}

async function lookupUnavailable(isbn) {
  const found = await fetchBookByIsbn(isbn);
  const search = document.getElementById('search');
  if (search && cleanIsbn(search.value) !== isbn) return; // the query moved on
  const shelf = document.getElementById('shelf');
  const count = document.getElementById('count');
  const empty = document.getElementById('no-results');
  if (found && found.title) {
    if (shelf) shelf.innerHTML = unavailableCard(found);
    if (count) count.textContent = 'Not in stock';
    if (empty) empty.hidden = true;
  } else {
    if (shelf) shelf.innerHTML = '';
    if (count) count.textContent = '0 titles';
    if (empty) empty.hidden = false;
  }
}

function handleSearch(value) {
  const matches = searchBooks(value);
  if (matches.length > 0) { renderBooks(matches); clearTimeout(lookupTimer); return; }
  clearTimeout(lookupTimer);
  const isbn = cleanIsbn(value);
  if (isbn.length === 10 || isbn.length === 13) {
    showSearching();
    lookupTimer = setTimeout(function () { lookupUnavailable(isbn); }, 350);
  } else {
    renderBooks([]); // empties the shelf and shows the prompt
  }
}

/* ---- 3c. Motion: scroll reveals + header shadow ---------------------- */
/* Cards stay fully visible if JS or IntersectionObserver is unavailable,
   and CSS skips the effect entirely under prefers-reduced-motion. */
function revealCards(shelf) {
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
  shelf.querySelectorAll('.book').forEach(function (card, i) {
    card.classList.add('pre');
    card.style.transitionDelay = (i % 4) * 70 + 'ms';
    io.observe(card);
  });
}

function wireHeaderShadow() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 8); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ---- 4. ISBN lookup (Sell page) ------------------------------------- */
/* Tries Google Books first, then Open Library. Returns null if no match. */
async function fetchBookByIsbn(isbnRaw) {
  const isbn = cleanIsbn(isbnRaw);
  if (!isbn) return null;

  try {
    const res = await fetch('https://www.googleapis.com/books/v1/volumes?q=isbn:' + isbn);
    if (res.ok) {
      const data = await res.json();
      if (data.totalItems > 0 && data.items && data.items[0].volumeInfo) {
        const v = data.items[0].volumeInfo;
        let cover = '';
        if (v.imageLinks) cover = (v.imageLinks.thumbnail || v.imageLinks.smallThumbnail || '').replace('http://', 'https://');
        return {
          isbn: isbn,
          title: v.title || '',
          author: (v.authors || []).join(', '),
          year: (v.publishedDate || '').slice(0, 4),
          cover: cover
        };
      }
    }
  } catch (e) { /* try the fallback */ }

  try {
    const res = await fetch('https://openlibrary.org/api/books?bibkeys=ISBN:' + isbn + '&format=json&jscmd=data');
    if (res.ok) {
      const data = await res.json();
      const rec = data['ISBN:' + isbn];
      if (rec) {
        const yearMatch = (rec.publish_date || '').match(/\d{4}/);
        let cover = '';
        if (rec.cover) cover = rec.cover.large || rec.cover.medium || '';
        return {
          isbn: isbn,
          title: rec.title || '',
          author: (rec.authors || []).map(function (a) { return a.name; }).join(', '),
          year: yearMatch ? yearMatch[0] : '',
          cover: cover
        };
      }
    }
  } catch (e) { /* give up gracefully */ }

  return null;
}

function wireIsbnLookup() {
  const btn = document.getElementById('isbn-lookup-btn');
  const input = document.getElementById('isbn-input');
  const status = document.getElementById('isbn-status');
  const preview = document.getElementById('isbn-preview');
  const books = document.getElementById('books');
  if (!btn || !input) return;

  async function run() {
    if (!cleanIsbn(input.value)) { status.textContent = 'Enter an ISBN first.'; return; }
    status.textContent = 'Looking up…';
    if (preview) preview.hidden = true;
    const b = await fetchBookByIsbn(input.value);
    if (!b || !b.title) {
      status.textContent = 'No match found. You can type the details into the list by hand.';
      return;
    }
    status.textContent = '';
    if (preview) {
      const cover = b.cover || coverUrl({ isbn: b.isbn });
      preview.hidden = false;
      preview.innerHTML =
        '<img src="' + esc(cover) + '" alt="" onerror="this.style.display=\'none\'">' +
        '<div><strong>' + esc(b.title) + '</strong><br>' + esc(b.author) +
        (b.year ? ' &middot; ' + esc(b.year) : '') + '</div>';
    }
    if (books) {
      const line = b.title + (b.author ? ' by ' + b.author : '') + ' (ISBN ' + b.isbn + ')';
      books.value = books.value ? books.value.trim() + '\n' + line : line;
    }
    input.value = '';
    input.focus();
  }

  btn.addEventListener('click', run);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); run(); }
  });

  // Arriving from a "Sell it here" link with ?isbn=... : look it up straight away
  const pre = cleanIsbn(getParam('isbn'));
  if (pre) { input.value = pre; run(); }
}

/* ---- 5. URL params (used by the sell-page ISBN prefill) ------------- */
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name) || '';
}

/* ---- 6. Boot -------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('shelf') && typeof BOOKS !== 'undefined') {
    renderBooks(BOOKS);
    enrichCovers();
    const search = document.getElementById('search');
    if (search) {
      search.addEventListener('input', function () { handleSearch(search.value); });
    }
  }
  wireIsbnLookup();
  wireHeaderShadow();
});
