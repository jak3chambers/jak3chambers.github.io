
window.MAX_COINS = 10n ** 33n;

var COIN_SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

function toCoinBigInt(amount) {
    if (typeof amount === 'bigint') return amount;
    if (typeof amount === 'number') {
        if (!Number.isFinite(amount)) return 0n;
        return BigInt(Math.trunc(amount));
    }
    var s = String(amount == null ? '0' : amount).trim();
    if (!s) return 0n;
    var neg = s.charAt(0) === '-';
    if (neg) s = s.slice(1);
    if (s.indexOf('.') !== -1) s = s.slice(0, s.indexOf('.'));
    if (s.indexOf('e') !== -1 || s.indexOf('E') !== -1) {
        var asNum = Number(neg ? '-' + s : s);
        if (!Number.isFinite(asNum)) return 0n;
        return BigInt(Math.trunc(asNum));
    }
    if (!/^\d+$/.test(s)) return 0n;
    try {
        var n = BigInt(s);
        return neg ? -n : n;
    } catch (_) {
        return 0n;
    }
}

function clampCoinBigInt(amount) {
    var n = toCoinBigInt(amount);
    if (n < 0n) return 0n;
    if (n > window.MAX_COINS) return window.MAX_COINS;
    return n;
}

window.formatCoinAmount = function(n) {
    var v = toCoinBigInt(n);
    var neg = v < 0n;
    if (neg) v = -v;
    if (v === 0n) return '0';
    var s = v.toString();
    var digits = s.length;
    var tier = Math.floor((digits - 1) / 3);
    if (tier === 0) return (neg ? '-' : '') + v.toLocaleString();
    if (tier >= COIN_SUFFIXES.length) tier = COIN_SUFFIXES.length - 1;
    var intDigits = digits - tier * 3;
    var head = s.slice(0, intDigits);
    var frac = s.slice(intDigits);
    var decimals = head.length < 2 ? 2 : head.length < 3 ? 1 : 0;
    var out = head;
    if (decimals > 0) {
        out = head + '.' + (frac + '00').slice(0, decimals);
    }
    return (neg ? '-' : '') + out + COIN_SUFFIXES[tier];
};

window.capCoins = function(amount) {
    return clampCoinBigInt(amount);
};

const GameCoins = {
    
    getCoinsBig: function() {
        return clampCoinBigInt(localStorage.getItem('28bugs_gameCoins') || '0');
    },

    getCoins: function() {
        return Number(this.getCoinsBig());
    },
    
    addCoins: function(amount) {
        var newTotal = clampCoinBigInt(this.getCoinsBig() + toCoinBigInt(amount));
        localStorage.setItem('28bugs_gameCoins', String(newTotal));
        this.updateCoinDisplay();
        if (typeof AccountSync !== 'undefined' && AccountSync.touchLocalSave) {
            AccountSync.touchLocalSave();
        }
        return this.getCoins();
    },
    
    
    setCoins: function(amount) {
        var cappedAmount = clampCoinBigInt(amount);
        localStorage.setItem('28bugs_gameCoins', String(cappedAmount));
        this.updateCoinDisplay();
        if (typeof AccountSync !== 'undefined' && AccountSync.touchLocalSave) {
            AccountSync.touchLocalSave();
        }
        return this.getCoins();
    },
    
    
    spendCoins: function(amount) {
        var cost = toCoinBigInt(amount);
        if (cost <= 0n) return true;
        var currentCoins = this.getCoinsBig();
        if (currentCoins < cost) return false;
        localStorage.setItem('28bugs_gameCoins', String(currentCoins - cost));
        this.updateCoinDisplay();
        if (typeof AccountSync !== 'undefined' && AccountSync.touchLocalSave) {
            AccountSync.touchLocalSave();
        }
        return true;
    },
    
    
    updateCoinDisplay: function() {
        const coinAmount = window.formatCoinAmount(this.getCoinsBig());
        
        const coinValue = document.getElementById('coin-value');
        if (coinValue) {
            coinValue.textContent = coinAmount || '0';
        }
        
        
        const coinCount = document.getElementById('coin-count');
        if (coinCount) {
            coinCount.textContent = coinAmount || '0';
        }
    },
    
    
    hasEnoughCoins: function(amount) {
        return this.getCoinsBig() >= toCoinBigInt(amount);
    }
};

window.GameCoins = GameCoins;


const shopItems = [
    {
        id: 'extra_bet',
        name: 'Extra Betting Coins',
        description: 'Get 100 extra coins to bet in the Bug Racing game',
        price: 50,
        image: 'src/coins.png',
        action: function() {
            
            GameCoins.addCoins(100);
            showNotification('You received 100 extra coins!');
        }
    },
    {
        id: 'bug_boost',
        name: 'Bug Booster',
        description: 'Your selected bug gets a speed boost in the next race',
        price: 75,
        image: 'src/boost.png',
        action: function() {
            localStorage.setItem('28bugs_speedBoost', 'true');
            showNotification('Speed boost activated for your next race!');
        }
    },
    {
        id: 'lucky_charm',
        name: 'Lucky Charm',
        description: 'Increases your chances of winning in the next race',
        price: 100,
        image: 'src/lucky.png',
        action: function() {
            localStorage.setItem('28bugs_luckyCharm', 'true');
            try {
                var count = parseInt(localStorage.getItem('28bugs_luckyTagCount') || '0', 10);
                if (count === 0) {
                    localStorage.setItem('28bugs_luckyTagCount', '1');
                }
            } catch (e) {}
            showNotification('Lucky charm activated for your next race!');
            try {
                if (typeof AccountSync !== 'undefined' && AccountSync.isLoggedIn && AccountSync.isLoggedIn()) {
                    AccountSync.saveProgress().then(function(result) {
                        if (result && result.success && result.tags && AccountSync.getUser()) {
                            AccountSync.getUser().tags = result.tags;
                        }
                    }).catch(function(){});
                }
            } catch (e) {}
        }
    },
    {
        id: 'vip_access',
        name: 'VIP Race Access',
        description: 'Unlock special high-stakes races with bigger payouts',
        price: 200,
        image: 'src/vip.png',
        action: function() {
            localStorage.setItem('28bugs_vipAccess', 'true');
            showNotification('VIP race access granted!');
        }
    }
];


function showNotification(message, duration = 3000) {
    
    const existingNotification = document.querySelector('.game-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    
    const notification = document.createElement('div');
    notification.className = 'game-notification';
    notification.textContent = message;
    
    
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = '#4CAF50';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    notification.style.zIndex = '9999';
    
    
    document.body.appendChild(notification);
    
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, duration);
}


function initializeShop() {
    const shopItemsContainer = document.getElementById('shop-items');
    if (!shopItemsContainer) return;
    
    
    shopItemsContainer.innerHTML = '';
    
    
    shopItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'shop-item';
        
        
        const imgSrc = item.image || 'src/bug1.png';
        
        itemElement.innerHTML = `
            <img src="${imgSrc}" alt="${item.name}">
            <div class="item-name">${item.name}</div>
            <div class="item-description">${item.description}</div>
            <div class="item-price">
                <img src="src/penny.png" alt="Coin" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;">
                ${item.price}
            </div>
            <button class="buy-button" data-id="${item.id}">Buy</button>
        `;
        
        shopItemsContainer.appendChild(itemElement);
    });
    
    
    document.querySelectorAll('.buy-button').forEach(button => {
        button.addEventListener('click', () => {
            const itemId = button.getAttribute('data-id');
            purchaseItem(itemId);
        });
    });
}


function purchaseItem(itemId) {
    const item = shopItems.find(item => item.id === itemId);
    
    if (!item) {
        showNotification('Item not found!', 2000);
        return;
    }
    
    if (GameCoins.hasEnoughCoins(item.price)) {
        
        if (GameCoins.spendCoins(item.price)) {
            
            if (typeof item.action === 'function') {
                item.action();
            }
            
            showNotification(`You purchased ${item.name}!`);
        }
    } else {
        showNotification(`Not enough coins! You need ${item.price} coins.`);
    }
}


document.addEventListener('DOMContentLoaded', function() {
    
    GameCoins.updateCoinDisplay();
    
    
    const shopButton = document.getElementById('shop-button');
    const shopModal = document.getElementById('shop-modal');
    const closeButton = document.querySelector('.close-button');
    
    if (shopButton && shopModal) {
        shopButton.addEventListener('click', () => {
            initializeShop();
            shopModal.style.display = 'block';
        });
        
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                shopModal.style.display = 'none';
            });
        }
        
        
        window.addEventListener('click', (event) => {
            if (event.target === shopModal) {
                shopModal.style.display = 'none';
            }
        });
    }
});

window.addEventListener('28bugs-progress-synced', function() {
    if (typeof GameCoins !== 'undefined') GameCoins.updateCoinDisplay();
});
