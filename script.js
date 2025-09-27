// ====== Config ======
const TMDB_KEY = "REPLACE_WITH_TMDB_API_KEY"; // Create one in TMDB settings [Docs] [web:22]
const API = "https://api.themoviedb.org/3"; // TMDB v3 base [web:22]
const IMG_BASE = "https://image.tmdb.org/t/p/"; // Image CDN base [web:28]
const POSTER_SIZE = "w342"; // choose w342/w500 per device [web:28]

// ====== State ======
let page = 1;
let loading = false;
let done = false;
let currentQuery = "";
let currentGenre = 0; // 0 = all
let currentSort = "popularity.desc";
let genresMap = new Map();
let cache = new Map(); // cache by key
const favSet = new Set(JSON.parse(localStorage.getItem("favSet") || "[]"));
const ratings = JSON.parse(localStorage.getItem("ratings") || "{}");

// ====== DOM ======
const grid = document.getElementById("grid");
const genreChips = document.getElementById("genreChips");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const favOnly = document.getElementById("favOnly");
const suggestions = document.getElementById("suggestions");
const themeBtn = document.getElementById("themeBtn");
const sentinel = document.getElementById("sentinel");

// Modal
const modal = document.getElementById("detailsModal");
const closeModal = document.getElementById("closeModal");
const modalPoster = document.getElementById("modalPoster");
const modalTitle = document.getElementById("modalTitle");
const modalMeta = document.getElementById("modalMeta");
const modalOverview = document.getElementById("modalOverview");
const modalStars = document.getElementById("modalStars");
const modalFav = document.getElementById("modalFav");

// ====== Helpers ======
const qs = (params) => new URLSearchParams(params).toString(); // build query strings [web:31]
const withKey = (url, params={}) => `${url}?${qs({ api_key: TMDB_KEY, ...params })}`; // TMDB v3 key [web:22]
const imgUrl = (path) => path ? `${IMG_BASE}${POSTER_SIZE}${path}` : ""; // base + size + path [web:28]

function saveFavs() { localStorage.setItem("favSet", JSON.stringify([...favSet])); }
function saveRatings() { localStorage.setItem("ratings", JSON.stringify(ratings)); }

// Simple contains search with accents/spacing normalization (fast and dependency-free) [web:31]
const norm = (s) => (s || "").toLowerCase().normalize("NFKD").replace(/\p{Diacritic}/gu, "");
function matches(term, title) { return norm(title).includes(norm(term)); }

// ====== Render ======
function skeleton(n = 12) {
  grid.innerHTML = "";
  const tpl = document.getElementById("skeletonCard");
  for (let i = 0; i < n; i++) {
    grid.append(tpl.content.cloneNode(true));
  }
}

function renderMovies(items, append=false) {
  const frag = document.createDocumentFragment();
  items.forEach(m => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <img loading="lazy" class="poster" alt="${m.title || ""}" src="${imgUrl(m.poster_path)}" />
      <div class="content">
        <div class="title">${m.title || m.name || "Untitled"}</div>
        <div class="meta">
          <span class="badge">⭐ ${m.vote_average?.toFixed(1) || "–"}</span>
          <span>${(m.release_date || m.first_air_date || "—").slice(0,4)}</span>
          <span>${(m.genre_ids || []).slice(0,2).map(id => genresMap.get(id)).filter(Boolean).join(" • ")}</span>
        </div>
        <div class="actions">
          <button class="icon-btn fav" title="Favorite">${favSet.has(m.id) ? "♥" : "♡"}</button>
          <div class="stars" data-id="${m.id}">
            ${[1,2,3,4,5].map(k => `<span class="star ${((ratings[m.id]||0) >= k) ? "filled" : ""}" data-k="${k}">★</span>`).join("")}
          </div>
          <button class="icon-btn more" title="Details">⋯</button>
        </div>
      </div>
    `;
    // Handlers
    card.querySelector(".fav").addEventListener("click", (e) => {
      if (favSet.has(m.id)) favSet.delete(m.id); else favSet.add(m.id);
      saveFavs();
      e.currentTarget.textContent = favSet.has(m.id) ? "♥" : "♡";
      if (favOnly.checked && !favSet.has(m.id)) card.remove();
    });
    card.querySelector(".stars").addEventListener("click", (e) => {
      const sp = e.target.closest(".star"); if (!sp) return;
      const k = Number(sp.dataset.k); ratings[m.id] = k; saveRatings();
      [...e.currentTarget.querySelectorAll(".star")].forEach(s => s.classList.toggle("filled", Number(s.dataset.k) <= k));
    });
    card.querySelector(".more").addEventListener("click", () => openModal(m));
    frag.append(card);
  });
  if (!append) grid.innerHTML = "";
  grid.append(frag);
}

function renderSuggestions(list) {
  suggestions.innerHTML = "";
  if (!list.length) return suggestions.classList.remove("open");
  list.slice(0, 8).forEach(m => {
    const row = document.createElement("div");
    row.className = "suggestion";
    row.innerHTML = `
      <img alt="" width="28" height="42" style="object-fit:cover;border-radius:4px" src="${imgUrl(m.poster_path)}" />
      <div>${m.title}</div>
    `;
    row.addEventListener("click", () => {
      suggestions.classList.remove("open");
      searchInput.value = m.title;
      currentQuery = m.title;
      reload();
    });
    suggestions.append(row);
  });
  suggestions.classList.add("open");
}

// ====== API ======
async function fetchJSON(url) {
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error("Network error");
  const data = await res.json();
  cache.set(url, data);
  return data;
}

async function loadGenres() {
  const data = await fetchJSON(withKey(`${API}/genre/movie/list`, { language: "en-US" })); // genres [web:22]
  data.genres.forEach(g => genresMap.set(g.id, g.name));
  // chips
  const all = document.createElement("button");
  all.className = "chip active";
  all.textContent = "All";
  all.dataset.id = "0";
  genreChips.append(all);
  data.genres.forEach(g => {
    const btn = document.createElement("button");
    btn.className = "chip";
    btn.textContent = g.name;
    btn.dataset.id = String(g.id);
    genreChips.append(btn);
  });
  genreChips.addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    [...genreChips.children].forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    currentGenre = Number(b.dataset.id);
    reload();
  });
}

async function discover(pageNum=1) {
  const params = {
    language: "en-US",
    sort_by: currentSort,
    page: pageNum,
    with_genres: currentGenre || undefined,
    include_adult: false
  };
  return fetchJSON(withKey(`${API}/discover/movie`, params)); // discover endpoint [web:22]
}

async function searchMovies(query, pageNum=1) {
  const params = {
    language: "en-US",
    page: pageNum,
    query,
    include_adult: false
  };
  return fetchJSON(withKey(`${API}/search/movie`, params)); // search endpoint [web:31]
}

async function loadMore() {
  if (loading || done) return;
  loading = true;
  const key = `${currentQuery}|${currentGenre}|${currentSort}|${page}`;
  try {
    const data = currentQuery
      ? await searchMovies(currentQuery, page)
      : await discover(page);
    const items = data.results || [];
    // Filter if favorites-only toggle
    const filtered = favOnly.checked ? items.filter(m => favSet.has(m.id)) : items;
    renderMovies(filtered, page > 1);
    if (!items.length || page >= (data.total_pages || 1)) done = true;
    page++;
    // Build suggestions from first page
    if (currentQuery && page === 2) renderSuggestions(items.filter(m => matches(currentQuery, m.title)));
  } catch (e) {
    console.error(e);
  } finally {
    loading = false;
  }
}

function reload() {
  page = 1; done = false;
  skeleton(12); // UX skeletons while fetching [web:26]
  loadMore();
}

// ====== Modal ======
function openModal(m) {
  modalPoster.src = imgUrl(m.poster_path);
  modalTitle.textContent = m.title || "Untitled";
  const y = (m.release_date || "").slice(0,4);
  modalMeta.textContent = `${y || "—"} • ${m.vote_average?.toFixed(1) || "–"} ⭐`;
  modalOverview.textContent = m.overview || "No overview available.";
  // stars
  modalStars.innerHTML = [1,2,3,4,5].map(k => `<span class="star ${((ratings[m.id]||0) >= k) ? "filled" : ""}" data-k="${k}">★</span>`).join("");
  modalStars.onclick = (e) => {
    const sp = e.target.closest(".star"); if (!sp) return;
    const k = Number(sp.dataset.k); ratings[m.id] = k; saveRatings();
    [...modalStars.querySelectorAll(".star")].forEach(s => s.classList.toggle("filled", Number(s.dataset.k) <= k));
    // Update any grid stars for same movie
    grid.querySelectorAll(`.stars[data-id="${m.id}"] .star`).forEach(s => s.classList.toggle("filled", Number(s.dataset.k) <= k));
  };
  // favorites
  modalFav.textContent = favSet.has(m.id) ? "Remove favorite" : "Add to favorites";
  modalFav.onclick = () => {
    if (favSet.has(m.id)) favSet.delete(m.id); else favSet.add(m.id);
    saveFavs();
    modalFav.textContent = favSet.has(m.id) ? "Remove favorite" : "Add to favorites";
    // update grid heart
    const cardFav = [...grid.querySelectorAll(".card")].find(c => c.querySelector(".more")).querySelector?.(".fav");
    grid.querySelectorAll(".card").forEach(c => {
      const title = c.querySelector(".title")?.textContent || "";
      if (title === (m.title || "")) {
        const heart = c.querySelector(".fav");
        if (heart) heart.textContent = favSet.has(m.id) ? "♥" : "♡";
        if (favOnly.checked && !favSet.has(m.id)) c.remove();
      }
    });
  };
  modal.showModal();
}
closeModal.addEventListener("click", () => modal.close());

// ====== Events ======
searchInput.addEventListener("input", (e) => {
  const val = e.target.value.trim();
  currentQuery = val;
  if (!val) { suggestions.classList.remove("open"); }
  // Lightweight local suggestions from current DOM list
  const candidates = [...grid.querySelectorAll(".card .title")].map(n => ({ title: n.textContent, poster_path: "", id: 0 }));
  const matchesList = candidates.filter(c => matches(val, c.title));
  renderSuggestions(matchesList);
  // Debounced reload
  clearTimeout(searchInput._t);
  searchInput._t = setTimeout(reload, 300);
});

sortSelect.addEventListener("change", () => { currentSort = sortSelect.value; reload(); });
favOnly.addEventListener("change", () => reload());

// Theme toggle (light/dark flip by swapping CSS variables quickly)
let dark = true;
themeBtn.addEventListener("click", () => {
  dark = !dark;
  document.documentElement.style.setProperty("--bg", dark ? "#0f1216" : "#f6f8fb");
  document.documentElement.style.setProperty("--card", dark ? "#171b21" : "#ffffff");
  document.documentElement.style.setProperty("--text", dark ? "#e8ebf0" : "#141823");
  document.documentElement.style.setProperty("--muted", dark ? "#93a0b4" : "#516079");
  document.documentElement.style.setProperty("--chip", dark ? "#1f2430" : "#e9eef6");
  document.documentElement.style.setProperty("--chip-active", dark ? "#2a3343" : "#dce6f7");
});

// Infinite scroll via IntersectionObserver [UX pattern]
const io = new IntersectionObserver((entries) => {
  if (entries.some(e => e.isIntersecting)) loadMore();
});
io.observe(sentinel);

// ====== Init ======
(async function init() {
  skeleton(12); // Show placeholders [web:26]
  await loadGenres(); // Genres map and chips [web:22]
  reload(); // initial discover feed [web:22]
})();
