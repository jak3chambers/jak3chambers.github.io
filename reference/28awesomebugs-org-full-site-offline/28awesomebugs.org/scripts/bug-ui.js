

document.addEventListener("DOMContentLoaded", () => {
    const infoBox = document.createElement("div");
    infoBox.id = "bugInfoBox";
    
    infoBox.innerHTML = '<div class="bug-info-header">'
        + '<img class="bug-info-portrait" src="" alt="Bug portrait" />'
        + '<span class="bug-info-name"></span>'
        + '</div>'
        + '<div class="bug-info-body">'
        + '<p class="bug-info-story"></p>'
        + '<span class="bug-info-born"></span>'
        + '<div class="bug-info-stats"></div>'
        + '</div>';
    document.body.appendChild(infoBox);

    const fbButton = document.getElementById('feedback-button');
    if (fbButton) {
        fbButton.addEventListener('click', (e) => {
            e.preventDefault();
            try {
                if (window.BugUI && typeof window.BugUI.showFeedbackForm === 'function') {
                    window.BugUI.showFeedbackForm();
                } else if (typeof window.showFeedbackModal === 'function') {
                    window.showFeedbackModal();
                } else {
                    console.warn('[bug-ui.js] No feedback handler available when clicking #feedback-button');
                }
            } catch (err) {
                console.error('[bug-ui.js] Error opening feedback modal:', err);
            }
        });
    }
});


const BugUI = {
    currentTooltip: null,

    showTooltip(bug) {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
        }

        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = 'Bug Info';
        document.body.appendChild(tooltip);
        this.currentTooltip = tooltip;

        const updateTooltipPosition = () => {
            const bugRect = bug.element.getBoundingClientRect();
            let left = bugRect.left + bugRect.width / 2;
            let top = bugRect.top - 20;


            if (left + tooltip.offsetWidth > window.innerWidth) {
                left = window.innerWidth - tooltip.offsetWidth - 10;
            }
            if (top + tooltip.offsetHeight > window.innerHeight) {
                top = window.innerHeight - tooltip.offsetHeight - 10;
            }

            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
        };

        updateTooltipPosition();

        const tooltipInterval = setInterval(updateTooltipPosition, 16);

        
        tooltip.addEventListener('remove', () => {
            clearInterval(tooltipInterval);
        });
    },

    
    _isOpen: false,
    _closeHandler: null,
    _openHandler: null,

    _cleanupHandlers(infoBox) {
        if (this._closeHandler) {
            infoBox.removeEventListener('animationend', this._closeHandler);
            this._closeHandler = null;
        }
        if (this._openHandler) {
            infoBox.removeEventListener('animationend', this._openHandler);
            this._openHandler = null;
        }
    },

    closeBugInfo() {
        const infoBox = document.getElementById('bugInfoBox');
        if (!infoBox || !this._isOpen) return;
        if (infoBox.classList.contains('crt-closing')) return;

        this._cleanupHandlers(infoBox);
        if (window.BugMiscStats) window.BugMiscStats.stopLiveUpdate();
        infoBox.classList.remove('crt-opening', 'crt-open', 'crt-swapping');
        
        
        infoBox.style.display = 'block';
        void infoBox.offsetWidth;
        infoBox.classList.add('crt-closing');
        this._isOpen = false;

        const self = this;
        this._closeHandler = function(e) {
            if (e.animationName !== 'crt-turn-off') return;
            infoBox.removeEventListener('animationend', self._closeHandler);
            self._closeHandler = null;
            infoBox.classList.remove('crt-closing');
            infoBox.style.display = 'none';
        };
        infoBox.addEventListener('animationend', this._closeHandler);
    },

    _positionInfoBox(infoBox) {
        const header = document.querySelector('header');
        const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
        const margin = 12;
        infoBox.style.top = (headerBottom + margin) + 'px';
        infoBox.style.right = margin + 'px';
        infoBox.style.left = '';

        if (window.innerWidth <= 768) {
            infoBox.style.top = (headerBottom + margin) + 'px';
            infoBox.style.bottom = '';
            infoBox.style.right = '10px';
            infoBox.style.left = '';
        }
    },

    _populateContent(infoBox, bugSrc, name, story, birthday, isShiny, bugEl) {
        const portrait = infoBox.querySelector('.bug-info-portrait');
        const nameEl = infoBox.querySelector('.bug-info-name');
        const storyEl = infoBox.querySelector('.bug-info-story');
        const bornEl = infoBox.querySelector('.bug-info-born');

        portrait.src = bugSrc;
        nameEl.textContent = name;
        storyEl.textContent = story;
        bornEl.textContent = 'Born: ' + birthday;
        nameEl.classList.toggle('shiny-name', isShiny);

        const statsEl = infoBox.querySelector('.bug-info-stats');
        if (statsEl && window.BugMiscStats && bugEl) {
            var stats = window.BugMiscStats.getStatsForBug(bugEl);
            statsEl.innerHTML = stats.map(function (s) {
                return '<span class="bug-info-stat" data-stat-key="' + s.key + '">'
                     + '<span class="bug-stat-label">' + s.label + ':</span> '
                     + s.display + '</span>';
            }).join('');
            window.BugMiscStats.startLiveUpdate(bugEl, statsEl);
        }
    },

    showBugInfo(event, name, story, birthday) {
        const infoBox = document.getElementById('bugInfoBox');
        const bugEl = event.currentTarget || event.target;
        const bugSrc = bugEl.src || bugEl.querySelector('img')?.src || '';
        const isShiny = bugEl.classList && bugEl.classList.contains('shiny');

        
        this._cleanupHandlers(infoBox);

        
        if (this._isOpen && infoBox.style.display !== 'none') {
            infoBox.classList.remove('crt-opening', 'crt-closing');
            const oldHeight = infoBox.offsetHeight;
            infoBox.style.height = oldHeight + 'px';

            this._populateContent(infoBox, bugSrc, name, story, birthday, isShiny, bugEl);
            this._positionInfoBox(infoBox);

            infoBox.classList.remove('crt-swapping');
            void infoBox.offsetWidth;
            infoBox.classList.add('crt-swapping');

            infoBox.style.height = 'auto';
            const newHeight = infoBox.offsetHeight;
            infoBox.style.height = oldHeight + 'px';
            void infoBox.offsetWidth;
            infoBox.style.height = newHeight + 'px';

            function onTransitionEnd(e) {
                if (e.propertyName === 'height') {
                    infoBox.removeEventListener('transitionend', onTransitionEnd);
                    infoBox.style.height = 'auto';
                }
            }
            infoBox.addEventListener('transitionend', onTransitionEnd);

            infoBox.addEventListener('animationend', function handler(e) {
                if (e.animationName === 'crt-line-sweep') {
                    infoBox.removeEventListener('animationend', handler);
                    infoBox.classList.remove('crt-swapping');
                }
            });
            return;
        }

        
        
        infoBox.classList.remove('crt-closing', 'crt-open', 'crt-swapping');
        this._populateContent(infoBox, bugSrc, name, story, birthday, isShiny, bugEl);
        infoBox.style.display = 'none';
        infoBox.style.height = 'auto';
        void infoBox.offsetWidth;
        infoBox.classList.add('crt-opening');
        infoBox.style.display = '';
        this._positionInfoBox(infoBox);
        this._isOpen = true;

        const self = this;
        this._openHandler = function(e) {
            if (e.animationName !== 'crt-turn-on') return;
            infoBox.removeEventListener('animationend', self._openHandler);
            self._openHandler = null;
            infoBox.classList.remove('crt-opening');
            infoBox.classList.add('crt-open');
        };
        infoBox.addEventListener('animationend', this._openHandler);
    },

    
    assignBugProperties(bug, bugDataObj) {
        
        
        const rosterEntry = window.BugData.getBugDataForImage
            ? window.BugData.getBugDataForImage(bug.getAttribute('src') || '')
            : null;

        const name     = rosterEntry ? rosterEntry.name       : window.BugData.getRandomBugName();
        const backstory = rosterEntry ? rosterEntry.background : window.BugData.getRandomBugBackstory();
        const birthday  = rosterEntry ? rosterEntry.birthday   : window.BugData.generateRandomBirthday();

        
        const isShiny = Math.random() < 0.01;
        if (isShiny) {
            bug.classList.add("shiny");
        }
        bug.dataset.bugName = name;

        bug.dataset.bugStory = backstory;
        bug.dataset.bugBirthday = birthday;
        bug.style.cursor = "pointer";
        bug.style.pointerEvents = "auto"; 


        bug.addEventListener("click", (event) => {
            event.stopPropagation();
            
            if ((window.PanopticonBoss && window.PanopticonBoss.isActive()) ||
                (window.SisyphusBoss && window.SisyphusBoss.isActive())) return;
            const { settings } = window.BugSettings || { settings: { bugInfoEnabled: true } };
            if (settings.bugInfoEnabled) {
                this.showBugInfo(event, bug.dataset.bugName, backstory, birthday);
            }
        });
    },


    showMemorialWall(deletedBugs) {
        let memorialData = [];
        try { memorialData = JSON.parse(localStorage.getItem('28bugs_memorialData')) || []; } catch(_) {}

        const overlay = document.createElement("div");
        overlay.addEventListener('click', (event) => { if (event.target === overlay) overlay.remove(); });

        const memorialWindow = document.createElement("div");
        memorialWindow.classList.add("memorial-wall");
        memorialWindow.style.padding = "0px";
        memorialWindow.style.borderRadius = "10px";
        memorialWindow.style.maxWidth = "600px";
        memorialWindow.style.width = "90%";
        memorialWindow.style.height = "80%";
        memorialWindow.style.overflowY = "auto";
        memorialWindow.style.position = "relative";
        memorialWindow.style.scrollbarWidth = "thin";

        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        overlay.style.display = "flex";
        overlay.style.justifyContent = "center";
        overlay.style.alignItems = "center";
        overlay.style.zIndex = "2000";

        const headerContainer = document.createElement("div");
        headerContainer.classList.add("memorial-header");
        headerContainer.style.position = "sticky";
        headerContainer.style.top = "0px";
        headerContainer.style.left = "0px";
        headerContainer.style.right = "0px";
        headerContainer.style.padding = "5px 0px";
        headerContainer.style.marginBottom = "15px";
        headerContainer.style.zIndex = "10";
        headerContainer.style.width = "100%";

        const memorialTitle = document.createElement("h2");
        memorialTitle.textContent = "Bug Memorial Wall";
        memorialTitle.style.textAlign = "center";
        memorialTitle.style.marginBottom = "5px";
        memorialTitle.style.marginTop = "5px";
        memorialTitle.style.fontSize = "18px";
        headerContainer.appendChild(memorialTitle);

        const closeButton = document.createElement("button");
        closeButton.classList.add("memorial-close-btn");
        closeButton.textContent = "Close";
        closeButton.style.display = "block";
        closeButton.style.margin = "0px auto 5px";
        closeButton.style.padding = "5px 15px";
        closeButton.style.fontSize = "14px";
        closeButton.style.cursor = "pointer";
        closeButton.addEventListener("click", () => {
            overlay.remove();
        }, { once: true });
        headerContainer.appendChild(closeButton);

        memorialWindow.appendChild(headerContainer);

        const memorialList = document.createElement("div");
        memorialList.style.padding = "0px 30px 30px 30px";

        if (memorialData.length === 0) {
            const noDeaths = document.createElement("p");
            noDeaths.textContent = "No bugs have been deleted yet. They live in peace.";
            noDeaths.style.textAlign = "center";
            memorialList.appendChild(noDeaths);
        } else {
            memorialData.forEach(bug => {
                const entry = document.createElement("div");
                entry.classList.add("memorial-entry");
                entry.style.padding = "10px";
                entry.style.borderRadius = "5px";

                const strong = document.createElement('strong');
                strong.textContent = bug.name || 'Unknown';
                entry.appendChild(strong);
                entry.appendChild(document.createElement('br'));

                const storyDiv = document.createElement('div');
                storyDiv.textContent = bug.story || '';
                entry.appendChild(storyDiv);

                const born = document.createElement('em');
                born.textContent = 'Born: ' + (bug.birthday || 'Unknown');
                entry.appendChild(born);
                entry.appendChild(document.createElement('br'));

                const died = document.createElement('em');
                died.textContent = 'Died: ' + (bug.deathDate || 'Unknown');
                entry.appendChild(died);
                entry.appendChild(document.createElement('br'));

                const cause = document.createElement('span');
                cause.classList.add("memorial-cause");
                cause.textContent = 'Cause of death: ' + (bug.causeOfDeath || 'Unknown');
                entry.appendChild(cause);

                memorialList.appendChild(entry);
            });
        }

        memorialWindow.appendChild(memorialList);

        overlay.appendChild(memorialWindow);
        document.body.appendChild(overlay);
    },

    showFiends() {
        
    const modal = document.createElement("div");
    modal.className = "modal";
    
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('align-items', 'center', 'important');
    modal.style.setProperty('justify-content', 'center', 'important');
    modal.style.setProperty('position', 'fixed', 'important');
    modal.style.setProperty('top', '0', 'important');
    modal.style.setProperty('left', '0', 'important');
    modal.style.setProperty('right', '0', 'important');
    modal.style.setProperty('bottom', '0', 'important');
    modal.style.setProperty('z-index', '2000', 'important');

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    
    modalContent.style.setProperty('position', 'relative', 'important');
    modalContent.style.setProperty('top', 'auto', 'important');
    modalContent.style.setProperty('left', 'auto', 'important');
    modalContent.style.setProperty('transform', 'none', 'important');
    modalContent.style.setProperty('max-width', '600px', 'important');
    modalContent.style.setProperty('width', '90%', 'important');
    modalContent.style.setProperty('max-height', '80vh', 'important');
    modalContent.style.setProperty('overflow-y', 'auto', 'important');
    modalContent.style.background = 'linear-gradient(180deg, var(--panel-bg-start, rgba(255,255,255,0.98)) 0%, var(--panel-bg-mid, rgba(255,255,255,0.95)) 50%, var(--panel-bg-end, rgba(255,255,255,0.92)) 100%)';
    modalContent.style.color = 'var(--ink, #1b2838)';
    modalContent.style.border = '1px solid var(--panel-border, rgba(0,0,0,0.1))';

        const closeBtn = document.createElement("span");
        closeBtn.className = "close-button";
        closeBtn.innerHTML = "&times;";
        closeBtn.addEventListener("click", () => modal.remove());

        const title = document.createElement("h2");
        title.textContent = "Fiends";
        title.style.textAlign = "center";
        title.style.margin = "8px 0 12px";
        title.style.fontSize = "20px";
        title.style.color = 'var(--ink, #1b2838)';

        const grid = document.createElement("div");
        grid.style.display = "grid";
        grid.style.gridTemplateColumns = "1fr 1fr 1fr";
        grid.style.gap = "10px";
        grid.style.padding = "0 10px 10px";

        if (!window.BugData || !window.BugData.fiendsList || window.BugData.fiendsList.length === 0) {
            const noItems = document.createElement("p");
            noItems.textContent = "No fiends yet. Everyone loves this site!";
            noItems.style.textAlign = "center";
            noItems.style.color = 'var(--ink, #1b2838)';
            grid.appendChild(noItems);
        } else {
            window.BugData.fiendsList.forEach(person => {
                const entry = document.createElement("div");
                entry.style.padding = "10px";
                entry.style.border = '1px solid var(--panel-border, rgba(0,0,0,0.1))';
                entry.style.textAlign = "center";
                entry.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                entry.style.color = 'var(--ink, #1b2838)';
                entry.style.borderRadius = "8px";
                entry.textContent = person;
                grid.appendChild(entry);
            });
        }

        modalContent.appendChild(closeBtn);
        modalContent.appendChild(title);
        modalContent.appendChild(grid);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        
        modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
    },

    showFans() {
        
    const modal = document.createElement("div");
    modal.className = "modal";
    
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('align-items', 'center', 'important');
    modal.style.setProperty('justify-content', 'center', 'important');
    modal.style.setProperty('position', 'fixed', 'important');
    modal.style.setProperty('top', '0', 'important');
    modal.style.setProperty('left', '0', 'important');
    modal.style.setProperty('right', '0', 'important');
    modal.style.setProperty('bottom', '0', 'important');
    modal.style.setProperty('z-index', '2000', 'important');

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    modalContent.style.setProperty('position', 'relative', 'important');
    modalContent.style.setProperty('top', 'auto', 'important');
    modalContent.style.setProperty('left', 'auto', 'important');
    modalContent.style.setProperty('transform', 'none', 'important');
    modalContent.style.setProperty('max-width', '600px', 'important');
    modalContent.style.setProperty('width', '90%', 'important');
    modalContent.style.setProperty('max-height', '80vh', 'important');
    modalContent.style.setProperty('overflow-y', 'auto', 'important');
    modalContent.style.background = 'linear-gradient(180deg, var(--panel-bg-start, rgba(255,255,255,0.98)) 0%, var(--panel-bg-mid, rgba(255,255,255,0.95)) 50%, var(--panel-bg-end, rgba(255,255,255,0.92)) 100%)';
    modalContent.style.color = 'var(--ink, #1b2838)';
    modalContent.style.border = '1px solid var(--panel-border, rgba(0,0,0,0.1))';

        const closeBtn = document.createElement("span");
        closeBtn.className = "close-button";
        closeBtn.innerHTML = "&times;";
        closeBtn.addEventListener("click", () => modal.remove());

        const title = document.createElement("h2");
        title.textContent = "Fans";
        title.style.textAlign = "center";
        title.style.margin = "8px 0 12px";
        title.style.fontSize = "20px";
        title.style.color = 'var(--ink, #1b2838)';

        const grid = document.createElement("div");
        grid.style.display = "grid";
        grid.style.gridTemplateColumns = "1fr 1fr 1fr";
        grid.style.gap = "10px";
        grid.style.padding = "0 10px 10px";

        if (!window.BugData || !window.BugData.fansList || window.BugData.fansList.length === 0) {
            const noItems = document.createElement("p");
            noItems.textContent = "No fans yet. Be the first one!";
            noItems.style.textAlign = "center";
            noItems.style.color = 'var(--ink, #1b2838)';
            grid.appendChild(noItems);
        } else {
            window.BugData.fansList.forEach(person => {
                const entry = document.createElement("div");
                entry.style.padding = "10px";
                entry.style.border = '1px solid var(--panel-border, rgba(0,0,0,0.1))';
                entry.style.textAlign = "center";
                entry.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                entry.style.color = 'var(--ink, #1b2838)';
                entry.style.borderRadius = "8px";
                entry.textContent = person;
                grid.appendChild(entry);
            });
        }

        modalContent.appendChild(closeBtn);
        modalContent.appendChild(title);
        modalContent.appendChild(grid);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        
        modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
    },

    
	showFeedbackForm() {
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        overlay.style.display = "flex";
        overlay.style.justifyContent = "center";
        overlay.style.alignItems = "center";
        overlay.style.zIndex = "2000";
        
        const feedbackForm = document.createElement("div");
        feedbackForm.classList.add("feedback-form");
        feedbackForm.style.position = "relative";
        feedbackForm.style.width = "80%";
        feedbackForm.style.height = "80%";
        feedbackForm.style.overflowY = "auto";
        feedbackForm.style.margin = "0"; 
        feedbackForm.style.zIndex = "2001";
        feedbackForm.style.top = "auto"; 
        feedbackForm.style.left = "auto"; 
        feedbackForm.style.transform = "none"; 

        const feedbackTitle = document.createElement("h2");
        feedbackTitle.textContent = "Feedback Form";
        feedbackTitle.style.textAlign = "center";
        feedbackForm.appendChild(feedbackTitle);


        const feedbackFormElement = document.createElement("form");
        feedbackFormElement.id = "bug-feedback-form";
        

        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.id = "feedback-name";
        nameInput.name = "name";
        nameInput.placeholder = "Your Name";
        nameInput.style.width = "100%";
        nameInput.style.marginBottom = "10px";
        feedbackFormElement.appendChild(nameInput);
        

        const feedbackTextarea = document.createElement("textarea");
        feedbackTextarea.id = "feedback-message";
        feedbackTextarea.name = "feedback";
        feedbackTextarea.placeholder = "Your Feedback";
        feedbackTextarea.style.width = "100%";
        feedbackTextarea.style.height = "50%"; 
        feedbackTextarea.style.marginBottom = "10px";
        feedbackFormElement.appendChild(feedbackTextarea);

        
        const emailInput = document.createElement("input");
        emailInput.type = "email";
        emailInput.id = "feedback-email";
        emailInput.name = "email";
        emailInput.placeholder = "Your Email (optional)";
        emailInput.style.width = "100%";
        emailInput.style.marginBottom = "10px";
        feedbackFormElement.appendChild(emailInput);


        const statusMessage = document.createElement("div");
        statusMessage.id = "feedback-status";
        statusMessage.style.display = "none";
        statusMessage.style.padding = "10px";
        statusMessage.style.marginTop = "10px";
        statusMessage.style.textAlign = "center";
        statusMessage.style.borderRadius = "5px";
        feedbackFormElement.appendChild(statusMessage);

        const submitButton = document.createElement("button");
        submitButton.type = "submit";
        submitButton.textContent = "Submit";
        submitButton.classList.add("feedback-submit-btn");
        submitButton.style.marginTop = "10px";
        submitButton.style.padding = "10px 20px";
        submitButton.style.fontSize = "16px";
        feedbackFormElement.appendChild(submitButton);

        const closeButton = document.createElement("button");
        closeButton.type = "button"; 
        closeButton.textContent = "Close";
        closeButton.classList.add("feedback-close-btn");
        closeButton.style.marginTop = "10px";
        closeButton.style.marginLeft = "10px";
        closeButton.style.padding = "10px 20px";
        closeButton.style.fontSize = "16px";
        closeButton.addEventListener("click", () => {
            overlay.remove();
        }, { once: true });
        feedbackFormElement.appendChild(closeButton);

        
        const subtext = document.createElement("p");
        subtext.textContent = "By submitting feedback, you agree to my terms and conditions that I WILL put your first name in the fiends list if your feedback doesn't include the word awesome. Also if your feedback is of value or super awesome I will say maybe sometimes thank you (that is what the email is for) or I will sign you up for LDS newsletters if you're mean.";
        subtext.style.fontSize = "12px";
        subtext.style.marginTop = "10px";
        feedbackFormElement.appendChild(subtext);

        
        feedbackFormElement.addEventListener("submit", async (event) => {
            event.preventDefault();
            
            
            submitButton.disabled = true;
            submitButton.textContent = "Submitting...";
            
            
            statusMessage.style.display = "none";
            
            
            const nameEl = feedbackFormElement.querySelector('#feedback-name, input[name="name"]');
            const messageEl = feedbackFormElement.querySelector('#feedback-message, textarea[name="message"], textarea[name="feedback"]');
            const emailEl = feedbackFormElement.querySelector('#feedback-email, input[name="email"]');
            

            const formData = {
                name: ((nameEl && nameEl.value) || "Anonymous").trim() || "Anonymous",
                message: ((messageEl && messageEl.value) || "").trim(),
                email: ((emailEl && emailEl.value) || "").trim(),
                browserInfo: navigator.userAgent
            };
            
            
            if (!formData.message) {
                statusMessage.textContent = "Please enter your feedback message.";
                statusMessage.style.display = "block";
                statusMessage.style.backgroundColor = "#ffdddd";
                submitButton.disabled = false;
                submitButton.textContent = "Submit";
                return;
            }
            
            try {
                const response = await fetch("https://api.28awesomebugs.org/api/feedback", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    try { localStorage.setItem('28bugs_simFeedbackSent', 'true'); } catch {}
                    if (typeof AccountSync !== 'undefined' && AccountSync.touchLocalSave) {
                        AccountSync.touchLocalSave();
                    }
                    
                    statusMessage.textContent = "Thank you for your feedback!";
                    statusMessage.style.backgroundColor = "#ddffdd";
                    statusMessage.style.display = "block";
                    
                    
                    feedbackFormElement.reset();
                    
                    
                    setTimeout(() => {
                        overlay.remove();
                    }, 2000);
                } else {
                    
                    statusMessage.textContent = result.error || "An error occurred. Please try again.";
                    statusMessage.style.backgroundColor = "#ffdddd";
                    statusMessage.style.display = "block";
                    submitButton.disabled = false;
                    submitButton.textContent = "Submit";
                }
            } catch (error) {
                console.error("Feedback submission error details:", error);
                statusMessage.textContent = "Connection error. Please try again.";
                statusMessage.style.backgroundColor = "#ffdddd";
                statusMessage.style.display = "block";
                submitButton.disabled = false;
                submitButton.textContent = "Submit";
            }
        });

        feedbackForm.appendChild(feedbackFormElement);
        overlay.appendChild(feedbackForm);
        document.body.appendChild(overlay);
        
        
        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) {
                overlay.remove();
            }
        });
    },

};


window.BugUI = BugUI;


window.BugUI.showFans = function() {
    const fansModal = document.createElement("div");
    fansModal.className = "modal";
    fansModal.style.display = "block";
    
    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    modalContent.style.background = 'linear-gradient(180deg, var(--panel-bg-start, rgba(255,255,255,0.98)) 0%, var(--panel-bg-mid, rgba(255,255,255,0.95)) 50%, var(--panel-bg-end, rgba(255,255,255,0.92)) 100%)';
    modalContent.style.color = 'var(--ink, #1b2838)';
    modalContent.style.border = '1px solid var(--panel-border, rgba(0,0,0,0.1))';
    
    const closeButton = document.createElement("span");
    closeButton.className = "close-button";
    closeButton.innerHTML = "&times;";
    closeButton.addEventListener("click", () => fansModal.remove());
    
    const modalTitle = document.createElement("h2");
    modalTitle.textContent = "Fans";
    modalTitle.style.color = 'var(--ink, #1b2838)';
    
    modalContent.appendChild(closeButton);
    modalContent.appendChild(modalTitle);
    
    
    let fans = [];
    try { fans = JSON.parse(localStorage.getItem('28bugs_supporters') || '[]') || []; } catch(_) {}
    
    if (fans.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.textContent = "No fans yet. Be the first one!";
        emptyMessage.style.textAlign = "center";
        emptyMessage.style.padding = "20px";
        emptyMessage.style.color = 'var(--ink, #1b2838)';
        modalContent.appendChild(emptyMessage);
    } else {
        const fansList = document.createElement("div");
        fansList.className = "fans-list";
        
        fans.forEach(fan => {
            const fanItem = document.createElement("div");
            fanItem.className = "fan-item";
            fanItem.style.padding = "10px";
            fanItem.style.border = '1px solid var(--panel-border, rgba(0,0,0,0.1))';
            fanItem.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            fanItem.style.borderRadius = "8px";
            fanItem.style.margin = "10px 0";
            
            const fanName = document.createElement("h3");
            fanName.textContent = fan.name;
            fanName.style.color = 'var(--ink, #1b2838)';
            fanName.style.margin = "0 0 5px 0";
            
            const fanMessage = document.createElement("p");
            fanMessage.className = "fan-message";
            fanMessage.textContent = fan.message || "I love this website!";
            fanMessage.style.color = 'var(--ink-muted, #6b7280)';
            fanMessage.style.margin = "0";
            
            fanItem.appendChild(fanName);
            fanItem.appendChild(fanMessage);
            fansList.appendChild(fanItem);
        });
        
        modalContent.appendChild(fansList);
    }
    
    fansModal.appendChild(modalContent);
    document.body.appendChild(fansModal);
    
    
    window.addEventListener("click", function(event) {
        if (event.target === fansModal) {
            fansModal.remove();
        }
    });
};


window.BugUI.showFiends = function() {
    const fiendsModal = document.createElement("div");
    fiendsModal.className = "modal";
    fiendsModal.style.display = "block";
    
    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    
    const closeButton = document.createElement("span");
    closeButton.className = "close-button";
    closeButton.innerHTML = "&times;";
    closeButton.addEventListener("click", () => fiendsModal.remove());
    
    const modalTitle = document.createElement("h2");
    modalTitle.textContent = "Fiends";
    
    modalContent.appendChild(closeButton);
    modalContent.appendChild(modalTitle);
    
    
    let fiends = [];
    try { fiends = JSON.parse(localStorage.getItem('28bugs_haters') || '[]') || []; } catch(_) {}
    
    if (fiends.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.textContent = "No fiends yet. Everyone loves this site!";
        emptyMessage.style.textAlign = "center";
        emptyMessage.style.padding = "20px";
        modalContent.appendChild(emptyMessage);
    } else {
        const fiendsList = document.createElement("div");
        fiendsList.className = "fiends-list";
        
        fiends.forEach(fiend => {
            const fiendItem = document.createElement("div");
            fiendItem.className = "fiend-item";
            
            const fiendName = document.createElement("h3");
            fiendName.textContent = fiend.name;
            
            const fiendMessage = document.createElement("p");
            fiendMessage.className = "fiend-message";
            fiendMessage.textContent = fiend.message || "I hate this website!";
            
            fiendItem.appendChild(fiendName);
            fiendItem.appendChild(fiendMessage);
            fiendsList.appendChild(fiendItem);
        });
        
        modalContent.appendChild(fiendsList);
    }
    
    fiendsModal.appendChild(modalContent);
    document.body.appendChild(fiendsModal);
    
    
    window.addEventListener("click", function(event) {
        if (event.target === fiendsModal) {
            fiendsModal.remove();
        }
    });
};


document.addEventListener('fansFiendsUpdated', function() {
    
    const openModals = document.querySelectorAll('.modal');
    openModals.forEach(modal => {
        const title = modal.querySelector('h2');
        if (title) {
            if (title.textContent === "Fans") {
                modal.remove();
                window.BugUI.showFans();
            } else if (title.textContent === "Fiends") {
                modal.remove();
                window.BugUI.showFiends();
            }
        }
    });
});


window.BugUI.showFiends = function() {
    try {
        
        if (window.BugData && typeof window.BugData.syncFromLocalStorage === 'function') {
            window.BugData.syncFromLocalStorage();
        }

        
        const creditsModal = document.createElement("div");
        creditsModal.className = "modal";
        creditsModal.id = "fiends-modal";
    creditsModal.style.setProperty('position', 'fixed', 'important');
    creditsModal.style.setProperty('top', '0', 'important');
    creditsModal.style.setProperty('left', '0', 'important');
    creditsModal.style.setProperty('right', '0', 'important');
    creditsModal.style.setProperty('bottom', '0', 'important');
    creditsModal.style.setProperty('width', '100%', 'important');
    creditsModal.style.setProperty('height', '100%', 'important');
    creditsModal.style.setProperty('background-color', 'rgba(0, 0, 0, 0.7)', 'important');
    creditsModal.style.setProperty('display', 'flex', 'important');
    creditsModal.style.setProperty('justify-content', 'center', 'important');
    creditsModal.style.setProperty('align-items', 'center', 'important');
    creditsModal.style.setProperty('z-index', '2000', 'important');

        const modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    modalContent.style.setProperty('position', 'relative', 'important');
    modalContent.style.setProperty('top', 'auto', 'important');
    modalContent.style.setProperty('left', 'auto', 'important');
    modalContent.style.setProperty('transform', 'none', 'important');
    modalContent.style.setProperty('background-color', '#fff', 'important');
    modalContent.style.setProperty('padding', '0', 'important');
    modalContent.style.setProperty('border-radius', '10px', 'important');
    modalContent.style.setProperty('max-width', '600px', 'important');
    modalContent.style.setProperty('width', '90%', 'important');
    modalContent.style.setProperty('max-height', '80vh', 'important');
    modalContent.style.setProperty('overflow-y', 'auto', 'important');
    modalContent.style.setProperty('box-shadow', '0 4px 20px rgba(0, 0, 0, 0.3)', 'important');
        
        
        const headerContainer = document.createElement("div");
        headerContainer.style.position = "sticky";
        headerContainer.style.top = "0";
        headerContainer.style.left = "0";
        headerContainer.style.right = "0";
        headerContainer.style.backgroundColor = 'var(--panel-bg-start, rgba(255,255,255,0.98))';
        headerContainer.style.padding = "20px 0"; 
        headerContainer.style.marginBottom = "20px";
        headerContainer.style.borderBottom = '1px solid var(--panel-border, rgba(0,0,0,0.1))';
        headerContainer.style.zIndex = "10";
        headerContainer.style.width = "100%";
        headerContainer.style.textAlign = "center";
        
        const modalTitle = document.createElement("h2");
        modalTitle.textContent = "Fiends";
        modalTitle.style.textAlign = "center";
        modalTitle.style.margin = "0";
        modalTitle.style.padding = "0 20px";
        modalTitle.style.fontSize = "24px";
        modalTitle.style.fontWeight = "bold";
        modalTitle.style.color = 'var(--ink, #1b2838)';
        headerContainer.appendChild(modalTitle);
        
        const closeButton = document.createElement("button");
        closeButton.textContent = "Close";
        closeButton.style.display = "block";
        closeButton.style.margin = "10px auto 0";
        closeButton.style.padding = "8px 20px";
        closeButton.style.backgroundColor = 'var(--accent, #64b5f6)';
        closeButton.style.border = '1px solid var(--accent-hover, #42a5f5)';
        closeButton.style.color = '#fff';
        closeButton.style.borderRadius = "5px";
        closeButton.style.cursor = "pointer";
        closeButton.style.fontSize = "14px";
        closeButton.addEventListener("click", () => creditsModal.remove());
        headerContainer.appendChild(closeButton);
        
        
        modalContent.appendChild(headerContainer);
        
        
        const contentArea = document.createElement("div");
        contentArea.style.padding = "0 30px 30px 30px";
        
        
        const fiendsContainer = document.createElement("div");
        fiendsContainer.className = "fiends-list";
        fiendsContainer.style.display = "grid";
        fiendsContainer.style.gridTemplateColumns = "repeat(3, 1fr)";
        fiendsContainer.style.gap = "10px";
        
        if (window.BugData && window.BugData.fiendsList && window.BugData.fiendsList.length > 0) {
            window.BugData.fiendsList.forEach(person => {
                const fiendItem = document.createElement("div");
                fiendItem.className = "fiend-item";
                fiendItem.style.padding = "15px";
                fiendItem.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                fiendItem.style.borderRadius = "8px";
                fiendItem.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)";
                fiendItem.style.border = '1px solid var(--panel-border, rgba(0,0,0,0.1))';
                fiendItem.style.textAlign = "center";
                
                const fiendName = document.createElement("h3");
                fiendName.textContent = person;
                fiendName.style.margin = "0";
                fiendName.style.fontSize = "18px";
                fiendName.style.fontWeight = "bold";
                fiendName.style.color = 'var(--ink, #1b2838)';
                
                fiendItem.appendChild(fiendName);
                fiendsContainer.appendChild(fiendItem);
            });
        } else {
            const emptyMessage = document.createElement("p");
            emptyMessage.textContent = "No fiends yet. Everyone loves this site!";
            emptyMessage.style.textAlign = "center";
            emptyMessage.style.padding = "20px";
            emptyMessage.style.color = 'var(--ink-muted, #6b7280)';
            emptyMessage.style.fontStyle = "italic";
            emptyMessage.style.gridColumn = "1 / -1"; 
            fiendsContainer.appendChild(emptyMessage);
        }
        
        contentArea.appendChild(fiendsContainer);
        modalContent.appendChild(contentArea);
        creditsModal.appendChild(modalContent);
        document.body.appendChild(creditsModal);
        
        
        creditsModal.addEventListener("click", function(event) {
            if (event.target === creditsModal) {
                creditsModal.remove();
            }
        });
        
    } catch (error) {
        console.error("Error in showFiends function:", error);
    }
};


window.BugUI.showFans = function() {
    try {
        
        if (window.BugData && typeof window.BugData.syncFromLocalStorage === 'function') {
            window.BugData.syncFromLocalStorage();
        }

        
        const fansModal = document.createElement("div");
        fansModal.className = "modal";
        fansModal.id = "fans-modal";
    fansModal.style.setProperty('position', 'fixed', 'important');
    fansModal.style.setProperty('top', '0', 'important');
    fansModal.style.setProperty('left', '0', 'important');
    fansModal.style.setProperty('right', '0', 'important');
    fansModal.style.setProperty('bottom', '0', 'important');
    fansModal.style.setProperty('width', '100%', 'important');
    fansModal.style.setProperty('height', '100%', 'important');
    fansModal.style.setProperty('background-color', 'rgba(0, 0, 0, 0.7)', 'important');
    fansModal.style.setProperty('display', 'flex', 'important');
    fansModal.style.setProperty('justify-content', 'center', 'important');
    fansModal.style.setProperty('align-items', 'center', 'important');
    fansModal.style.setProperty('z-index', '2000', 'important');
        
        const modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    modalContent.style.setProperty('position', 'relative', 'important');
    modalContent.style.setProperty('top', 'auto', 'important');
    modalContent.style.setProperty('left', 'auto', 'important');
    modalContent.style.setProperty('transform', 'none', 'important');
    modalContent.style.setProperty('background-color', '#fff', 'important');
    modalContent.style.setProperty('padding', '0', 'important');
    modalContent.style.setProperty('border-radius', '10px', 'important');
    modalContent.style.setProperty('max-width', '600px', 'important');
    modalContent.style.setProperty('width', '90%', 'important');
    modalContent.style.setProperty('max-height', '80vh', 'important');
    modalContent.style.setProperty('overflow-y', 'auto', 'important');
    modalContent.style.setProperty('box-shadow', '0 4px 20px rgba(0, 0, 0, 0.3)', 'important');
        
        
        const headerContainer = document.createElement("div");
        headerContainer.style.position = "sticky";
        headerContainer.style.top = "0";
        headerContainer.style.left = "0";
        headerContainer.style.right = "0";
        headerContainer.style.backgroundColor = 'var(--panel-bg-start, rgba(255,255,255,0.98))';
        headerContainer.style.padding = "20px 0"; 
        headerContainer.style.marginBottom = "20px";
        headerContainer.style.borderBottom = '1px solid var(--panel-border, rgba(0,0,0,0.1))';
        headerContainer.style.zIndex = "10";
        headerContainer.style.width = "100%";
        headerContainer.style.textAlign = "center";
        
        const modalTitle = document.createElement("h2");
        modalTitle.textContent = "Fans";
        modalTitle.style.color = 'var(--ink, #1b2838)';
        modalTitle.style.textAlign = "center";
        modalTitle.style.margin = "0";
        modalTitle.style.padding = "0 20px";
        modalTitle.style.fontSize = "24px";
        modalTitle.style.fontWeight = "bold";
        headerContainer.appendChild(modalTitle);
        
        const closeButton = document.createElement("button");
        closeButton.textContent = "Close";
        closeButton.style.display = "block";
        closeButton.style.margin = "10px auto 0";
        closeButton.style.padding = "8px 20px";
        closeButton.style.backgroundColor = 'var(--accent, #64b5f6)';
        closeButton.style.border = '1px solid var(--accent-hover, #42a5f5)';
        closeButton.style.color = '#fff';
        closeButton.style.borderRadius = "5px";
        closeButton.style.cursor = "pointer";
        closeButton.style.fontSize = "14px";
        closeButton.addEventListener("click", () => fansModal.remove());
        headerContainer.appendChild(closeButton);
        
        
        modalContent.appendChild(headerContainer);
        
        
        const contentArea = document.createElement("div");
        contentArea.style.padding = "0 30px 30px 30px";
        
        
        const fansContainer = document.createElement("div");
        fansContainer.className = "fans-list";
        fansContainer.style.display = "grid";
        fansContainer.style.gridTemplateColumns = "repeat(3, 1fr)";
        fansContainer.style.gap = "10px";
        
        if (window.BugData && window.BugData.fansList && window.BugData.fansList.length > 0) {
            window.BugData.fansList.forEach(person => {
                const fanItem = document.createElement("div");
                fanItem.className = "fan-item";
                fanItem.style.padding = "15px";
                fanItem.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                fanItem.style.borderRadius = "8px";
                fanItem.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)";
                fanItem.style.border = '1px solid var(--panel-border, rgba(0,0,0,0.1))';
                fanItem.style.textAlign = "center";
                
                const fanName = document.createElement("h3");
                fanName.textContent = person;
                fanName.style.margin = "0";
                fanName.style.fontSize = "18px";
                fanName.style.fontWeight = "bold";
                fanName.style.color = 'var(--ink, #1b2838)';
                
                fanItem.appendChild(fanName);
                fansContainer.appendChild(fanItem);
            });
        } else {
            const emptyMessage = document.createElement("p");
            emptyMessage.textContent = "No fans yet. Be the first one!";
            emptyMessage.style.textAlign = "center";
            emptyMessage.style.padding = "20px";
            emptyMessage.style.color = 'var(--ink-muted, #6b7280)';
            emptyMessage.style.fontStyle = "italic";
            emptyMessage.style.gridColumn = "1 / -1"; 
            fansContainer.appendChild(emptyMessage);
        }
        
        contentArea.appendChild(fansContainer);
        modalContent.appendChild(contentArea);
        fansModal.appendChild(modalContent);
        document.body.appendChild(fansModal);
        
        
        fansModal.addEventListener("click", function(event) {
            if (event.target === fansModal) {
                fansModal.remove();
            }
        });
        
    } catch (error) {
        console.error("Error in showFans function:", error);
    }
};


document.addEventListener('DOMContentLoaded', function() {
});


if (!window.showFeedbackModal) {
    window.showFeedbackModal = function() {
        try {
            if (window.BugUI && typeof window.BugUI.showFeedbackForm === 'function') {
                window.BugUI.showFeedbackForm();
            } else {
                console.warn('[bug-ui.js] BugUI.showFeedbackForm not available, trying fallback to feedback.js showFeedbackModal');
                if (typeof window.showFeedbackModal === 'function') {
                    
                    window.showFeedbackModal();
                }
            }
        } catch (e) {
            console.error('[bug-ui.js] Error in alias showFeedbackModal:', e);
        }
    };
}
