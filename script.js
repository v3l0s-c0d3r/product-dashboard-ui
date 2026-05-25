const sideMenu    = document.querySelector('aside');
const menuBtn     = document.querySelector('#menu_bar');
const closeBtn    = document.querySelector('#close_btn');
const themeToggler = document.querySelector('.theme-toggler');
const searchInput  = document.querySelector('#searchInput');
const clearSearch  = document.querySelector('#clearSearch');
const productGrid  = document.querySelector('#productGrid');
const resultsCount = document.querySelector('#resultsCount');
const sortSelect   = document.querySelector('#sortSelect');
const filterBtns   = document.querySelectorAll('.filter-btn');

let allProducts    = [];
let activeCategory = 'all';
let searchQuery    = '';
let sortMode       = 'default';

const CATEGORY_EMOJI = {
  'electronics':       '💻',
  'jewelery':          '💎',
  "men's clothing":    '👔',
  "women's clothing":  '👗',
};


menuBtn.addEventListener('click', () => {
  sideMenu.style.display = 'block';
});

closeBtn.addEventListener('click', () => {
  sideMenu.style.display = 'none';
});

themeToggler.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme-variables');
  themeToggler.querySelector('span:nth-child(1)').classList.toggle('active');
  themeToggler.querySelector('span:nth-child(2)').classList.toggle('active');
});


async function fetchProducts() {
  showSkeletons(8);
  try {
    const res = await fetch('https://fakestoreapi.com/products');
    if (!res.ok) throw new Error(`Server responded with status ${res.status}`);
    allProducts = await res.json();
    updateStats();
    renderProducts();
  } catch (err) {
    showError(err.message || 'Network error — please check your connection.');
  }
}

function updateStats() {
  document.getElementById('stat-total').textContent    = allProducts.length;
  document.getElementById('stat-total-pct').textContent = '100%';

  const avgPrice = allProducts.reduce((s, p) => s + p.price, 0) / allProducts.length;
  document.getElementById('stat-avg').textContent      = '$' + avgPrice.toFixed(2);
  document.getElementById('stat-avg-pct').textContent  = Math.round((avgPrice / 200) * 100) + '%';

  const avgRating = allProducts.reduce((s, p) => s + p.rating.rate, 0) / allProducts.length;
  document.getElementById('stat-rating').textContent     = avgRating.toFixed(1);
  document.getElementById('stat-rating-pct').textContent = Math.round((avgRating / 5) * 100) + '%';
}


function renderProducts() {
  let list = [...allProducts];

  /* 1. Category filter */
  if (activeCategory !== 'all') {
    list = list.filter(p => p.category === activeCategory);
  }

  /* 2. Search filter */
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }

  /* 3. Sort */
  if (sortMode === 'price-asc')   list.sort((a, b) => a.price - b.price);
  if (sortMode === 'price-desc')  list.sort((a, b) => b.price - a.price);
  if (sortMode === 'rating-desc') list.sort((a, b) => b.rating.rate - a.rating.rate);
  if (sortMode === 'name-asc')    list.sort((a, b) => a.title.localeCompare(b.title));

  /* 4. Update count */
  resultsCount.textContent =
    list.length === 0 ? 'No products found'
    : `Showing ${list.length} product${list.length !== 1 ? 's' : ''}`;

  /* 5. Empty state */
  if (list.length === 0) {
    productGrid.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-sharp">search_off</span>
        <h3>No products found</h3>
        <p>Try adjusting your search or clearing the category filter.</p>
      </div>`;
    return;
  }

  /* 6. Render cards */
  productGrid.innerHTML = list.map((product, i) => {
    const badgeClass  = categoryBadgeClass(product.category);
    const badgeLabel  = categoryLabel(product.category);
    const starHTML    = buildStars(product.rating.rate);
    const title       = product.title.length > 50 ? product.title.slice(0, 50) + '…' : product.title;
    const delay       = Math.min(i * 40, 400);

    return `
      <div class="product-card" style="animation-delay:${delay}ms">
        <div class="card-thumb">
          <img src="${product.image}"
               alt="${escapeHtml(product.title)}"
               loading="lazy"
               onerror="this.src='https://via.placeholder.com/120x120?text=No+Image'" />
          <span class="card-badge ${badgeClass}">${badgeLabel}</span>
        </div>
        <div class="card-body">
          <h3 class="card-title">${escapeHtml(title)}</h3>
          <p class="card-desc">${escapeHtml(product.description)}</p>
          <div class="card-meta">
            <span class="card-price">$${product.price.toFixed(2)}</span>
            <div class="card-rating">
              <span class="stars">${starHTML}</span>
              <span>${product.rating.rate} (${product.rating.count})</span>
            </div>
          </div>
        </div>
        <div class="card-actions">
          <button class="btn-add">Add to Cart</button>
          <button class="btn-wish" aria-label="Add to wishlist">
            <span class="material-symbols-sharp">favorite_border</span>
          </button>
        </div>
      </div>`;
  }).join('');
}


function showSkeletons(count) {
  resultsCount.textContent = 'Loading products…';
  productGrid.innerHTML = Array.from({ length: count }, () => `
    <div class="skeleton-card">
      <div class="sk-thumb sk-pulse"></div>
      <div class="sk-body">
        <div class="sk-line sk-pulse" style="width:55%"></div>
        <div class="sk-line sk-pulse" style="width:85%"></div>
        <div class="sk-line sk-pulse" style="width:70%"></div>
        <div style="height:6px"></div>
        <div class="sk-line sk-pulse" style="width:40%"></div>
      </div>
    </div>
  `).join('');
}


function showError(message) {
  resultsCount.textContent = 'Failed to load products.';
  productGrid.innerHTML = `
    <div class="error-state">
      <span class="material-symbols-sharp">error_outline</span>
      <h3>Something went wrong</h3>
      <p>${escapeHtml(message)}</p>
      <button class="retry-btn" onclick="fetchProducts()">
        <span class="material-symbols-sharp" style="font-size:.9rem;vertical-align:-2px">refresh</span>
        Try again
      </button>
    </div>`;
}


function categoryBadgeClass(cat) {
  if (cat === 'electronics')    return 'electronics';
  if (cat === 'jewelery')       return 'jewelery';
  if (cat.includes('men'))      return 'men';
  if (cat.includes('women'))    return 'women';
  return '';
}

function categoryLabel(cat) {
  if (cat === "men's clothing")   return "Men's";
  if (cat === "women's clothing") return "Women's";
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

function buildStars(rate) {
  const full  = Math.round(rate);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

searchInput.addEventListener('input', e => {
  searchQuery = e.target.value.trim();
  clearSearch.style.display = searchQuery ? 'flex' : 'none';
  renderProducts();
});

clearSearch.addEventListener('click', () => {
  searchInput.value  = '';
  searchQuery        = '';
  clearSearch.style.display = 'none';
  searchInput.focus();
  renderProducts();
});


filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeCategory = btn.dataset.cat;
    renderProducts();
  });
});


sortSelect.addEventListener('change', e => {
  sortMode = e.target.value;
  renderProducts();
});


fetchProducts();



