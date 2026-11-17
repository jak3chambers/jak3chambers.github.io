(function(){
  var COIN_STORAGE_KEY = '28bugs_gameCoins';
  var PURCHASE_KEY = '28bugs_bugPurchases';
  var modal = document.getElementById('bug-shop-modal');
  var itemsContainer = document.getElementById('bug-shop-items');
  var openBtn = document.getElementById('bug-shop-btn');
  var closeBtn = document.getElementById('bug-shop-close');
  var items = [];
  for(var i=2;i<=43;i++){
    if(i===39) continue;
    var displayNum = i <= 2 ? i - 1 : (i <= 39 ? i - 1 : i - 2);
    items.push({ key: 'breadlight'+i, name: 'Breadlight Bugoid '+displayNum, price: 100, image: 'src/elliebugs/elliebug'+i+'.png', description: 'I got a huge shipment of this spetuments and I really need someone to take them all off my hands. They dont have a background so please dont be mean but they had love put into them.' });
  }
  function getCoins(){
    if (typeof GameCoins !== 'undefined' && GameCoins.getCoins) return GameCoins.getCoins();
    var s = localStorage.getItem(COIN_STORAGE_KEY);
    return s ? parseInt(s,10) : 0;
  }
  function setCoins(v){
    if (typeof GameCoins !== 'undefined' && GameCoins.setCoins) return GameCoins.setCoins(v);
    localStorage.setItem(COIN_STORAGE_KEY, String(v));
  }
  function spendCoins(amount){
    if (typeof GameCoins !== 'undefined' && GameCoins.spendCoins) return GameCoins.spendCoins(amount);
    var c = getCoins(); if(c < amount) return false; setCoins(c-amount); return true;
  }
  function updateCoinDisplays(){
    var raw = (typeof GameCoins !== 'undefined' && GameCoins.getCoinsBig) ? GameCoins.getCoinsBig() : getCoins();
    var formatted = typeof window.formatCoinAmount === 'function' ? window.formatCoinAmount(raw) : String(raw);
    var a = document.getElementById('coin-count');
    if(a) a.textContent = formatted;
    var b = document.getElementById('music-coin-count');
    if(b) b.textContent = formatted;
    var c = document.getElementById('bug-coin-count');
    if(c) c.textContent = formatted;
  }
  function loadPurchases(){
    try { var r = localStorage.getItem(PURCHASE_KEY); return r ? JSON.parse(r)||{} : {}; } catch(_){ return {}; }
  }
  function savePurchases(p){ localStorage.setItem(PURCHASE_KEY, JSON.stringify(p)); }
  function isPurchased(key){ var p = loadPurchases(); return !!p[key]; }
  function purchase(item){
    if(isPurchased(item.key)) return;
    if(!spendCoins(item.price)) { alert('Not enough coins.'); return; }
    var p = loadPurchases(); p[item.key] = true; savePurchases(p); updateCoinDisplays(); render();
  }
  function render(){
    if(!itemsContainer) return;
    itemsContainer.innerHTML = '';
    items.forEach(function(item){
      var purchased = isPurchased(item.key);
      var box = document.createElement('div');
      box.className = 'shop-item-card';
      box.classList.add('shop-item-row');
      var media = document.createElement('div');
      media.className = 'shop-item-media';
      var img = document.createElement('img');
      img.src = item.image;
      img.alt = item.name;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'contain';
      media.appendChild(img);
      var content = document.createElement('div');
      content.className = 'shop-item-body';
      var title = document.createElement('div');
      title.className = 'shop-item-title';
      title.textContent = item.name + (purchased ? ' (owned)' : '');
      var desc = document.createElement('div');
      desc.className = 'shop-item-desc';
      desc.textContent = item.description || '';
      var price = document.createElement('div');
      price.className = 'shop-item-price';
      price.textContent = 'Price: ' + item.price + ' coins';
      var row = document.createElement('div');
      row.className = 'shop-button-row';
      var buy = document.createElement('button');
      buy.textContent = purchased ? 'Purchased' : 'Buy';
      buy.disabled = purchased;
      buy.className = 'shop-action-btn';
      if(!purchased){ buy.addEventListener('click', function(e){ e.stopPropagation(); purchase(item); }); }
      row.appendChild(buy);
      content.appendChild(title);
      content.appendChild(desc);
      content.appendChild(price);
      content.appendChild(row);
      box.appendChild(media);
      box.appendChild(content);
      itemsContainer.appendChild(box);
    });
  }
  function openModal(){ if(!modal) return; render(); updateCoinDisplays(); modal.style.display = 'block'; }
  function closeModal(){ if(modal) modal.style.display = 'none'; }
  document.addEventListener('DOMContentLoaded', function(){
    updateCoinDisplays();
    render();
    if(openBtn){ openBtn.addEventListener('click', function(e){ e.stopPropagation(); openModal(); }); }
    if(closeBtn){ closeBtn.addEventListener('click', function(e){ e.stopPropagation(); closeModal(); }); }
    window.addEventListener('click', function(e){ if(e.target === modal){ closeModal(); } });
    document.addEventListener('click', function(e){ if(!modal || modal.style.display !== 'block') return; var content = modal.querySelector('.modal-content'); if(content && !content.contains(e.target) && e.target !== openBtn){ closeModal(); } });
  });
})();