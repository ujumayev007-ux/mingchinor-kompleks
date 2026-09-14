// ============================================================
// MINGCHINOR KOMPLEKS - Customer JS (mijoz.js)
// ============================================================

let currentLang = localStorage.getItem('mc_lang') || null;
let selectedTable = null;
let currentTableIdx = 0;
let guestCount = 1;
let cart = {};
let deferredPrompt = null;
let _initDone = false;

// ---- INIT ----
function initApp() {
  if (_initDone) return;
  _initDone = true;

  setupPWA();
  listenRealtime();
  loadTablesFromStorage();

  if (currentLang) {
    hideLangModal();
    showTableModal();
  } else {
    document.getElementById('langModal').classList.add('active');
  }
}

window.addEventListener('DOMContentLoaded', initApp);
window.addEventListener('mc:db_ready', initApp);
// Zaxira sifatida load ham qo'shamiz
window.addEventListener('load', () => {
  setTimeout(initApp, 100);
});

function loadTablesFromStorage() {
  const savedTables = localStorage.getItem('mc_tables');
  try {
    const parsed = JSON.parse(savedTables);
    if (Array.isArray(parsed) && parsed.length > 0) {
      if (typeof DB !== 'undefined') DB.tables = parsed;
    }
  } catch(e) {}

  if (typeof DB !== 'undefined' && (!DB.tables || !DB.tables.length)) {
    DB.tables = [
      {id:1,name:'Stol 1',status:'free',categoryId:null},
      {id:2,name:'Stol 2',status:'free',categoryId:null},
      {id:3,name:'Stol 3',status:'free',categoryId:null},
      {id:4,name:'Stol 4',status:'free',categoryId:null},
      {id:5,name:'Stol 5',status:'free',categoryId:null},
      {id:6,name:'Stol 6',status:'free',categoryId:null},
    ];
  }
}

function hideLangModal() {
  const modal = document.getElementById('langModal');
  if(modal) modal.classList.remove('active');
}

function showTableModal() {
  loadTablesFromStorage();
  currentTableIdx = 0;
  applyTranslations();
  updateTableDisplay();
  const tableModal = document.getElementById('tableModal');
  if(tableModal) tableModal.classList.add('active');
}

function selectLang(lang) {
  currentLang = lang;
  localStorage.setItem('mc_lang', lang);
  hideLangModal();
  showTableModal();
}

function loadTableModal() {
  hideLangModal();
  showTableModal();
}

function applyTranslations() {
  if(!currentLang) return;
  
  const setTxt = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  
  setTxt('selectLangText', t('selectLang', currentLang));
  setTxt('brandSubtitle1', t('kompleks', currentLang));
  setTxt('brandSubtitle2', t('kompleks', currentLang));
  setTxt('tableLabelText', t('tableLabel', currentLang));
  setTxt('guestCountText', t('guestCount', currentLang));
  setTxt('openMenuText', t('openMenu', currentLang));
  setTxt('callWaiterText', t('callWaiter', currentLang));
  setTxt('allCatText', t('all', currentLang));
  setTxt('cartTitle', t('cart', currentLang));
  setTxt('totalText', t('total', currentLang));
  setTxt('serviceFeeLabel', t('serviceFee', currentLang) + ':');
  setTxt('cartGuestLabel', t('guestCount', currentLang));
  setTxt('emptyCartText', t('emptyCart', currentLang));
  setTxt('orderBtnText', t('order', currentLang));
  setTxt('selectLangText2', t('selectLang', currentLang));
  setTxt('tableChangeTitleText', t('tableChange', currentLang));
  
  const guestInput = document.getElementById('guestInput');
  if(guestInput) guestInput.placeholder = t('guestPlaceholder', currentLang);
  
  const noteEl = document.getElementById('orderNote');
  if(noteEl) noteEl.placeholder = t('notePlaceholder', currentLang);
  
  setTxt('installAppText', t('installApp', currentLang));
  setTxt('installDescText', t('installDesc', currentLang));
  setTxt('installBtn', t('install', currentLang));
  
  const laterBtn = document.querySelector('.btn-later');
  if(laterBtn) laterBtn.textContent = t('later', currentLang);
  
  updateCurrentLangFlag();
  updateHeaderTable();
}

function updateCurrentLangFlag() {
  const el = document.getElementById('currentLangFlag');
  const FLAGS = { uz:'🇺🇿', ru:'🇷🇺', en:'🇬🇧' };
  if(el) el.textContent = FLAGS[currentLang] || '🌐';
}

// ---- TABLE COUNTER (ENTRY MODAL) ----
function changeTable(delta) {
  loadTablesFromStorage();
  const tables = (typeof DB !== 'undefined' && DB.tables) ? DB.tables : [];
  if(!tables.length) return;
  
  currentTableIdx += delta;
  if(currentTableIdx < 0) currentTableIdx = tables.length - 1;
  if(currentTableIdx >= tables.length) currentTableIdx = 0;
  updateTableDisplay();
}

function updateTableDisplay() {
  loadTablesFromStorage();
  const tables = (typeof DB !== 'undefined' && DB.tables) ? DB.tables : [];
  const table = tables[currentTableIdx];
  const nameEl = document.getElementById('tableNameDisplay');
  const statusEl = document.getElementById('tableStatusDisplay');
  const openBtn = document.getElementById('openMenuBtn');

  if(!table) {
    if(nameEl) nameEl.textContent = '---';
    if(statusEl) statusEl.textContent = '';
    if(openBtn) openBtn.disabled = true;
    return;
  }

  selectedTable = table;
  if(nameEl) nameEl.textContent = table.name;
  
  if(statusEl) {
    const isBusy = table.status === 'busy';
    statusEl.textContent = isBusy ? t('tableOccupied', currentLang) : t('tableFree', currentLang);
    statusEl.className = isBusy ? 'status-busy' : 'status-free';
    if(openBtn) openBtn.disabled = isBusy;
  }
  
  updateHeaderTable();
}

// ---- TABLE GRID (CHANGE MODAL) ----
function renderTableGrid(containerId) {
  const container = document.getElementById(containerId);
  if(!container) return;
  
  loadTablesFromStorage();
  const tables = (typeof DB !== 'undefined' && DB.tables) ? DB.tables : [];

  container.innerHTML = '';
  tables.forEach(table => {
    const div = document.createElement('div');
    const isBusy = table.status === 'busy';
    const isSelected = selectedTable?.id == table.id;
    div.className = `table-item ${isBusy ? 'busy' : 'free'} ${isSelected ? 'selected' : ''}`;
    div.innerHTML = `
      <span class="t-icon">${isBusy ? '🔴' : '🟢'}</span>
      <span class="t-name">${table.name}</span>
      <span class="t-status">${isBusy ? t('tableOccupied', currentLang) : t('tableFree', currentLang)}</span>
    `;
    if(!isBusy) {
      div.onclick = () => selectTable(table, containerId);
    }
    container.appendChild(div);
  });
}

function selectTable(table, containerId) {
  selectedTable = table;
  renderTableGrid(containerId);
  const btn = document.getElementById('openMenuBtn');
  if(btn) btn.disabled = false;
  updateHeaderTable();
  if(containerId === 'tableChangeGrid') {
    closeTableChange();
    showToast(`${table.name} ${t('yourTable', currentLang)}`);
  }
}

function changeGuests(delta) {
  setGuestCount(guestCount + delta);
}

function changeGuestsFromCart(delta) {
  setGuestCount(guestCount + delta);
}

function setGuestCount(value) {
  guestCount = Math.max(1, Math.min(20, parseInt(value) || 1));
  syncGuestInputs();
  updateCartFAB();
  const cartModal = document.getElementById('cartModal');
  if(cartModal?.classList.contains('active') && getCartCount() > 0) {
    renderCartItems();
  }
}

function syncGuestInputs() {
  const guestInput = document.getElementById('guestInput');
  if(guestInput) guestInput.value = guestCount;
  const cartGuestInput = document.getElementById('cartGuestInput');
  if(cartGuestInput) cartGuestInput.value = guestCount;
}

document.addEventListener('change', e => {
  if(e.target.id === 'guestInput' || e.target.id === 'cartGuestInput') {
    setGuestCount(e.target.value);
  }
});

document.addEventListener('input', e => {
  if(e.target.id === 'guestInput' || e.target.id === 'cartGuestInput') {
    setGuestCount(e.target.value);
  }
});

function updateHeaderTable() {
  const el = document.getElementById('headerTableBadge');
  if(el && selectedTable) {
    const tablePrefix = t('table', currentLang);
    el.textContent = selectedTable.name.replace('Stol ', 'T').replace(tablePrefix + ' ', 'T');
  }
}

// ---- OPEN MENU ----
function openMenu() {
  if(!selectedTable) return;
  const gInput = document.getElementById('guestInput');
  if(gInput) setGuestCount(gInput.value);
  
  const tableModal = document.getElementById('tableModal');
  if(tableModal) tableModal.classList.remove('active');
  
  const menuPage = document.getElementById('menuPage');
  if(menuPage) menuPage.classList.remove('hidden');
  
  applyTranslations();
  loadCategories();
  loadMenuItems();
}

// ---- CATEGORIES ----
function loadCategories() {
  const cats = JSON.parse(localStorage.getItem('mc_categories') || '[]');
  const bar = document.getElementById('categoriesBar');
  if(!bar) return;
  
  bar.innerHTML = `<button class="cat-btn active" data-cat="all" onclick="filterCategory('all')">${t('all', currentLang)}</button>`;
  
  const sortedCats = cats.sort((a,b) => (a.order || 0) - (b.order || 0));
  sortedCats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'cat-btn';
    btn.dataset.cat = cat.id;
    btn.textContent = cat['name_' + currentLang] || cat.name;
    btn.onclick = () => filterCategory(cat.id);
    bar.appendChild(btn);
  });
}

function filterCategory(catId) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-cat="${catId}"]`)?.classList.add('active');
  renderMenuItems(catId);
}

// ---- MENU ITEMS ----
function loadMenuItems() {
  renderMenuItems('all');
}

function renderMenuItems(catFilter) {
  const content = document.getElementById('menuContent');
  if(!content) return;
  
  document.getElementById('loadingState')?.remove();
  
  let menuItems = JSON.parse(localStorage.getItem('mc_menu') || '[]');
  let items = menuItems.filter(m => !m.deleted);
  if(catFilter !== 'all') items = items.filter(m => m.categoryId == catFilter);
  
  items.sort((a,b) => (a.order || 0) - (b.order || 0));

  if(!items.length) {
    content.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--text-muted)">
      <div style="font-size:40px">🍽️</div>
      <p style="margin-top:12px;font-size:14px">${t('noItems', currentLang)}</p>
    </div>`;
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'menu-grid';
  items.forEach(item => {
    const qty = (cart[item.id] || 0);
    const card = document.createElement('div');
    card.className = `menu-card ${item.unavailable ? 'unavailable' : ''}`;
    card.id = `card-${item.id}`;
    const itemName = item['name_' + currentLang] || item.name;
    const imgSrc = item.image || '';
    const safeName = itemName.replace(/'/g, "\\'");
    const imgHtml = imgSrc
      ? `<img class="menu-card-img" src="${imgSrc}" alt="${itemName}" loading="lazy" onclick="openImgModal('${imgSrc}','${safeName}',${item.sellPrice})">`
      : `<div class="menu-card-img-placeholder" onclick="openImgModal('','${safeName}',${item.sellPrice})">🍽️</div>`;
    
    card.innerHTML = `
      ${imgHtml}
      <div class="menu-card-body">
        <div class="menu-card-name">${itemName}</div>
        <div class="menu-card-price">${formatPrice(item.sellPrice)} ${t('sum', currentLang)}</div>
        <div class="menu-card-controls">
          ${qty > 0 ? `
            <div class="qty-ctrl">
              <button class="qty-btn" onclick="updateCart('${item.id}',-1)">−</button>
              <span class="qty-num">${qty}</span>
              <button class="qty-btn" onclick="updateCart('${item.id}',1)">+</button>
            </div>
          ` : `<button class="add-btn" onclick="updateCart('${item.id}',1)">${t('addToCart', currentLang)}</button>`}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
  content.innerHTML = '';
  content.appendChild(grid);
}

// ---- CART ----
function updateCart(itemId, delta) {
  cart[itemId] = Math.max(0, (cart[itemId] || 0) + delta);
  if(cart[itemId] === 0) delete cart[itemId];
  updateCartFAB();
  refreshCard(itemId);
}

function refreshCard(itemId) {
  const menuItems = JSON.parse(localStorage.getItem('mc_menu') || '[]');
  const item = menuItems.find(m => m.id == itemId);
  if(!item) return;
  const card = document.getElementById(`card-${itemId}`);
  if(!card) return;
  const qty = cart[itemId] || 0;
  const controls = card.querySelector('.menu-card-controls');
  if(!controls) return;
  controls.innerHTML = qty > 0 ? `
    <div class="qty-ctrl">
      <button class="qty-btn" onclick="updateCart('${itemId}',-1)">−</button>
      <span class="qty-num">${qty}</span>
      <button class="qty-btn" onclick="updateCart('${itemId}',1)">+</button>
    </div>
  ` : `<button class="add-btn" onclick="updateCart('${itemId}',1)">${t('addToCart', currentLang)}</button>`;
}

function updateCartFAB() {
  const total = getCartTotal();
  const count = getCartCount();
  const fab = document.getElementById('cartFab');
  if(!fab) return;
  
  if(count > 0) {
    fab.style.display = 'flex';
    const cEl = document.getElementById('cartCount');
    const tEl = document.getElementById('cartTotal');
    if(cEl) cEl.textContent = count;
    if(tEl) tEl.textContent = formatPrice(total + getServiceFee()) + ' ' + t('sum', currentLang);
  } else {
    fab.style.display = 'none';
  }
}

function getCartTotal() {
  const menuItems = JSON.parse(localStorage.getItem('mc_menu') || '[]');
  return Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = menuItems.find(m => m.id == id);
    return sum + (item ? item.sellPrice * qty : 0);
  }, 0);
}

function getServiceFee() {
  const feePerGuest = parseInt(localStorage.getItem('mc_service_fee')) || 0;
  return guestCount * feePerGuest;
}

function getCartCount() {
  return Object.values(cart).reduce((a, b) => a + b, 0);
}

function openCart() {
  const modal = document.getElementById('cartModal');
  if(modal) modal.classList.add('active');
  syncGuestInputs();
  renderCartItems();
}

function closeCart() {
  const modal = document.getElementById('cartModal');
  if(modal) modal.classList.remove('active');
}

function renderCartItems() {
  const menuItems = JSON.parse(localStorage.getItem('mc_menu') || '[]');
  const container = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');
  const emptyEl = document.getElementById('emptyCart');
  const count = getCartCount();
  syncGuestInputs();

  if(!container) return;

  if(count === 0) {
    container.innerHTML = '';
    if(footer) footer.style.display = 'none';
    if(emptyEl) emptyEl.style.display = 'flex';
    return;
  }
  if(emptyEl) emptyEl.style.display = 'none';
  if(footer) footer.style.display = 'block';

  container.innerHTML = '';
  Object.entries(cart).forEach(([id, qty]) => {
    const item = menuItems.find(m => m.id == id);
    if(!item || qty === 0) return;
    const itemName = item['name_' + currentLang] || item.name;
    const div = document.createElement('div');
    div.className = 'cart-item';
    const imgEl = item.image
      ? `<img class="cart-item-img" src="${item.image}" alt="${itemName}">`
      : `<div class="cart-item-img" style="display:flex;align-items:center;justify-content:center;font-size:22px">🍽️</div>`;
    div.innerHTML = `
      ${imgEl}
      <div class="cart-item-info">
        <div class="cart-item-name">${itemName}</div>
        <div class="cart-item-price">${formatPrice(item.sellPrice * qty)} ${t('sum', currentLang)}</div>
      </div>
      <div class="cart-item-qty">
        <button class="cq-btn" onclick="updateCartModal('${id}',-1)">−</button>
        <span class="cq-num">${qty}</span>
        <button class="cq-btn" onclick="updateCartModal('${id}',1)">+</button>
      </div>
    `;
    container.appendChild(div);
  });

  const total = getCartTotal();
  const fee = getServiceFee();
  const grandTotal = total + fee;

  const feeRow = document.getElementById('serviceFeeRow');
  if(feeRow) {
    if(fee > 0) {
      feeRow.style.display = 'flex';
      const feeAmt = document.getElementById('cartServiceFeeAmount');
      if(feeAmt) feeAmt.textContent = formatPrice(fee) + ' ' + t('sum', currentLang);
    } else {
      feeRow.style.display = 'none';
    }
  }

  const totalAmt = document.getElementById('cartTotalAmount');
  if(totalAmt) totalAmt.textContent = formatPrice(grandTotal) + ' ' + t('sum', currentLang);
}

function updateCartModal(itemId, delta) {
  updateCart(itemId, delta);
  renderCartItems();
}

// ---- PLACE ORDER ----
function placeOrder() {
  if(getCartCount() === 0) return;
  const menuItems = JSON.parse(localStorage.getItem('mc_menu') || '[]');
  const noteEl = document.getElementById('orderNote');
  const note = noteEl ? noteEl.value : '';
  
  const items = Object.entries(cart).map(([id, qty]) => {
    const item = menuItems.find(m => m.id == id);
    return { menuItemId: isNaN(id) ? id : parseInt(id), name: item?.name, qty, price: item?.sellPrice, categoryId: item?.categoryId };
  }).filter(x => x.qty > 0);

  const feePerGuest = parseInt(localStorage.getItem('mc_service_fee')) || 0;
  if(feePerGuest > 0) {
    items.push({
      menuItemId: 'service_fee',
      name: t('serviceFee', currentLang),
      qty: guestCount,
      price: feePerGuest,
      categoryId: 'service'
    });
  }

  const order = (typeof DB !== 'undefined' && DB.addOrder) ? DB.addOrder({
    tableId: selectedTable.id,
    tableName: selectedTable.name,
    guestCount,
    items,
    note,
    lang: currentLang,
    totalPrice: getCartTotal() + getServiceFee()
  }) : null;

  if(typeof DB !== 'undefined' && DB.broadcast && order) {
    DB.broadcast('new_order', order);
  }

  cart = {};
  updateCartFAB();
  closeCart();
  showToast(t('orderSent', currentLang));

  setTimeout(() => {
    resetToTableModal();
  }, 1500);
}

// ---- RESET ----
function resetToTableModal() {
  const menuPage = document.getElementById('menuPage');
  if(menuPage) menuPage.classList.add('hidden');
  
  hideLangModal();
  const tableModal = document.getElementById('tableModal');
  if(tableModal) tableModal.classList.remove('active');
  
  selectedTable = null;
  setGuestCount(1);
  
  const openBtn = document.getElementById('openMenuBtn');
  if(openBtn) openBtn.disabled = true;
  
  cart = {};
  updateCartFAB();
  showTableModal();
}

// ---- WAITER CALL ----
function callWaiter() {
  if(!selectedTable) return;
  const calls = (typeof DB !== 'undefined' && DB.waiterCalls) ? DB.waiterCalls : [];
  const call = {
    id: (typeof DB !== 'undefined' && DB.nextId) ? DB.nextId(calls) : Date.now(),
    tableId: selectedTable.id,
    tableName: selectedTable.name,
    ts: new Date().toISOString(),
    status: 'pending'
  };
  
  if(typeof DB !== 'undefined') {
    if(!DB.waiterCalls) DB.waiterCalls = [];
    DB.waiterCalls.push(call);
    if(DB.save) DB.save('waiterCalls');
    if(DB.broadcast) DB.broadcast('waiter_call', call);
  }
  
  const btn = document.getElementById('callWaiterBtn');
  if(btn) {
    btn.classList.add('calling');
    setTimeout(() => btn.classList.remove('calling'), 3000);
  }
  showToast(t('waiterCalled', currentLang));
}

// ---- LANG CHANGE ----
function showLangChange() {
  const modal = document.getElementById('langChangeModal');
  if(modal) modal.classList.add('active');
}
function closeLangChange() {
  const modal = document.getElementById('langChangeModal');
  if(modal) modal.classList.remove('active');
}
function changeLang(lang) {
  currentLang = lang;
  localStorage.setItem('mc_lang', lang);
  closeLangChange();
  applyTranslations();
  loadCategories();
  loadMenuItems();
}

// ---- TABLE CHANGE ----
function showTableChange() {
  renderTableGrid('tableChangeGrid');
  const modal = document.getElementById('tableChangeModal');
  if(modal) modal.classList.add('active');
}
function closeTableChange() {
  const modal = document.getElementById('tableChangeModal');
  if(modal) modal.classList.remove('active');
}

// ---- IMAGE MODAL ----
function openImgModal(src, name, price) {
  const modal = document.getElementById('imgModal');
  const imgEl = document.getElementById('imgModalSrc');
  const nameEl = document.getElementById('imgModalName');
  const priceEl = document.getElementById('imgModalPrice');
  
  if(imgEl) imgEl.src = src || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23251407"/><text x="100" y="110" font-size="60" text-anchor="middle">🍽️</text></svg>';
  if(nameEl) nameEl.textContent = name;
  if(priceEl) priceEl.textContent = formatPrice(price) + ' ' + t('sum', currentLang);
  if(modal) modal.classList.add('active');
}
function closeImgModal() {
  const modal = document.getElementById('imgModal');
  if(modal) modal.classList.remove('active');
}

// ---- TOAST ----
function showToast(msg) {
  const el = document.getElementById('toast');
  if(!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

// ---- FORMAT ----
function formatPrice(n) {
  return (n || 0).toLocaleString('uz-UZ');
}

// ---- PWA ----
function setupPWA() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    
    const headerInstallBtn = document.getElementById('headerInstallBtn');
    if(headerInstallBtn) headerInstallBtn.style.display = 'flex';

    const banner = document.getElementById('installBanner');
    if(banner && !localStorage.getItem('mc_pwa_dismissed')) {
      banner.style.display = 'flex';
    }
  });
}
function installPWA() {
  if(deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => { 
      deferredPrompt = null; 
      const headerInstallBtn = document.getElementById('headerInstallBtn');
      if(headerInstallBtn) headerInstallBtn.style.display = 'none';
    });
  }
  const banner = document.getElementById('installBanner');
  if(banner) banner.style.display = 'none';
}
function dismissInstall() {
  localStorage.setItem('mc_pwa_dismissed','1');
  const banner = document.getElementById('installBanner');
  if(banner) banner.style.display = 'none';
}

// ---- REALTIME ----
function listenRealtime() {
  window.addEventListener('mc:data_changed', e => {
    const { key, items } = e.detail;
    if(key === 'tables') {
      if(typeof DB !== 'undefined') DB.tables = items;
      _refreshTableUI();
    }
    if(key === 'menuItems') {
      if(typeof DB !== 'undefined') DB.menuItems = items;
      const menuPage = document.getElementById('menuPage');
      if(menuPage && !menuPage.classList.contains('hidden')) {
        loadCategories();
        loadMenuItems();
      }
    }
  });
  window.addEventListener('storage', e => {
    if(e.key === 'mc_tables') {
      try {
        const parsed = JSON.parse(e.newValue || '[]');
        if(typeof DB !== 'undefined') DB.tables = parsed;
      } catch(err) {}
      _refreshTableUI();
    }
    if(e.key === 'mc_menu') {
      const menuPage = document.getElementById('menuPage');
      if(menuPage && !menuPage.classList.contains('hidden')) {
        loadCategories();
        loadMenuItems();
      }
    }
  });
}

function _refreshTableUI() {
  const tableModal = document.getElementById('tableModal');
  if(tableModal && tableModal.classList.contains('active')) {
    updateTableDisplay();
    const tg = document.getElementById('tableGrid');
    if(tg && tg.children.length > 0) renderTableGrid('tableGrid');
  }
  const tcModal = document.getElementById('tableChangeModal');
  if(tcModal && tcModal.classList.contains('active')) {
    renderTableGrid('tableChangeGrid');
  }
  updateHeaderTable();
}
