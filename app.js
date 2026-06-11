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
    +   '<p class="blurb">' + esc(book.blurb || '') + '</p>'
    +   '<div class="buy-row">'
    +     payfastForm(book, 'Hatfield \u00b7 collect or deliver', book.priceLocal, 'Hatfield delivery/collection', false)
    +     payfastForm(book, 'Courier \u00b7 anywhere in SA', book.priceCourier, 'courier', true)
    +     '<a class="cod-link" href="order.html?isbn=' + encodeURIComponent(cleanIsbn(book.isbn))
    +       + '&amp;book=' + encodeURIComponent(book.title) + '">Or reserve &amp; pay cash in Hatfield</a>'
    +   '</div>'
    + '</article>';
}

function renderBooks(list) {
  const shelf = document.getElementById('shelf');
  if (!shelf) return;
  shelf.innerHTML = list.map(bookCard).join('');
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
}

/* ---- 5. Order page prefill (cash on delivery) ----------------------- */
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name) || '';
}

function wireOrderPrefill() {
  const bookField = document.getElementById('order-book');
  if (!bookField) return;
  const book = getParam('book');
  const isbn = getParam('isbn');
  if (book) bookField.value = book;
  const isbnField = document.getElementById('order-isbn');
  if (isbnField) isbnField.value = isbn;
}

/* ---- 6. Boot -------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('shelf') && typeof BOOKS !== 'undefined') {
    renderBooks(BOOKS);
    enrichCovers();
    const search = document.getElementById('search');
    if (search) {
      search.addEventListener('input', function () { renderBooks(searchBooks(search.value)); });
    }
  }
  wireIsbnLookup();
  wireOrderPrefill();
});
