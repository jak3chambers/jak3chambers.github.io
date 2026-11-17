(function () {
	var COIN_STORAGE_KEY = '28bugs_gameCoins';
	var THEME_STORAGE_KEY = '28bugs_purchasedThemes';
	var ACTIVE_THEME_KEY = '28bugs_activeTheme';

	function getCoins() {
		if (typeof GameCoins !== 'undefined' && GameCoins.getCoins) return GameCoins.getCoins();
		var stored = localStorage.getItem(COIN_STORAGE_KEY);
		var parsed = stored ? parseInt(stored, 10) : 0;
		return (isNaN(parsed) || parsed === null || parsed === undefined) ? 0 : parsed;
	}

	function setCoins(value) {
		if (typeof GameCoins !== 'undefined' && GameCoins.setCoins) return GameCoins.setCoins(value);
		localStorage.setItem(COIN_STORAGE_KEY, String(value));
	}

	function spendCoins(amount) {
		if (typeof GameCoins !== 'undefined' && GameCoins.spendCoins) return GameCoins.spendCoins(amount);
		var current = getCoins();
		if (current < amount) {
			return false;
		}
		setCoins(current - amount);
		return true;
	}

	function updateCoinDisplay() {
		var el = document.getElementById('theme-coin-count');
		if (el) {
			var raw = (typeof GameCoins !== 'undefined' && GameCoins.getCoinsBig) ? GameCoins.getCoinsBig() : getCoins();
			var coinAmount = typeof window.formatCoinAmount === 'function' ? window.formatCoinAmount(raw) : String(raw);
			el.textContent = coinAmount || '0';
		}
	}

	function loadPurchasedThemes() {
		try {
			var raw = localStorage.getItem(THEME_STORAGE_KEY);
			return raw ? JSON.parse(raw) || [] : [];
		} catch (err) {
			return [];
		}
	}

	function savePurchasedThemes(themes) {
		localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themes));
	}

	function isThemeOwned(themeKey) {
		var purchased = loadPurchasedThemes();
		return purchased.indexOf(themeKey) !== -1;
	}

	function purchaseTheme(themeKey) {
		var purchased = loadPurchasedThemes();
		if (purchased.indexOf(themeKey) === -1) {
			purchased.push(themeKey);
			savePurchasedThemes(purchased);
		}
	}

	function getActiveTheme() {
		return localStorage.getItem(ACTIVE_THEME_KEY) || 'light';
	}

	function setActiveTheme(themeKey) {
		localStorage.setItem(ACTIVE_THEME_KEY, themeKey);
		applyTheme(themeKey);
	}

	function applyTheme(themeKey) {
		var body = document.body;
		
		body.className = body.className.replace(/theme-\w+/g, '').trim();
		
		body.classList.add('theme-' + themeKey);
	}

	var themeCatalog = [
		{ 
			key: 'light', 
			name: 'Classic Light', 
			price: 0, 
			description: 'You know it, you love it. This theme rocks and I like it a lot',
			defaultUnlocked: true
		},
		{ 
			key: 'dark', 
			name: 'Dark Mode', 
			price: 0, 
			description: 'The fabled dark mode that i\'ve gotten so many requests for. Hopefully its easier on the eyes for late at night bugging',
			defaultUnlocked: false
		},
		{ 
			key: 'midnight', 
			name: 'Deep Blue', 
			price: 750, 
			description: 'Like dark mode, but if you like the color blue. I like the color blue! Fancy that.',
			defaultUnlocked: false
		},
		{ 
			key: 'sunset', 
			name: '28awesomebugs Sunset Special', 
			price: 600, 
			description: 'We put the power of the sun into the website. It took 5 million dollars to permanently keep it at sunset, but hopefully you like it',
			defaultUnlocked: false
		},
		{ 
			key: 'forest', 
			name: 'Green Buge Green', 
			price: 650, 
			description: 'The only time you will see the word Buge mentioned on this site i think i dont know i forgot',
			defaultUnlocked: false
		},
		{ 
			key: 'purple', 
			name: 'Purple Smoke', 
			price: 800, 
			description: 'That ones a DEEP CUT. But still awesome if you dont get it and you like the color purple like i do',
			defaultUnlocked: false
		}
	];

	var modal = document.getElementById('theme-shop-modal');
	var container = document.getElementById('theme-shop-items');
	var openBtn = document.getElementById('theme-shop-btn');
	var closeBtn = document.getElementById('theme-shop-close');

	function purchaseItem(theme) {
		
		if (isThemeOwned(theme.key)) {
			setActiveTheme(theme.key);
			populate();
			return;
		}

		
		if (!spendCoins(theme.price)) {
			alert('Sorry bubby you need more dough. Specifically ' + theme.price + ' coins.');
			return;
		}

		
		purchaseTheme(theme.key);
		setActiveTheme(theme.key);
		updateCoinDisplay();
		populate();
	}

	function populate() {
		if (!container) {
			return;
		}
		container.innerHTML = '';
		
		var activeTheme = getActiveTheme();

		themeCatalog.forEach(function (theme) {
			var owned = theme.defaultUnlocked || isThemeOwned(theme.key);
			var isActive = activeTheme === theme.key;

			var box = document.createElement('div');
			box.className = 'theme-shop-item' + (isActive ? ' active' : '');

			if (isActive) {
				var activeBadge = document.createElement('div');
				activeBadge.className = 'active-badge';
				activeBadge.textContent = 'ACTIVE';
				box.appendChild(activeBadge);
			}

			var title = document.createElement('div');
			title.style.fontWeight = '600';
			title.style.fontSize = '1.1em';
			title.textContent = theme.name;

			var desc = document.createElement('div');
			desc.style.fontSize = '0.9em';
			desc.style.color = '#555';
			desc.textContent = theme.description || '';

			var priceRow = document.createElement('div');
			priceRow.className = 'price-row';
			priceRow.style.marginTop = '4px';
			
			if (theme.price === 0) {
				priceRow.textContent = 'FREE';
				priceRow.classList.add('price-free');
			} else if (owned) {
				priceRow.textContent = 'OWNED';
				priceRow.classList.add('price-owned');
			} else {
				priceRow.textContent = 'Price: ' + theme.price + ' coins';
			}

			var action = document.createElement('button');
			action.className = 'action-btn';
			if (isActive) {
				action.textContent = 'Active';
				action.disabled = true;
				action.classList.add('active');
			} else if (owned) {
				action.textContent = 'Activate';
				action.disabled = false;
				action.classList.add('owned');
			} else {
				action.textContent = 'Purchase';
				action.disabled = false;
				action.classList.add('purchase');
			}

			if (!action.disabled) {
				action.addEventListener('click', function (event) {
					event.stopPropagation();
					purchaseItem(theme);
				});
			}

			box.appendChild(title);
			box.appendChild(desc);
			box.appendChild(priceRow);
			box.appendChild(action);
			container.appendChild(box);
		});
	}

	function openModal() {
		if (!modal) {
			return;
		}
		updateCoinDisplay();
		populate();
		modal.style.display = 'block';
	}

	function closeModal() {
		if (modal) {
			modal.style.display = 'none';
		}
	}

	
	function initializeTheme() {
		var activeTheme = getActiveTheme();
		applyTheme(activeTheme);
		
		
		var purchased = loadPurchasedThemes();
		if (purchased.indexOf('light') === -1) {
			purchased.push('light');
			savePurchasedThemes(purchased);
		}
	}

	document.addEventListener('DOMContentLoaded', function () {
		initializeTheme();
		updateCoinDisplay();
		
		if (openBtn) {
			openBtn.addEventListener('click', function (event) {
				event.stopPropagation();
				openModal();
			});
		}
		if (closeBtn) {
			closeBtn.addEventListener('click', function (event) {
				event.stopPropagation();
				closeModal();
			});
		}
		window.addEventListener('click', function (event) {
			if (event.target === modal) {
				closeModal();
			}
		});
	});

	
	window.ThemeShop = {
		getActiveTheme: getActiveTheme,
		setActiveTheme: setActiveTheme,
		isThemeOwned: isThemeOwned,
		purchaseTheme: purchaseTheme
	};
})();
