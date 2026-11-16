(function () {
	var COIN_STORAGE_KEY = '28bugs_gameCoins';
	var PURCHASE_STORAGE_KEY = '28bugs_simPurchases';
	var TOGGLE_STORAGE_KEY = '28bugs_featureToggles';

	function getCoins() {
		if (typeof GameCoins !== 'undefined' && GameCoins.getCoins) return GameCoins.getCoins();
		var stored = localStorage.getItem(COIN_STORAGE_KEY);
		return stored ? parseInt(stored, 10) : 0;
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
		var el = document.getElementById('coin-count');
		if (el) {
			var raw = (typeof GameCoins !== 'undefined' && GameCoins.getCoinsBig) ? GameCoins.getCoinsBig() : getCoins();
			el.textContent = typeof window.formatCoinAmount === 'function' ? window.formatCoinAmount(raw) : String(raw);
		}
	}

	function loadPurchases() {
		try {
			var raw = localStorage.getItem(PURCHASE_STORAGE_KEY);
			return raw ? JSON.parse(raw) || {} : {};
		} catch (err) {
			return {};
		}
	}

	function savePurchaseFlag(key, value) {
		if (window.SimFeatureUnlock && typeof window.SimFeatureUnlock.setState === 'function') {
			window.SimFeatureUnlock.setState(key, value);
			return;
		}
		var purchases = loadPurchases();
		purchases[key] = value;
		savePurchases(purchases);
	}

	function savePurchases(purchases) {
		localStorage.setItem(PURCHASE_STORAGE_KEY, JSON.stringify(purchases));
	}

	function isUnlocked(key) {
		if (window.SimFeatureUnlock && typeof window.SimFeatureUnlock.isUnlocked === 'function') {
			return window.SimFeatureUnlock.isUnlocked(key);
		}
		var purchases = loadPurchases();
		return !!purchases[key];
	}

	function loadToggles() {
		try {
			var raw = localStorage.getItem(TOGGLE_STORAGE_KEY);
			return raw ? JSON.parse(raw) || {} : {};
		} catch (err) {
			return {};
		}
	}

	function saveToggles(toggles) {
		localStorage.setItem(TOGGLE_STORAGE_KEY, JSON.stringify(toggles));
	}

	function isFeatureEnabled(key) {
		var toggles = loadToggles();
		return toggles.hasOwnProperty(key) ? toggles[key] : true;
	}

	function setFeatureEnabled(key, enabled) {
		var toggles = loadToggles();
		toggles[key] = enabled;
		saveToggles(toggles);
		applyFeatureState(key, enabled);
	}

	function markUnlocked(key) {
		if (window.SimFeatureUnlock && typeof window.SimFeatureUnlock.unlock === 'function') {
			window.SimFeatureUnlock.unlock(key);
			return;
		}
		savePurchaseFlag(key, true);
	}

	function applyFeatureState(key, enabled) {
		if (window.SimFeatureUnlock && window.SimFeatureUnlock.refresh) {
			window.SimFeatureUnlock.refresh();
		} else {

			var item = catalog.find(function(c) { return c.key === key; });
			if (!item || !item.buttonId) return;
			var btn = document.getElementById(item.buttonId);
			if (btn) {
				btn.style.display = enabled ? '' : 'none';
			}
		}
	}

	function initializeFeatureStates() {

		catalog.forEach(function(item) {
			if (isUnlocked(item.key)) {
				var enabled = isFeatureEnabled(item.key);
				applyFeatureState(item.key, enabled);
			}
		});
	}

	var catalog = Array.isArray(window.SimShopCatalogData) && window.SimShopCatalogData.length
		? window.SimShopCatalogData
		: [
			{ key: 'trueForm', name: 'True Form', price: 10000, description: 'Why would you even get this stupid thing.', location: 'Simulation Tray' },
			{ key: 'mikeMode', name: 'Mike Mode', price: 100, description: 'Yay mike mode :) smile. Now you can talk to the bugs! not really', location: 'Simulation Tray' },
			{ key: 'nuke', name: 'Nuke', price: 1, description: 'After 28awesomebugs started the nuclear weapons buyback program, we have a sudden surplus on our hands! Its a fat man bargain bin!', location: 'Simulation Tray' },
			{ key: 'set28', name: 'Set to 28', price: 280, description: 'Yeah I know you also had this one before but I was feeling pretty greedy. Sets the amount of bugs on screen to 28, the perfect number', location: 'Simulation Tray' },
			{ key: 'greenButton', name: 'Green Button', price: 5000, description: 'green', location: 'Simulation Tray' },

			{ key: 'rockButton', name: 'Rock Button', price: 250, description: 'Spawns a rock slightly above the ground. Havent been bothered to fix the issue yet. have fun i guess idk man', location: 'Simulation Tray' },
			{ key: 'evilMode', name: 'Evil Mode', price: 666, description: 'Only for the SICK and TWISTED cyclepaths....', location: 'Simulation Tray' }
		];

	var modal = document.getElementById('sim-shop-modal');
	var container = document.getElementById('sim-shop-items');
	var openBtn = document.getElementById('shop-open-btn');
	var closeBtn = document.getElementById('sim-shop-close');

	function purchaseItem(item) {
		if (isUnlocked(item.key)) {
			return;
		}
		if (!spendCoins(item.price)) {
			alert('Not enough coins. Play more, Bubby.');
			return;
		}
		markUnlocked(item.key);
		updateCoinDisplay();
		populate();
	}

	function populate() {
		if (!container) {
			return;
		}
		container.innerHTML = '';
		if (!catalog.length) {
			container.innerHTML = '<p class="shop-empty">No items available</p>';
			return;
		}

		catalog.forEach(function (item) {
			var unlocked = isUnlocked(item.key);
			var box = document.createElement('div');
			box.className = 'shop-item-card';

			var title = document.createElement('div');
			title.className = 'shop-item-title';
			title.textContent = item.name;

			var desc = document.createElement('div');
			desc.className = 'shop-item-desc';
			desc.textContent = item.description || '';

			var location = document.createElement('div');
			location.className = 'shop-item-location';
			location.textContent = 'Location: ' + (item.location || 'Simulation');

			var priceRow = document.createElement('div');
			priceRow.className = 'shop-item-price';
			priceRow.textContent = 'Price: ' + item.price + ' coins';

			var buttonRow = document.createElement('div');
			buttonRow.className = 'shop-button-row';

			var action = document.createElement('button');
			action.textContent = unlocked ? 'Purchased' : 'Buy';
			action.disabled = unlocked;
			action.className = 'shop-action-btn';
			if (!action.disabled) {
				action.addEventListener('click', function (event) {
					event.stopPropagation();
					purchaseItem(item);
				});
			}

			var toggleBtn = document.createElement('button');
			var featureEnabled = isFeatureEnabled(item.key);
			toggleBtn.textContent = featureEnabled ? 'Disable' : 'Enable';
			toggleBtn.disabled = !unlocked;
			toggleBtn.className = 'shop-toggle-btn';
			toggleBtn.dataset.enabled = featureEnabled ? 'true' : 'false';
			if (!toggleBtn.disabled) {
				toggleBtn.addEventListener('click', function (event) {
					event.stopPropagation();
					var newState = !isFeatureEnabled(item.key);
					setFeatureEnabled(item.key, newState);
					populate(); 
				});
			}

			buttonRow.appendChild(action);
			buttonRow.appendChild(toggleBtn);

			box.appendChild(title);
			box.appendChild(desc);
			box.appendChild(location);
			box.appendChild(priceRow);
			box.appendChild(buttonRow);
			container.appendChild(box);
		});
	}

	function openModal() {
		if (!modal) {
			return;
		}
		populate();
		modal.style.display = 'block';
	}

	function closeModal() {
		if (modal) {
			modal.style.display = 'none';
		}
	}

	window.ShopFeatureToggle = {
		isEnabled: isFeatureEnabled,
		setEnabled: setFeatureEnabled
	};

	window.addEventListener('simshop:devmode', function () {
		updateCoinDisplay();
		populate();
	});

	document.addEventListener('DOMContentLoaded', function () {
		updateCoinDisplay();
		initializeFeatureStates();
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
})();