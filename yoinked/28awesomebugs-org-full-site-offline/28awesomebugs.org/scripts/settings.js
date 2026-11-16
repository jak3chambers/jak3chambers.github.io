const defaultSettings = {
    gravity: 0.1,
    bounciness: 0.9,
    bugCapacity: 28,
    friction: 0.9999,
    stabilization: 1.0,
    maxSpeed: 60,
    speedCapEnabled: true,
    soundEffectsEnabled: true,
    bugInfoEnabled: true,
    newsTickerEnabled: true,
    newsTickerSpeed: 80
};

let settings = { ...defaultSettings };

try {
    if (localStorage.getItem('28bugs_soundEffectsEnabled') === '0') {
        settings.soundEffectsEnabled = false;
    }
    var savedTickerSpeed = parseInt(localStorage.getItem('28bugs_newsTickerSpeed') || '', 10);
    if (Number.isFinite(savedTickerSpeed) && savedTickerSpeed >= 25 && savedTickerSpeed <= 250) {
        settings.newsTickerSpeed = savedTickerSpeed;
    }
} catch (e) {}

if (window.BugSFX) {
    window.BugSFX.setEnabled(settings.soundEffectsEnabled);
}

function createSettingSlider(label, id, value, min, max, step, description, isInteger = false, decimals = 2) {
    const settingContainer = document.createElement("div");
    settingContainer.className = "setting-field";
    
    const settingLabel = document.createElement("label");
    settingLabel.htmlFor = id;
    settingLabel.textContent = label;
    settingLabel.className = "setting-label";
    
    const settingDescription = document.createElement("p");
    settingDescription.textContent = description;
    settingDescription.className = "setting-desc";
    
    const sliderContainer = document.createElement("div");
    sliderContainer.className = "setting-control";
    
    const slider = document.createElement("input");
    slider.type = "range";
    slider.id = id;
    slider.name = id;
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = value;
    slider.className = "setting-range";
    
    const valueDisplay = document.createElement("span");
    valueDisplay.textContent = isInteger ? parseInt(value) : value.toFixed(decimals);
    valueDisplay.className = "setting-value";
    
    slider.addEventListener("input", () => {
        const val = parseFloat(slider.value);
        valueDisplay.textContent = isInteger ? parseInt(val) : val.toFixed(decimals);
    });
    
    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(valueDisplay);
    
    settingContainer.appendChild(settingLabel);
    settingContainer.appendChild(settingDescription);
    settingContainer.appendChild(sliderContainer);
    
    return settingContainer;
}

function showSpeedLimitWarning(callback) {
    const warningModal = document.createElement("div");
    warningModal.className = "settings-warning-modal";

    const warningContent = document.createElement("div");
    warningContent.className = "settings-warning-content";

    const warningIcon = document.createElement("div");
    warningIcon.textContent = "⚠️";
    warningIcon.className = "settings-warning-icon";
    warningContent.appendChild(warningIcon);

    const warningTitle = document.createElement("h2");
    warningTitle.textContent = "WARNING: Speed Cap Removal";
    warningTitle.className = "settings-warning-title";
    warningContent.appendChild(warningTitle);

    const warningMessage = document.createElement("p");
    warningMessage.innerHTML = `Removing the speed cap may cause <strong>awesome</strong> bug behavior, including:<br>
                              • Bugs moving at impossible speeds<br>
                              • Bugs phasing through objects<br>
                              • Performance issues<br>
                              • Browser slowdowns<br><br>
                              Are you absolutely sure you want to proceed?`;
    warningMessage.className = "settings-warning-message";
    warningContent.appendChild(warningMessage);

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "settings-warning-actions";
    
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.className = "settings-warning-button";
    cancelButton.addEventListener("click", () => {
        warningModal.remove();
    });
    
    const confirmButton = document.createElement("button");
    confirmButton.textContent = "Remove Speed Cap";
    confirmButton.className = "settings-warning-button settings-warning-danger";
    confirmButton.addEventListener("click", () => {
        const warningSound = new Audio("src/deltarune-explosion.mp3");
        warningSound.volume = 0.2;
        warningSound.play();
        
        if (callback) callback(true);
        
        warningModal.remove();
    });
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);
    warningContent.appendChild(buttonContainer);
    
    warningModal.appendChild(warningContent);
    document.body.appendChild(warningModal);
}

function showBugLimitWarning(callback) {
    const warningModal = document.createElement("div");
    warningModal.className = "settings-warning-modal";

    const warningContent = document.createElement("div");
    warningContent.className = "settings-warning-content";

    const warningIcon = document.createElement("div");
    warningIcon.textContent = "";
    warningIcon.className = "settings-warning-icon";
    warningContent.appendChild(warningIcon);

    const warningTitle = document.createElement("h2");
    warningTitle.textContent = "WARNING: Bug Limit Removal";
    warningTitle.className = "settings-warning-title";
    warningContent.appendChild(warningTitle);

    const warningMessage = document.createElement("p");
    warningMessage.innerHTML = `Removing the bug limit may cause <strong>awesome</strong> things to happen, including:<br>
                              • Lots of friends<br>
                              • Lots of bouncing around<br>
                              • Maybe too many is bad<br>
                              • Performance degradation if you go past like 100 or something idk<br><br>
                              Are you sure you want to proceed?`;
    warningMessage.className = "settings-warning-message";
    warningContent.appendChild(warningMessage);

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "settings-warning-actions";
    
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.className = "settings-warning-button";
    cancelButton.addEventListener("click", () => {
        warningModal.remove();
    });
    
    const confirmButton = document.createElement("button");
    confirmButton.textContent = "Remove Bug Limit";
    confirmButton.className = "settings-warning-button settings-warning-danger";
    confirmButton.addEventListener("click", () => {
        const warningSound = new Audio("src/deltarune-explosion.mp3");
        warningSound.volume = 0.2;
        warningSound.play();
        
        if (callback) callback(true);
        
        warningModal.remove();
    });
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);
    warningContent.appendChild(buttonContainer);
    
    warningModal.appendChild(warningContent);
    document.body.appendChild(warningModal);
}

function showMemorialClearWarning(callback) {
    const warningModal = document.createElement("div");
    warningModal.className = "settings-warning-modal";

    const warningContent = document.createElement("div");
    warningContent.className = "settings-warning-content";

    const warningIcon = document.createElement("div");
    warningIcon.textContent = "";
    warningIcon.className = "settings-warning-icon";
    warningContent.appendChild(warningIcon);

    const warningTitle = document.createElement("h2");
    warningTitle.textContent = "Clear Memorial Wall";
    warningTitle.className = "settings-warning-title";
    warningContent.appendChild(warningTitle);

    const warningMessage = document.createElement("p");
    warningMessage.innerHTML = `Are you sure you want to clear the memorial wall?<br><br>
                              <strong>This action will permanently delete all memorial records.</strong><br>
                              All your killed bugs will be forgotten forever. Their families will forget them.<br><br>
                              This action cannot be undone, and while their memories will be gone, their blood will still stain your hands.`;
    warningMessage.className = "settings-warning-message";
    warningContent.appendChild(warningMessage);

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "settings-warning-actions";
    
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.className = "settings-warning-button";
    cancelButton.addEventListener("click", () => {
        warningModal.remove();
    });
    
    const confirmButton = document.createElement("button");
    confirmButton.textContent = "Clear Memorial";
    confirmButton.className = "settings-warning-button settings-warning-danger";
    confirmButton.addEventListener("click", () => {
        if (callback) callback(true);
        
        warningModal.remove();
    });
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);
    warningContent.appendChild(buttonContainer);
    
    warningModal.appendChild(warningContent);
    document.body.appendChild(warningModal);
}

function showSettingsMenu(updateCallback) {
    const settingsModal = document.createElement("div");
    settingsModal.className = "settings-modal settings-overlay";

    const settingsContent = document.createElement("div");
    settingsContent.className = "settings-dialog";

    const settingsHeader = document.createElement("div");
    settingsHeader.className = "settings-dialog__header";
    
    const settingsTitle = document.createElement("h2");
    settingsTitle.textContent = "Bug Settings";
    settingsTitle.className = "settings-dialog__title";
    
    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.className = "settings-btn settings-btn-ghost settings-dialog__close";
    closeButton.addEventListener("click", () => {
        settingsModal.remove();
    });
    
    settingsHeader.appendChild(settingsTitle);
    settingsHeader.appendChild(closeButton);
    settingsContent.appendChild(settingsHeader);

    const contentArea = document.createElement("div");
    contentArea.className = "settings-dialog__body";

    const settingsForm = document.createElement("form");
    settingsForm.className = "settings-form";
    
    const slidersSection = document.createElement("div");
    slidersSection.className = "settings-section settings-section--grid";
    
    const slidersTitle = document.createElement("h3");
    slidersTitle.textContent = "Physics Settings";
    slidersTitle.className = "settings-section__title";
    slidersSection.appendChild(slidersTitle);
    
    const gravitySetting = createSettingSlider(
        "Gravity Force",
        "gravity",
        settings.gravity,
        0,
        1.0,
        0.01,
        "Higher values make bugs fall faster"
    );
    slidersSection.appendChild(gravitySetting);
    
    const bouncinessSetting = createSettingSlider(
        "Bounciness",
        "bounciness",
        settings.bounciness,
        0,
        5.0,
        0.1,
        "How bouncy the bugs are when they collide"
    );
    slidersSection.appendChild(bouncinessSetting);
    
    const frictionSetting = createSettingSlider(
        "Friction",
        "friction",
        settings.friction,
        0.9,
        2.0,
        0.001,
        "How quickly bugs slow down (higher = less friction). Anything above 1 will make it awesome, but they will gain speed by moving.",
        false,
        4
    );
    slidersSection.appendChild(frictionSetting);
    
    const stabilizationSetting = createSettingSlider(
        "Physics Stabilization",
        "stabilization",
        settings.stabilization,
        0.5,
        3.0,
        0.1,
        "Higher values increase simulation stability but might reduce realism",
        false,
        1
    );
    slidersSection.appendChild(stabilizationSetting);
    
    const maxSpeedSetting = createSettingSlider(
        "Maximum Bug Speed",
        "maxSpeed",
        settings.maxSpeed,
        10,
        2000,
        1,
        "Limit how fast bugs can move",
        true
    );
    slidersSection.appendChild(maxSpeedSetting);
    
    settingsForm.appendChild(slidersSection);
    
    const dangerSection = document.createElement("div");
    dangerSection.className = "settings-section settings-section--danger";
    
    const dangerTitle = document.createElement("h3");
    dangerTitle.textContent = "Awesome Zone";
    dangerTitle.className = "settings-section__title";
    dangerSection.appendChild(dangerTitle);
    
    const bugLimitContainer = document.createElement("div");
    bugLimitContainer.className = "settings-card";
    
    const bugLimitLabel = document.createElement("div");
    bugLimitLabel.className = "settings-card__title";
    bugLimitLabel.textContent = "Bug Capacity";
    bugLimitContainer.appendChild(bugLimitLabel);
    
    const capacityInfo = document.createElement("p");
    capacityInfo.className = "settings-helper";
    
    if (settings.bugCapacity === Infinity) {
        capacityInfo.innerHTML = "<strong>Bug limit removed</strong>. You can do whatever you want :)!";
        capacityInfo.classList.add("settings-helper--pill");
    } else {
        capacityInfo.textContent = `Current capacity: ${settings.bugCapacity} bugs`;
    }
    
    bugLimitContainer.appendChild(capacityInfo);
    
    const bugLimitButton = document.createElement("button");
    bugLimitButton.type = "button";
    bugLimitButton.textContent = settings.bugCapacity === Infinity ? "Restore Bug Limit" : "Remove Bug Limit";
    bugLimitButton.className = "settings-btn full-width " + (settings.bugCapacity === Infinity ? "settings-btn-success" : "settings-btn-danger");
    
    bugLimitButton.addEventListener("click", () => {
        if (settings.bugCapacity !== Infinity) {
            showBugLimitWarning((confirmed) => {
                if (confirmed) {
                    settings.bugCapacity = Infinity;
                    bugLimitButton.textContent = "Restore Bug Limit";
                    bugLimitButton.classList.remove("settings-btn-danger");
                    bugLimitButton.classList.add("settings-btn-success");
                    
                    capacityInfo.innerHTML = "<strong>Bug limit removed</strong>. You can have unlimited friends!";
                    capacityInfo.classList.add("settings-helper--pill");
                }
            });
        } else {
            settings.bugCapacity = defaultSettings.bugCapacity;
            bugLimitButton.textContent = "Remove Bug Limit";
            bugLimitButton.classList.remove("settings-btn-success");
            bugLimitButton.classList.add("settings-btn-danger");
            
            capacityInfo.innerHTML = `Current capacity: ${settings.bugCapacity} bugs`;
            capacityInfo.classList.remove("settings-helper--pill");
        }
    });
    
    bugLimitContainer.appendChild(bugLimitButton);
    dangerSection.appendChild(bugLimitContainer);
    
    const memorialContainer = document.createElement("div");
    memorialContainer.className = "settings-card";
    
    const memorialLabel = document.createElement("div");
    memorialLabel.className = "settings-card__title";
    memorialLabel.textContent = "Memorial Data";
    memorialContainer.appendChild(memorialLabel);
    
    let memorialData = [];
    try { memorialData = JSON.parse(localStorage.getItem('28bugs_memorialData')) || []; } catch(_) {}
    const memorialCount = document.createElement("p");
    memorialCount.textContent = `${memorialData.length} bugs in memorial`;
    memorialCount.className = "settings-helper";
    memorialContainer.appendChild(memorialCount);
    
    const clearMemorialButton = document.createElement("button");
    clearMemorialButton.type = "button";
    clearMemorialButton.textContent = "Clear Memorial Wall";
    clearMemorialButton.className = "settings-btn settings-btn-danger full-width";
    
    clearMemorialButton.addEventListener("click", () => {
        showMemorialClearWarning((confirmed) => {
            if (confirmed) {
                localStorage.removeItem('28bugs_memorialData');
                if (window.deletedBugs) {
                    window.deletedBugs.length = 0;
                }

                memorialCount.textContent = "0 bugs in memorial";
                clearMemorialButton.disabled = true;
                clearMemorialButton.textContent = "Memorial Cleared";

                if (typeof AccountSync !== 'undefined' && AccountSync.isLoggedIn()) {
                    AccountSync.saveProgress().then(function(result) {
                        if (!result || !result.success) return;
                        if (result.removed && result.removed.length > 0 && typeof showNotification === 'function') {
                            showNotification('Tags updated: ' + result.removed.join(', ') + ' removed');
                        }
                        if (result.awarded && result.awarded.length > 0 && typeof showNotification === 'function') {
                            showNotification('Achievement unlocked: ' + result.awarded.join(', '));
                        }
                    }).catch(function(err) {
                        console.warn('Failed to sync memorial clear:', err);
                    });
                }
            }
        });
    });
    
    if (memorialData.length === 0) {
        clearMemorialButton.disabled = true;
        clearMemorialButton.textContent = "No Memorial Data";
    }
    
    memorialContainer.appendChild(clearMemorialButton);
    dangerSection.appendChild(memorialContainer);
    
    settingsForm.appendChild(dangerSection);

    const audioSection = document.createElement("div");
    audioSection.className = "settings-section";

    const audioTitle = document.createElement("h3");
    audioTitle.textContent = "Sound & Audio";
    audioTitle.className = "settings-section__title";
    audioSection.appendChild(audioTitle);

    const soundToggleContainer = document.createElement("div");
    soundToggleContainer.className = "settings-card";

    const soundToggleLabel = document.createElement("label");
    soundToggleLabel.className = "settings-toggle";
    soundToggleLabel.style.display = "flex";
    soundToggleLabel.style.alignItems = "center";
    soundToggleLabel.style.gap = "10px";
    soundToggleLabel.style.cursor = "pointer";

    const soundToggleCheckbox = document.createElement("input");
    soundToggleCheckbox.type = "checkbox";
    soundToggleCheckbox.checked = settings.soundEffectsEnabled;
    soundToggleCheckbox.style.width = "20px";
    soundToggleCheckbox.style.height = "20px";
    soundToggleCheckbox.style.cursor = "pointer";

    const soundToggleText = document.createElement("span");
    soundToggleText.textContent = "Enable Sound Effects";
    soundToggleText.style.fontWeight = "700";

    soundToggleCheckbox.addEventListener("change", () => {
        settings.soundEffectsEnabled = soundToggleCheckbox.checked;
        if (window.BugSFX) window.BugSFX.setEnabled(soundToggleCheckbox.checked);
    });

    soundToggleLabel.appendChild(soundToggleCheckbox);
    soundToggleLabel.appendChild(soundToggleText);
    soundToggleContainer.appendChild(soundToggleLabel);
    audioSection.appendChild(soundToggleContainer);

    settingsForm.appendChild(audioSection);

    
    const newsSection = document.createElement("div");
    newsSection.className = "settings-section";

    const newsTitle = document.createElement("h3");
    newsTitle.textContent = "News & Features";
    newsTitle.className = "settings-section__title";
    newsSection.appendChild(newsTitle);

    const newsToggleContainer = document.createElement("div");
    newsToggleContainer.className = "settings-card";

    const newsToggleLabel = document.createElement("label");
    newsToggleLabel.className = "settings-toggle";
    newsToggleLabel.style.display = "flex";
    newsToggleLabel.style.alignItems = "center";
    newsToggleLabel.style.gap = "10px";
    newsToggleLabel.style.cursor = "pointer";

    const newsToggleCheckbox = document.createElement("input");
    newsToggleCheckbox.type = "checkbox";
    newsToggleCheckbox.checked = settings.newsTickerEnabled;
    newsToggleCheckbox.style.width = "20px";
    newsToggleCheckbox.style.height = "20px";
    newsToggleCheckbox.style.cursor = "pointer";

    const newsToggleText = document.createElement("span");
    newsToggleText.textContent = "Enable News Ticker";
    newsToggleText.style.fontWeight = "700";

    newsToggleCheckbox.addEventListener("change", () => {
        settings.newsTickerEnabled = newsToggleCheckbox.checked;
        
        const newsTicker = document.getElementById('news-ticker');
        if (newsTicker) {
            newsTicker.style.display = settings.newsTickerEnabled ? 'flex' : 'none';
        }
        
        document.body.classList.toggle('has-news-ticker', settings.newsTickerEnabled);
    });

    newsToggleLabel.appendChild(newsToggleCheckbox);
    newsToggleLabel.appendChild(newsToggleText);
    newsToggleContainer.appendChild(newsToggleLabel);
    newsSection.appendChild(newsToggleContainer);

    const newsSpeedSetting = createSettingSlider(
        "News Ticker Speed",
        "newsTickerSpeed",
        settings.newsTickerSpeed,
        25,
        250,
        5,
        "How fast headlines scroll across the top bar (higher = faster)",
        true
    );
    const newsSpeedSlider = newsSpeedSetting.querySelector("#newsTickerSpeed");
    newsSpeedSlider.addEventListener("input", () => {
        settings.newsTickerSpeed = parseInt(newsSpeedSlider.value, 10);
        applyNewsTickerSpeed(settings.newsTickerSpeed);
    });
    newsSection.appendChild(newsSpeedSetting);

    settingsForm.appendChild(newsSection);

    
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "settings-footer";
    
    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.textContent = "Reset Defaults";
    resetButton.className = "settings-btn settings-btn-muted";
    
    resetButton.addEventListener("click", () => {
        settings.gravity = defaultSettings.gravity;
        settings.bounciness = defaultSettings.bounciness;
        settings.friction = defaultSettings.friction;
        settings.stabilization = defaultSettings.stabilization;
        settings.maxSpeed = defaultSettings.maxSpeed;
        settings.speedCapEnabled = defaultSettings.speedCapEnabled;
        settings.bugCapacity = defaultSettings.bugCapacity;
        settings.soundEffectsEnabled = defaultSettings.soundEffectsEnabled;
        if (window.BugSFX) window.BugSFX.setEnabled(defaultSettings.soundEffectsEnabled);
        soundToggleCheckbox.checked = defaultSettings.soundEffectsEnabled;
        settings.newsTickerSpeed = defaultSettings.newsTickerSpeed;
        newsSpeedSlider.value = defaultSettings.newsTickerSpeed;
        newsSpeedSlider.dispatchEvent(new Event("input"));
        
        const gravityInput = settingsForm.querySelector("#gravity");
        gravityInput.value = defaultSettings.gravity;
        gravityInput.dispatchEvent(new Event("input"));
        
        const bouncinessInput = settingsForm.querySelector("#bounciness");
        bouncinessInput.value = defaultSettings.bounciness;
        bouncinessInput.dispatchEvent(new Event("input"));
        
        const frictionInput = settingsForm.querySelector("#friction");
        frictionInput.value = defaultSettings.friction;
        frictionInput.dispatchEvent(new Event("input"));
        
        const stabilizationInput = settingsForm.querySelector("#stabilization");
        stabilizationInput.value = defaultSettings.stabilization;
        stabilizationInput.dispatchEvent(new Event("input"));
        
        const maxSpeedInput = settingsForm.querySelector("#maxSpeed");
        maxSpeedInput.value = defaultSettings.maxSpeed;
        maxSpeedInput.dispatchEvent(new Event("input"));
        
        const bugInfoToggleCheckbox = settingsForm.querySelector('input[type="checkbox"]');
        if (bugInfoToggleCheckbox) {
            bugInfoToggleCheckbox.checked = defaultSettings.bugInfoEnabled;
            bugInfoToggleCheckbox.dispatchEvent(new Event("change"));
        }
        
        bugLimitButton.textContent = "Remove Bug Limit";
        bugLimitButton.classList.remove("settings-btn-success");
        bugLimitButton.classList.add("settings-btn-danger");
        capacityInfo.textContent = `Current capacity: ${defaultSettings.bugCapacity} bugs`;
        capacityInfo.classList.remove("settings-helper--pill");
        
        alert("Settings have been reset to defaults!");
    });
    
    const saveButton = document.createElement("button");
    saveButton.type = "submit";
    saveButton.textContent = "Save Settings";
    saveButton.className = "settings-btn settings-btn-primary";
    
    buttonContainer.appendChild(resetButton);
    buttonContainer.appendChild(saveButton);
    settingsForm.appendChild(buttonContainer);
    
    settingsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        settings.gravity = parseFloat(settingsForm.gravity.value);
        settings.bounciness = parseFloat(settingsForm.bounciness.value);
        settings.friction = parseFloat(settingsForm.friction.value);
        settings.stabilization = parseFloat(settingsForm.stabilization.value);
        settings.maxSpeed = parseInt(settingsForm.maxSpeed.value);
        settings.newsTickerSpeed = parseInt(settingsForm.newsTickerSpeed.value, 10);
        try {
            localStorage.setItem('28bugs_newsTickerSpeed', String(settings.newsTickerSpeed));
        } catch (e) {}
        applyNewsTickerSpeed(settings.newsTickerSpeed);
        
        if (typeof updateCallback === 'function') {
            updateCallback();
        }
        
        settingsModal.remove();
    });
    
    contentArea.appendChild(settingsForm);
    settingsContent.appendChild(contentArea);
    settingsModal.appendChild(settingsContent);
    document.body.appendChild(settingsModal);
}

function resetSettings() {
    settings = { ...defaultSettings };
    return settings;
}


function applyNewsTickerSpeed(speedPxPerSec) {
    var newsTrack = document.querySelector('#news-ticker .news-track');
    if (!newsTrack || !newsTrack.children.length) return;
    var speed = parseInt(speedPxPerSec, 10);
    if (!Number.isFinite(speed) || speed < 25) speed = defaultSettings.newsTickerSpeed;
    var singlePassPx = newsTrack.scrollWidth / 2;
    if (!singlePassPx) return;
    var duration = Math.max(10, singlePassPx / speed);
    newsTrack.style.animationDuration = duration + 's';
}

function loadNewsTicker() {
    
    if (!document.querySelector('.bugs-container')) {
        return;
    }

    fetch('data/news.json')
        .then(response => response.json())
        .then(data => {
            const newsTrack = document.querySelector('#news-ticker .news-track');
            if (!newsTrack) return;

            newsTrack.innerHTML = '';

            
            
            
            
            const shuffled = [...data.headlines].sort(() => Math.random() - 0.5);
            const doubled = [...shuffled, ...shuffled];
            doubled.forEach(text => {
                const item = document.createElement('div');
                item.className = 'news-item';
                item.textContent = text;
                newsTrack.appendChild(item);
            });

            
            
            
            requestAnimationFrame(() => {
                applyNewsTickerSpeed(settings.newsTickerSpeed);
                newsTrack.classList.add('ticker-ready');
            });

            
            const newsTicker = document.getElementById('news-ticker');
            if (newsTicker) {
                newsTicker.style.display = settings.newsTickerEnabled ? 'flex' : 'none';
            }
            document.body.classList.toggle('has-news-ticker', settings.newsTickerEnabled);
        })
        .catch(error => {
            console.error('Error loading news:', error);
            const newsTrack = document.querySelector('#news-ticker .news-track');
            if (newsTrack) {
                newsTrack.innerHTML = '<div class="news-item">Failed to load news feed</div>';
            }
        });
}

function initNewsTicker() {
    
    if (!document.querySelector('.bugs-container')) {
        return;
    }
    loadNewsTicker();
}


document.addEventListener('DOMContentLoaded', () => {
    initNewsTicker();
});

window.BugSettings = {
    settings,
    defaultSettings,
    showSettingsMenu,
    resetSettings,
    applyNewsTickerSpeed,
    isSoundEffectsEnabled: function () {
        return window.BugSFX ? window.BugSFX.isEnabled() : settings.soundEffectsEnabled !== false;
    }
};
