(function () {
  'use strict';

  function initialize() {
    var container = document.querySelector('.bugs-container');
    var box = container && container._bugsBox;
    if (!box) return;

    var freezeButton = document.getElementById('toggle-freeze');
    var awesomeModeButton = document.getElementById('awesome-mode');
    var destroyButton = document.getElementById('destroy-button');
    var createButton = document.getElementById('create-button');
    var hatButton = document.getElementById('hat-button');
    var dragModeButton = document.getElementById('drag-mode-button');
    var infoModeButton = document.getElementById('info-mode-button');
    var animationRunning = true;
    var awesomeModeEnabled = false;
    var awesomeInterval = null;
    var hatsEnabled = false;
    var initialBugCount = box.bugs.length;
    var dragModeEnabled = !window.BUGS_CONFIG || window.BUGS_CONFIG.drag !== false;
    var infoModeEnabled = !window.BUGS_CONFIG || window.BUGS_CONFIG.clickInfo !== false;
    var labels = window.SIMULATION_LABELS || {};
    var label = function (key, fallback) { return labels[key] || fallback; };

    function updateCountButtons() {
      createButton.disabled = box.bugs.length >= initialBugCount;
      destroyButton.disabled = box.bugs.length === 0;
    }
    updateCountButtons();

    freezeButton.addEventListener('click', function (event) {
      event.stopPropagation();
      animationRunning = !animationRunning;
      freezeButton.textContent = animationRunning ? label('freeze', 'Freeze Bugs') : label('unfreeze', 'Unfreeze Bugs');
      if (animationRunning) box.unfreeze();
      else box.freeze();
    });

    awesomeModeButton.addEventListener('click', function (event) {
      event.stopPropagation();
      awesomeModeEnabled = !awesomeModeEnabled;
      awesomeModeButton.textContent = awesomeModeEnabled ? label('boring', 'Boring Mode') : label('awesome', 'Awesome Mode');
      if (awesomeModeEnabled) {
        awesomeInterval = setInterval(function () {
          for (var i = 0; i < box.bugs.length; i++) {
            box.bugs[i].dx = (Math.random() - 0.5) * 20;
            box.bugs[i].dy = (Math.random() - 0.5) * 20;
          }
        }, 50);
      } else {
        clearInterval(awesomeInterval);
        awesomeInterval = null;
        for (var i = 0; i < box.bugs.length; i++) {
          box.bugs[i].dx = (Math.random() - 0.5) * 5;
          box.bugs[i].dy = (Math.random() - 0.5) * 5;
        }
      }
    });

    destroyButton.addEventListener('click', function (event) {
      event.stopPropagation();
      if (box.bugs.length) {
        box.removeBug(Math.floor(Math.random() * box.bugs.length));
        updateCountButtons();
      }
    });

    createButton.addEventListener('click', function (event) {
      event.stopPropagation();
      if (box.bugs.length < initialBugCount) {
        box.addBug();
        updateCountButtons();
      }
    });

    hatButton.addEventListener('click', function (event) {
      event.stopPropagation();
      hatsEnabled = !hatsEnabled;
      box.setHatsEnabled(hatsEnabled);
      hatButton.textContent = hatsEnabled ? label('hatsOff', 'Hats Off') : label('hatsOn', 'Hats On');
    });

    dragModeButton.addEventListener('click', function (event) {
      event.stopPropagation();
      dragModeEnabled = !dragModeEnabled;
      box.setDragEnabled(dragModeEnabled);
      dragModeButton.textContent = dragModeEnabled ? label('dragOn', 'Drag Mode On') : label('dragOff', 'Drag Mode Off');
    });

    infoModeButton.addEventListener('click', function (event) {
      event.stopPropagation();
      infoModeEnabled = !infoModeEnabled;
      box.setInfoEnabled(infoModeEnabled);
      infoModeButton.textContent = infoModeEnabled ? label('infoOn', 'Info On') : label('infoOff', 'Info Off');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();