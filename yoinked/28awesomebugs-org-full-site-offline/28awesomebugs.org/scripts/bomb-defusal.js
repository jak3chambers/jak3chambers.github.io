




(function() {
  'use strict';

  
  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(a) { return a[rand(0, a.length - 1)]; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = rand(0, i); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  }

  
  var SEG_MAP = {
    0:'abcdef', 1:'bc', 2:'abdeg', 3:'abcdg',
    4:'bcfg', 5:'acdfg', 6:'acdefg', 7:'abc',
    8:'abcdefg', 9:'abcdfg'
  };
  var SEG_LETTERS = { H:'bcefg', A:'abcefg' };

  function setDigitLetter(digitEl, ch) {
    var segs = SEG_LETTERS[ch] || '';
    var all = digitEl.querySelectorAll('.lcd-seg');
    for (var i = 0; i < all.length; i++) {
      var letter = all[i].className.match(/seg-([a-g])/);
      if (letter) all[i].classList.toggle('on', segs.indexOf(letter[1]) >= 0);
    }
  }

  function clearDigit(digitEl) {
    var all = digitEl.querySelectorAll('.lcd-seg');
    for (var i = 0; i < all.length; i++) all[i].classList.remove('on');
  }

  function createDigit() {
    var d = el('div','lcd-digit');
    'abcdefg'.split('').forEach(function(s) {
      var seg = el('div','lcd-seg ' + (['a','g','d'].indexOf(s) >= 0 ? 'h' : 'v') + ' seg-' + s);
      d.appendChild(seg);
    });
    return d;
  }

  function setDigitValue(digitEl, n) {
    var segs = SEG_MAP[n] || '';
    var all = digitEl.querySelectorAll('.lcd-seg');
    for (var i = 0; i < all.length; i++) {
      var letter = all[i].className.match(/seg-([a-g])/);
      if (letter) all[i].classList.toggle('on', segs.indexOf(letter[1]) >= 0);
    }
  }

  function createColon() {
    var c = el('div','lcd-colon');
    c.appendChild(el('div','lcd-dot on'));
    c.appendChild(el('div','lcd-dot on'));
    return c;
  }

  
  function createBombSVG() {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 100 130');
    svg.setAttribute('width', '56');
    svg.setAttribute('height', '73');
    svg.innerHTML =
      '<circle cx="50" cy="78" r="38" fill="#1a1a1a" stroke="#444" stroke-width="2"/>' +
      '<ellipse cx="40" cy="64" rx="14" ry="9" fill="rgba(255,255,255,0.04)"/>' +
      '<rect x="42" y="36" width="16" height="10" rx="2" fill="#555"/>' +
      '<path d="M50 36 Q54 22 64 18 Q72 15 68 6" stroke="#8B7355" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<circle cx="68" cy="6" r="4" fill="#f40">' +
        '<animate attributeName="r" values="3;6;3" dur="0.4s" repeatCount="indefinite"/>' +
        '<animate attributeName="opacity" values="1;0.4;1" dur="0.4s" repeatCount="indefinite"/>' +
      '</circle>' +
      '<circle cx="68" cy="6" r="9" fill="none" stroke="#f80" stroke-width="1" opacity="0.3">' +
        '<animate attributeName="r" values="6;11;6" dur="0.5s" repeatCount="indefinite"/>' +
        '<animate attributeName="opacity" values="0.3;0.05;0.3" dur="0.5s" repeatCount="indefinite"/>' +
      '</circle>';
    return svg;
  }


  
  
  
  var DIFF_LABELS = ['EASY', 'MEDIUM', 'HARD', 'EXPERT', 'INSANE'];
  var DIFF_COLORS = ['#4a4', '#da0', '#f44', '#f0f', '#f22'];

  function BombGame(moduleKey, rounds, totalTime) {
    this.moduleKey = moduleKey;
    var mod = MODULES[moduleKey];
    if (mod && mod.counts) {
      this.rounds = mod.counts.length;
      this.totalProblems = 0;
      for (var r = 0; r < mod.counts.length; r++) this.totalProblems += mod.counts[r];
    } else {
      this.rounds = rounds || 5;
      this.totalProblems = 0;
      for (var r = 0; r < this.rounds; r++) this.totalProblems += r >= 2 ? 2 : 1;
    }
    this.totalTime = totalTime || 70;
    this.timeLeft = this.totalTime;
    this.strikes = 0;
    this.maxStrikes = 3;
    this.currentRound = 0;
    this.problemsDone = 0;
    this.overlay = null;
    this.modal = null;
    this.timerDigits = [];
    this.colonDots = [];
    this.strikeDots = [];
    this.moduleArea = null;
    this.roundIndicators = [];
    this.interval = null;
    this.colonOn = true;
    this.running = false;
    this.onComplete = null;
    this.music = null;
  }

  BombGame.prototype.start = function() {
    this._buildUI();
    this._updateTimer();
    this._showBriefing();
  };

  BombGame.prototype._startMusic = function() {
    try {
      var track = 'src/bomb' + rand(1, 4) + '.mp3';
      this.music = new Audio(track);
      if (window.BugSFX) window.BugSFX.markAsMusic(this.music);
      this.music.loop = true;
      this.music.volume = 0.4;
      this.music.play().catch(function() {});
    } catch(e) {}
  };

  BombGame.prototype._stopMusic = function() {
    if (this.music) {
      this.music.pause();
      this.music.currentTime = 0;
      this.music = null;
    }
  };

  BombGame.prototype._startTimer = function() {
    if (this.interval) return;
    this.running = true;
    this._startMusic();
    var self = this;
    this.interval = setInterval(function() {
      if (!self.running) return;
      self.timeLeft = Math.max(0, self.timeLeft - 0.05);
      self.colonOn = !self.colonOn;
      self._updateTimer();
      if (self.timeLeft <= 0) {
        self._endGame(false, "TIME'S UP!");
      }
    }, 50);
  };

  
  BombGame.prototype._showBriefing = function() {
    this.moduleArea.innerHTML = '';
    var mod = MODULES[this.moduleKey];
    if (!mod) return;
    var wrap = el('div','briefing');

    var title = el('div','briefing-title','\u26A0 PIPE BOMB ARMED \u26A0');
    wrap.appendChild(title);

    var sub = el('div','briefing-sub',
      'Looks like 29awesomebugs sent you a gift! The only way to defuse it is through this little module thing. Idk much about this but my team of scientists do! They\'ll teach you I think. Solve each problem correctly before time runs out. ' +
      '3 wrong answers and the bomb detonates. Good luck! Make your bugs proud.');
    wrap.appendChild(sub);

    
    if (mod.concept) {
      var concept = el('div','briefing-concept');
      concept.innerHTML = mod.concept;
      wrap.appendChild(concept);
    }

    var self = this;
    var btn = el('button','briefing-start-btn','ARM BOMB & START');
    btn.onclick = function() {
      self._startTimer();
      self._startRound(0);
    };
    wrap.appendChild(btn);

    this.moduleArea.appendChild(wrap);
  };

  
  BombGame.prototype._buildUI = function() {
    this.overlay = el('div','bomb-overlay');

    
    var pipeRack = el('div','bomb-pipe-rack');
    var tapePerPipe = [25, 55, 82]; 
    for (var p = 0; p < 3; p++) {
      var unit = el('div','bomb-pipe-unit');
      var capL = el('div','bomb-pipe-cap left');
      var pipe = el('div','bomb-pipe');
      var capR = el('div','bomb-pipe-cap right');
      for (var t = 0; t < tapePerPipe.length; t++) {
        var tape = el('div','bomb-tape');
        tape.style.left = tapePerPipe[t] + '%';
        pipe.appendChild(tape);
      }
      unit.appendChild(capL);
      unit.appendChild(pipe);
      unit.appendChild(capR);
      pipeRack.appendChild(unit);
    }
    
    var wrapPositions = [100, 240, 380];
    for (var tw = 0; tw < wrapPositions.length; tw++) {
      var tapeWrap = el('div','bomb-tape-wrap');
      tapeWrap.style.left = (wrapPositions[tw] + 16) + 'px'; 
      pipeRack.appendChild(tapeWrap);
    }
    this.overlay.appendChild(pipeRack);
    this.pipeRack = pipeRack;

    this.modal = el('div','bomb-modal');
    this.overlay.appendChild(this.modal);

    
    var header = el('div','bomb-header');

    var timerWrap = el('div','bomb-timer-wrap');
    
    for (var i = 0; i < 8; i++) {
      var d = createDigit();
      this.timerDigits.push(d);
      timerWrap.appendChild(d);
      if (i === 1 || i === 3) {
        
        var colon = createColon();
        var dots = colon.querySelectorAll('.lcd-dot');
        for (var cd = 0; cd < dots.length; cd++) this.colonDots.push(dots[cd]);
        timerWrap.appendChild(colon);
      }
      if (i === 5) {
        
        var dec = el('div','lcd-decimal');
        dec.appendChild(el('div','lcd-dot'));
        timerWrap.appendChild(dec);
      }
    }
    header.appendChild(timerWrap);

    var strikes = el('div','bomb-strikes');
    for (var s = 0; s < this.maxStrikes; s++) {
      var mark = el('div','strike-mark','X');
      this.strikeDots.push(mark);
      strikes.appendChild(mark);
    }
    header.appendChild(strikes);
    this.modal.appendChild(header);

    
    this.moduleArea = el('div','module-area');
    this.modal.appendChild(this.moduleArea);

    document.body.appendChild(this.overlay);
  };

  BombGame.prototype._updateTimer = function() {
    var t = this.timeLeft;
    var hh = Math.floor(t / 3600);
    var mm = Math.floor((t % 3600) / 60);
    var ss = Math.floor(t % 60);
    var cs = Math.floor((t * 100) % 100);
    var digits = [Math.floor(hh/10), hh%10, Math.floor(mm/10), mm%10, Math.floor(ss/10), ss%10, Math.floor(cs/10), cs%10];
    for (var i = 0; i < 8; i++) setDigitValue(this.timerDigits[i], digits[i]);
    for (var c = 0; c < this.colonDots.length; c++) {
      this.colonDots[c].classList.toggle('on', this.colonOn);
    }
  };

  BombGame.prototype._updateRoundBar = function() {
    for (var i = 0; i < this.roundIndicators.length; i++) {
      this.roundIndicators[i].classList.remove('active','done');
      if (i < this.currentRound) this.roundIndicators[i].classList.add('done');
      else if (i === this.currentRound) this.roundIndicators[i].classList.add('active');
    }
  };

  
  BombGame.prototype._startRound = function(roundIdx) {
    this.currentRound = roundIdx;
    this._updateRoundBar();
    this.moduleArea.innerHTML = '';

    if (roundIdx >= this.rounds) {
      this._endGame(true, 'BOMB DEFUSED!');
      return;
    }

    this._renderRound(roundIdx);
  };

  BombGame.prototype._renderRound = function(roundIdx) {
    this.moduleArea.innerHTML = '';
    var mod = MODULES[this.moduleKey];
    if (!mod) return;

    
    var hdr = el('div','module-header');
    var name = el('div','module-name', mod.name);
    var prog = el('div','module-progress');
    prog.textContent = (this.problemsDone + 1) + '/' + this.totalProblems;
    prog.style.color = DIFF_COLORS[roundIdx] || '#888';

    var self = this;
    var muteBtn = el('button','bomb-mute-btn', this.music && this.music.volume === 0 ? 'Unmute Music' : 'Mute Music');
    muteBtn.onclick = function() {
      if (self.music) {
        if (self.music.volume > 0) {
          self.music.volume = 0;
          muteBtn.textContent = 'Unmute Music';
        } else {
          self.music.volume = 0.4;
          muteBtn.textContent = 'Mute Music';
        }
      }
    };

    hdr.appendChild(name);
    hdr.appendChild(prog);
    hdr.appendChild(muteBtn);
    this.moduleArea.appendChild(hdr);

    var content = el('div','module-content');
    this.moduleArea.appendChild(content);

    var self = this;
    var state = mod.generate(roundIdx);
    mod.render(content, state, roundIdx, {
      solve: function() {
        self.problemsDone++;
        content.classList.add('module-solved');
        if (self.roundIndicators[roundIdx]) {
          self.roundIndicators[roundIdx].classList.remove('active');
          self.roundIndicators[roundIdx].classList.add('done');
        }
        setTimeout(function() {
          self._startRound(roundIdx + 1);
        }, 700);
      },
      subSolve: function() {
        self.problemsDone++;
        var progEl = self.moduleArea.querySelector('.module-progress');
        if (progEl) progEl.textContent = (self.problemsDone + 1) + '/' + self.totalProblems;
      },
      strike: function() {
        self.strikes++;
        if (self.strikes <= self.maxStrikes) {
          self.strikeDots[self.strikes - 1].classList.add('active');
        }
        self.modal.classList.add('shaking');
        setTimeout(function() { self.modal.classList.remove('shaking'); }, 400);
        if (self.strikes >= self.maxStrikes) {
          self._endGame(false, 'TOO MANY STRIKES!');
        }
      }
    });
  };

  BombGame.prototype._endGame = function(won, msg) {
    this.running = false;
    clearInterval(this.interval);
    this._stopMusic();

    if (!won) {
      var self = this;
      if (window.BugSim && window.BugSim.killBug && window.BugSim.getBugData) {
        var bugCount = window.BugSim.getBugData().length;
        for (var i = bugCount - 1; i >= 0; i--) {
          window.BugSim.killBug(i, '29awesomebugs');
        }
      }
      this._playExplosion(function() {
        self.destroy();
      });
    } else {
      this._showResult(true, msg);
    }

    if (this.onComplete) this.onComplete(won);
  };

  BombGame.prototype._playExplosion = function(callback) {
    var modal = this.modal;
    var overlay = this.overlay;
    var digits = this.timerDigits;
    var colonDots = this.colonDots;

    
    modal.classList.add('explode-greyed');

    
    for (var h = 0; h < 8; h++) {
      setDigitLetter(digits[h], h % 2 === 0 ? 'H' : 'A');
    }
    
    for (var c = 0; c < colonDots.length; c++) colonDots[c].classList.remove('on');

    
    var decDot = overlay.querySelector('.lcd-decimal .lcd-dot');
    if (decDot) decDot.style.background = 'rgba(255,0,0,0.07)';

    
    var blinkOn = true;
    var blinkInterval = setInterval(function() {
      blinkOn = !blinkOn;
      for (var i = 0; i < 8; i++) {
        if (blinkOn) {
          setDigitLetter(digits[i], i % 2 === 0 ? 'H' : 'A');
        } else {
          clearDigit(digits[i]);
        }
      }
    }, 500);

    
    var pipeRack = overlay.querySelector('.bomb-pipe-rack');
    setTimeout(function() {
      modal.classList.add('shake-ramping');
      modal.classList.add('bomb-heating');
      if (pipeRack) pipeRack.classList.add('shake-ramping');
    }, 300);

    
    var detonateDelay = 3200;
    setTimeout(function() {
      clearInterval(blinkInterval);
      modal.classList.remove('shake-ramping', 'bomb-heating');

      
      var rack = overlay.querySelector('.bomb-pipe-rack');
      if (rack) { rack.classList.remove('shake-ramping'); rack.style.display = 'none'; }

      
      modal.classList.add('modal-exploding');

      
      overlay.classList.add('screen-quaking');

      
      var layer = el('div', 'explosion-layer-full');

      
      layer.appendChild(el('div', 'explosion-flash-full'));

      
      layer.appendChild(el('div', 'explosion-fireball'));
      layer.appendChild(el('div', 'explosion-fireball-secondary'));
      layer.appendChild(el('div', 'explosion-fireball-tertiary'));

      
      layer.appendChild(el('div', 'explosion-shockwave'));
      layer.appendChild(el('div', 'explosion-shockwave-secondary'));

      
      var sparkColors = ['#fff','#ffe080','#ffaa00','#ff6600','#ff4400'];
      for (var k = 0; k < 24; k++) {
        var spark = el('div', 'explosion-spark');
        var sAngle = Math.random() * 360;
        var sDist = 200 + Math.random() * 500;
        var sdx = Math.cos(sAngle * Math.PI / 180) * sDist;
        var sdy = Math.sin(sAngle * Math.PI / 180) * sDist;
        spark.style.background = sparkColors[Math.floor(Math.random() * sparkColors.length)];
        spark.style.boxShadow = '0 0 8px 3px ' + spark.style.background;
        spark.style.height = (8 + Math.random() * 16) + 'px';
        spark.style.setProperty('--dx', sdx + 'px');
        spark.style.setProperty('--dy', sdy + 'px');
        spark.style.setProperty('--angle', sAngle + 'deg');
        spark.style.animationDuration = (0.3 + Math.random() * 0.5) + 's';
        layer.appendChild(spark);
      }

      
      var fireColors = ['#ff2200','#ff6600','#ffaa00','#ffdd00','#fff','#ff4400','#ff8800','#ffcc44'];
      for (var i = 0; i < 50; i++) {
        var p = el('div', 'explosion-particle');
        var angle = Math.random() * 360;
        var dist = 100 + Math.random() * 600;
        var dx = Math.cos(angle * Math.PI / 180) * dist;
        var dy = Math.sin(angle * Math.PI / 180) * dist;
        var col = fireColors[Math.floor(Math.random() * fireColors.length)];
        p.style.background = 'radial-gradient(circle, ' + col + ', transparent)';
        var size = (6 + Math.random() * 18);
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.boxShadow = '0 0 ' + (size * 2) + 'px ' + (size * 0.8) + 'px ' + col;
        p.style.setProperty('--dx', dx + 'px');
        p.style.setProperty('--dy', dy + 'px');
        p.style.setProperty('--spin', (Math.random() * 540 - 270) + 'deg');
        p.style.setProperty('--end-scale', (0.05 + Math.random() * 0.2).toFixed(2));
        p.style.animationDuration = (0.4 + Math.random() * 0.9) + 's';
        p.style.animationDelay = (Math.random() * 0.15) + 's';
        layer.appendChild(p);
      }

      document.body.appendChild(layer);

      
      setTimeout(function() {
        
        modal.style.filter = 'brightness(10) saturate(0)';

        setTimeout(function() {
          modal.style.filter = '';
          modal.classList.remove('modal-exploding', 'explode-greyed', 'bomb-heating');
          overlay.classList.remove('screen-quaking');
          modal.style.opacity = '0';
          if (layer.parentNode) layer.parentNode.removeChild(layer);

          setTimeout(function() {
            modal.style.opacity = '1';
            modal.style.transform = '';
            if (callback) callback();
          }, 200);
        }, 120);
      }, 900);
    }, detonateDelay);
  };

  BombGame.prototype._showResult = function(won, msg) {
    this.moduleArea.innerHTML = '';

    var wrap = el('div','bomb-result-inline');

    var h = el('h2', '', 'BOMB DEFUSED!');
    h.style.color = '#4f4';
    h.style.margin = '0 0 12px';
    wrap.appendChild(h);

    var p = el('p', '', 'Congrats, you saved all of your bugs and stopped the imminent threat of 29awesomebugs\' rancid attack. Please send this to the 28awesomebugs bomb squad. They are professionals at dealing with these things.');
    p.style.color = '#ccc';
    p.style.lineHeight = '1.5';
    p.style.margin = '0 0 16px';
    wrap.appendChild(p);

    var self = this;
    var btn = el('button', 'mod-submit', 'Ship off');
    btn.onclick = function() { self.destroy(); };
    wrap.appendChild(btn);

    this.moduleArea.appendChild(wrap);
  };

  BombGame.prototype.destroy = function() {
    this.running = false;
    clearInterval(this.interval);
    this._stopMusic();
    
    var leftover = document.querySelector('.explosion-layer-full');
    if (leftover && leftover.parentNode) leftover.parentNode.removeChild(leftover);
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    if (window._activeBombGame === this) window._activeBombGame = null;
  };


  
  
  
  
  
  var MODULES = {};


  
  
  
  
  
  
  MODULES.binary = {
    name: 'Binary Decoder',
    counts: [2, 1, 2],
    concept:
      '<b>Binary</b> is how computers store numbers using only <b>0</b> and <b>1</b>.<br><br>' +
      'Each position is a <b>power of 2</b>. Read right to left: 1, 2, 4, 8, 16, 32...<br>' +
      'Add up the positions where there\'s a <b>1</b>.<br><br>' +
      '<code>1011</code> = 8 + 0 + 2 + 1 = <b>11</b>',
    roundDesc: [
      '4-bit numbers (0\u201315) \u2014 solve 2!',
      '6-bit numbers (0\u201363)',
      '8-bit numbers (0\u2013255) \u2014 solve 2!'
    ],
    generate: function(diff) {
      var bits = [4, 6, 8][diff] || 4;
      var count = [2, 1, 2][diff] || 1;
      var problems = [];
      for (var p = 0; p < count; p++) {
        var num = rand(1, Math.pow(2, bits) - 1);
        var binary = num.toString(2);
        while (binary.length < bits) binary = '0' + binary;
        problems.push({ binary: binary, answer: num, bits: bits });
      }
      return { problems: problems, total: count };
    },
    render: function(container, state, diff, cb) {
      var solved = 0;

      function showProblem(idx) {
        container.innerHTML = '';
        var prob = state.problems[idx];

        
        var bitGrid = el('div','binary-grid');
        var powers = [];
        for (var i = prob.bits - 1; i >= 0; i--) powers.push(Math.pow(2, i));

        
        var powRow = el('div','binary-row binary-powers');
        powers.forEach(function(p) {
          powRow.appendChild(el('div','binary-cell binary-power', '' + p));
        });
        bitGrid.appendChild(powRow);

        
        var bitRow = el('div','binary-row');
        prob.binary.split('').forEach(function(b) {
          var cell = el('div','binary-cell binary-bit');
          cell.textContent = b;
          if (b === '1') cell.classList.add('active');
          bitRow.appendChild(cell);
        });
        bitGrid.appendChild(bitRow);
        container.appendChild(bitGrid);

        
        if (diff === 0) {
          var activeVals = [];
          prob.binary.split('').forEach(function(b, i) {
            if (b === '1') activeVals.push(powers[i]);
          });
          var hint = el('div','mod-ref');
          hint.textContent = 'Add the lit values: ' + activeVals.join(' + ') + ' = ?';
          container.appendChild(hint);
        }

        var input = document.createElement('input');
        input.type = 'number';
        input.className = 'mod-input';
        input.placeholder = 'Enter decimal value...';
        input.inputMode = 'numeric';
        container.appendChild(input);

        var submit = el('button','mod-submit','SUBMIT');
        submit.onclick = function() {
          if (parseInt(input.value) === prob.answer) {
            solved++;
            if (solved >= state.total) cb.solve();
            else { cb.subSolve(); showProblem(idx + 1); }
          } else {
            cb.strike();
            input.value = '';
            input.focus();
          }
        };
        container.appendChild(submit);
        input.addEventListener('keydown', function(e) { if (e.key === 'Enter') submit.click(); });
        setTimeout(function() { input.focus(); }, 100);
      }

      showProblem(0);
    }
  };


  
  
  
  
  
  
  MODULES.caesar = {
    name: 'Caesar Cipher',
    counts: [1, 1, 1],
    concept:
      '<b>Caesar cipher</b> shifts every letter by N positions in the alphabet.<br><br>' +
      'To <b>decode</b>, shift each letter <b>backward</b> by N.<br>' +
      'If you go past A, wrap around to Z.<br><br>' +
      'Example: <code>CPEF</code> with shift 2 \u2192 B-O-D-E \u2192 <b>BODE</b>',
    roundDesc: [
      '3-letter words, small shift (1\u20133)',
      '4-letter words, bigger shift (1\u20137)',
      '5-letter words, large shift (1\u201313)'
    ],
    generate: function(diff) {
      var WORD_POOLS = [
        ['BUG','ANT','FLY','BEE','WEB','EGG','DIG','HOP','RUN','HIT'],
        ['BOMB','WIRE','CODE','LOCK','FUSE','SAFE','TICK','HACK','BYTE','TRAP'],
        ['BOMBS','WIRES','CODES','FUSED','HACKS','TRAPS','BYTES','LOCKS','RISKS','BLAST']
      ];
      var pool = WORD_POOLS[diff] || WORD_POOLS[0];
      var maxShift = [3, 7, 13][diff] || 3;
      var count = [1, 1, 1][diff] || 1;
      var problems = [];
      for (var p = 0; p < count; p++) {
        var word = pick(pool);
        var shift = rand(1, maxShift);
        var cipher = word.split('').map(function(ch) {
          return String.fromCharCode(((ch.charCodeAt(0) - 65 + shift) % 26) + 65);
        }).join('');
        problems.push({ cipher: cipher, shift: shift, answer: word });
      }
      return { problems: problems, total: count };
    },
    render: function(container, state, diff, cb) {
      var solved = 0;

      function showProblem(idx) {
        container.innerHTML = '';
        var prob = state.problems[idx];

        var disp = el('div','mod-display', prob.cipher);
        container.appendChild(disp);

        var shiftLabel = el('div','cipher-shift');
        shiftLabel.innerHTML = 'Shift: <b>' + prob.shift + '</b> \u2014 move each letter <b>backward</b> ' + prob.shift + ' step' + (prob.shift > 1 ? 's' : '');
        container.appendChild(shiftLabel);

        
        var alpha = el('div','alpha-strip');
        for (var i = 0; i < 26; i++) {
          var ch = String.fromCharCode(65 + i);
          var span = el('span','alpha-char', ch);
          alpha.appendChild(span);
        }
        container.appendChild(alpha);

        
        if (diff === 0) {
          var first = prob.cipher[0];
          var decoded = prob.answer[0];
          var ref = el('div','mod-ref');
          ref.textContent = 'Example: ' + first + ' \u2212 ' + prob.shift + ' = ' + decoded;
          container.appendChild(ref);
        }

        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'mod-input';
        input.placeholder = 'Enter decoded word...';
        input.maxLength = 8;
        input.autocomplete = 'off';
        input.style.textTransform = 'uppercase';
        input.style.letterSpacing = '4px';
        input.style.textAlign = 'center';
        container.appendChild(input);

        var submit = el('button','mod-submit','SUBMIT');
        submit.onclick = function() {
          if (input.value.trim().toUpperCase() === prob.answer) {
            solved++;
            if (solved >= state.total) cb.solve();
            else { cb.subSolve(); showProblem(idx + 1); }
          } else {
            cb.strike();
            input.value = '';
            input.focus();
          }
        };
        container.appendChild(submit);
        input.addEventListener('keydown', function(e) { if (e.key === 'Enter') submit.click(); });
        setTimeout(function() { input.focus(); }, 100);
      }

      showProblem(0);
    }
  };


  
  
  
  
  
  
  MODULES.ascii = {
    name: 'ASCII Lookup',
    counts: [1, 1, 1],
    concept:
      '<b>ASCII</b> assigns a number to every character.<br><br>' +
      '<b>A\u2013Z</b> = 65\u201390<br>' +
      '<b>a\u2013z</b> = 97\u2013122 <span style="color:#888">(lowercase = uppercase + 32)</span><br>' +
      '<b>0\u20139</b> = 48\u201357<br><br>' +
      'Example: <code>72 73</code> \u2192 <b>HI</b>',
    roundDesc: [
      '2 uppercase letters (A\u2013Z), table shown',
      '3 characters (A\u2013Z, a\u2013z), table shown',
      '4 characters (any), table shown'
    ],
    generate: function(diff) {
      var count = [1, 1, 1][diff] || 1;
      var problems = [];
      for (var p = 0; p < count; p++) {
        var len = [2, 3, 4][diff] || 2;
        var codes = [];
        var letters = [];
        for (var i = 0; i < len; i++) {
          var c;
          if (diff === 0) {
            c = rand(65, 90);
          } else if (diff === 1) {
            c = Math.random() < 0.5 ? rand(65, 90) : rand(97, 122);
          } else {
            var type = rand(0, 2);
            if (type === 0) c = rand(65, 90);
            else if (type === 1) c = rand(97, 122);
            else c = rand(48, 57);
          }
          codes.push(c);
          letters.push(String.fromCharCode(c));
        }
        problems.push({ codes: codes, answer: letters.join('') });
      }
      return { problems: problems, total: count };
    },
    render: function(container, state, diff, cb) {
      var solved = 0;

      function showProblem(idx) {
        container.innerHTML = '';
        var prob = state.problems[idx];

        
        var disp = el('div','mod-display');
        disp.textContent = prob.codes.join('   ');
        container.appendChild(disp);

        
        var ref = el('div','ascii-table');
        for (var i = 65; i <= 90; i++) {
          var cell = el('span','ascii-cell');
          cell.innerHTML = '<b>' + String.fromCharCode(i) + '</b>=' + i;
          ref.appendChild(cell);
        }
        if (diff >= 1) {
          for (var j = 97; j <= 122; j++) {
            var cell2 = el('span','ascii-cell');
            cell2.innerHTML = '<b>' + String.fromCharCode(j) + '</b>=' + j;
            ref.appendChild(cell2);
          }
        }
        if (diff >= 2) {
          for (var k = 48; k <= 57; k++) {
            var cell3 = el('span','ascii-cell');
            cell3.innerHTML = '<b>' + String.fromCharCode(k) + '</b>=' + k;
            ref.appendChild(cell3);
          }
        }
        container.appendChild(ref);

        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'mod-input';
        input.placeholder = 'Type the characters...';
        input.maxLength = 6;
        input.autocomplete = 'off';
        input.style.letterSpacing = '3px';
        input.style.textAlign = 'center';
        container.appendChild(input);

        var submit = el('button','mod-submit','SUBMIT');
        submit.onclick = function() {
          if (input.value.trim() === prob.answer) {
            solved++;
            if (solved >= state.total) cb.solve();
            else { cb.subSolve(); showProblem(idx + 1); }
          } else {
            cb.strike();
            input.value = '';
            input.focus();
          }
        };
        container.appendChild(submit);
        input.addEventListener('keydown', function(e) { if (e.key === 'Enter') submit.click(); });
        setTimeout(function() { input.focus(); }, 100);
      }

      showProblem(0);
    }
  };


  
  
  
  
  
  
  MODULES.bitwise = {
    name: 'Bitwise Ops',
    counts: [3, 3, 2],
    concept:
      '<b>Bitwise</b> operations work on each column of bits independently.<br><br>' +
      '<b>AND</b>: both must be 1 \u2192 1<br>' +
      '<b>OR</b>: at least one is 1 \u2192 1<br>' +
      '<b>XOR</b>: exactly one is 1 \u2192 1<br><br>' +
      'Example: <code>1010 AND 1100</code> \u2192 <b>1000</b>',
    roundDesc: [
      '4-bit, AND only \u2014 solve 3!',
      '4-bit, any operation (AND/OR/XOR) \u2014 solve 3!',
      '6-bit, any operation \u2014 solve 2!'
    ],
    generate: function(diff) {
      var bits = diff >= 2 ? 6 : 4;
      var count = [3, 3, 2][diff] || 1;
      var ops = diff === 0 ? ['AND'] : ['AND','OR','XOR'];
      var problems = [];
      function toBin(n, len) { var s = n.toString(2); while(s.length < len) s='0'+s; return s; }
      for (var p = 0; p < count; p++) {
        var max = Math.pow(2, bits) - 1;
        var a = rand(1, max);
        var b = rand(1, max);
        var op = pick(ops);
        var result;
        if (op === 'AND') result = a & b;
        else if (op === 'OR') result = a | b;
        else result = a ^ b;
        problems.push({
          a: toBin(a, bits), b: toBin(b, bits), op: op,
          answer: toBin(result, bits), bits: bits
        });
      }
      return { problems: problems, total: count };
    },
    render: function(container, state, diff, cb) {
      var solved = 0;

      function showProblem(idx) {
        container.innerHTML = '';
        var prob = state.problems[idx];

        
        var aRow = el('div','bit-row');
        prob.a.split('').forEach(function(b) {
          var c = el('div','bit-cell', b);
          if (b === '1') c.classList.add('active');
          aRow.appendChild(c);
        });
        container.appendChild(aRow);

        
        container.appendChild(el('div','bit-op', prob.op));

        
        var bRow = el('div','bit-row');
        prob.b.split('').forEach(function(b) {
          var c = el('div','bit-cell', b);
          if (b === '1') c.classList.add('active');
          bRow.appendChild(c);
        });
        container.appendChild(bRow);

        container.appendChild(el('div','bit-op','= ?'));

        
        if (diff === 0) {
          var table = el('div','bitwise-truth');
          table.innerHTML =
            '<div class="bt-row"><span>A</span><span>B</span><span>AND</span></div>' +
            '<div class="bt-row"><span>0</span><span>0</span><span>0</span></div>' +
            '<div class="bt-row"><span>0</span><span>1</span><span>0</span></div>' +
            '<div class="bt-row"><span>1</span><span>0</span><span>0</span></div>' +
            '<div class="bt-row"><span>1</span><span>1</span><span class="bt-hl">1</span></div>';
          container.appendChild(table);
        } else if (diff === 1) {
          var ref = el('div','mod-ref');
          ref.textContent = 'AND: 1&1\u21921, else 0 | OR: 0|0\u21920, else 1 | XOR: same\u21920, diff\u21921';
          container.appendChild(ref);
        }

        
        var inputBits = [];
        for (var b = 0; b < prob.bits; b++) inputBits.push(0);
        var inputRow = el('div','bit-row');
        for (var i = 0; i < prob.bits; i++) {
          (function(idx2) {
            var cell = el('div','bit-cell bit-toggle', '0');
            cell.onclick = function() {
              inputBits[idx2] = inputBits[idx2] ? 0 : 1;
              cell.textContent = '' + inputBits[idx2];
              cell.classList.toggle('active', inputBits[idx2] === 1);
            };
            inputRow.appendChild(cell);
          })(i);
        }
        container.appendChild(inputRow);

        var submit = el('button','mod-submit','SUBMIT');
        submit.onclick = function() {
          if (inputBits.join('') === prob.answer) {
            solved++;
            if (solved >= state.total) cb.solve();
            else { cb.subSolve(); showProblem(idx + 1); }
          } else {
            cb.strike();
          }
        };
        container.appendChild(submit);
      }

      showProblem(0);
    }
  };


  
  
  
  
  
  
  MODULES.hex = {
    name: 'Hex Conversion',
    counts: [2, 1, 1],
    concept:
      '<b>Hexadecimal</b> (base 16) uses digits <b>0\u20139</b> and <b>A\u2013F</b>.<br><br>' +
      'A=10, B=11, C=12, D=13, E=14, F=15<br>' +
      'Two-digit hex: <b>first digit \u00D7 16 + second digit</b><br><br>' +
      'Example: <code>2F</code> = 2\u00D716 + 15 = <b>47</b>',
    roundDesc: [
      'Single digit: hex\u2192dec + dec\u2192hex',
      'Two-digit hex (00\u2013FF) \u2192 decimal',
      'Decimal \u2192 hex'
    ],
    generate: function(diff) {
      var count = [2, 1, 1][diff] || 1;
      var problems = [];
      for (var p = 0; p < count; p++) {
        if (diff === 0) {
          if (p === 0) {
            var n = rand(0, 15);
            problems.push({ display: n.toString(16).toUpperCase(), answer: '' + n, mode: 'hex2dec' });
          } else {
            var n2 = rand(0, 15);
            problems.push({ display: '' + n2, answer: n2.toString(16).toUpperCase(), mode: 'dec2hex' });
          }
        } else if (diff === 1) {
          var n3 = rand(16, 255);
          problems.push({ display: n3.toString(16).toUpperCase(), answer: '' + n3, mode: 'hex2dec' });
        } else {
          var n4 = rand(16, 255);
          problems.push({ display: '' + n4, answer: n4.toString(16).toUpperCase(), mode: 'dec2hex' });
        }
      }
      return { problems: problems, total: count };
    },
    render: function(container, state, diff, cb) {
      var solved = 0;
      function showProblem(idx) {
        container.innerHTML = '';
        var prob = state.problems[idx];
        var direction = prob.mode === 'hex2dec' ? 'Convert hex to decimal:' : 'Convert decimal to hex:';
        container.appendChild(el('div','cipher-shift', direction));

        var disp = el('div','mod-display');
        disp.textContent = prob.mode === 'hex2dec' ? '0x' + prob.display : prob.display;
        container.appendChild(disp);

        if (diff === 0) {
          var ref = el('div','mod-ref');
          ref.textContent = '0=0  1=1  ...  9=9  A=10  B=11  C=12  D=13  E=14  F=15';
          container.appendChild(ref);
        } else if (diff === 1) {
          var ref2 = el('div','mod-ref');
          ref2.textContent = 'First digit \u00D7 16 + second digit';
          container.appendChild(ref2);
        }

        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'mod-input';
        input.placeholder = prob.mode === 'hex2dec' ? 'Enter decimal...' : 'Enter hex (e.g. 2F)...';
        input.autocomplete = 'off';
        input.style.textTransform = prob.mode === 'dec2hex' ? 'uppercase' : 'none';
        input.style.textAlign = 'center';
        container.appendChild(input);

        var submit = el('button','mod-submit','SUBMIT');
        submit.onclick = function() {
          var val = input.value.trim().toUpperCase();
          if (val === prob.answer) {
            solved++;
            if (solved >= state.total) cb.solve(); else { cb.subSolve(); showProblem(idx + 1); }
          } else { cb.strike(); input.value = ''; input.focus(); }
        };
        container.appendChild(submit);
        input.addEventListener('keydown', function(e) { if (e.key === 'Enter') submit.click(); });
        setTimeout(function() { input.focus(); }, 100);
      }
      showProblem(0);
    }
  };


  
  
  
  
  
  
  MODULES.logic = {
    name: 'Logic Gates',
    counts: [4, 3, 3],
    concept:
      '<b>Logic gates</b> take binary inputs (0 or 1) and produce output.<br><br>' +
      '<b>AND</b>: both 1 \u2192 1<br>' +
      '<b>OR</b>: at least one 1 \u2192 1<br>' +
      '<b>NOT</b>: flips the bit (0\u21921, 1\u21920)<br>' +
      '<b>XOR</b>: exactly one 1 \u2192 1<br><br>' +
      'Example: <code>1 AND 0</code> \u2192 <b>0</b>',
    roundDesc: [
      'Single gate, truth table shown \u2014 solve 4!',
      '2 gates chained \u2014 solve 3!',
      '3 gates chained \u2014 solve 3!'
    ],
    generate: function(diff) {
      var GATES_SINGLE = ['AND','OR','NOT'];
      var GATES_MULTI = ['AND','OR','NOT','XOR'];
      var count = [4, 3, 3][diff] || 1;
      var chainLen = [1, 2, 3][diff] || 1;
      var problems = [];

      function evalGate(gate, a, b) {
        if (gate === 'AND') return (a && b) ? 1 : 0;
        if (gate === 'OR') return (a || b) ? 1 : 0;
        if (gate === 'NOT') return a ? 0 : 1;
        if (gate === 'XOR') return (a !== b) ? 1 : 0;
        return 0;
      }

      for (var p = 0; p < count; p++) {
        var gates = [];
        var inputs = [rand(0,1), rand(0,1)];
        var steps = [];
        var val = inputs[0];

        for (var g = 0; g < chainLen; g++) {
          var pool = diff === 0 ? GATES_SINGLE : GATES_MULTI;
          var gate = pick(pool);
          if (gate === 'NOT') {
            val = evalGate('NOT', val);
            steps.push({ gate: 'NOT', input: [val ? 0 : 1], output: val });
          } else {
            var secondInput = g === 0 ? inputs[1] : rand(0,1);
            var out = evalGate(gate, val, secondInput);
            steps.push({ gate: gate, input: [val, secondInput], output: out });
            val = out;
          }
          gates.push(gate);
        }
        problems.push({ inputs: inputs, gates: gates, steps: steps, answer: val });
      }
      return { problems: problems, total: count };
    },
    render: function(container, state, diff, cb) {
      var solved = 0;
      function showProblem(idx) {
        container.innerHTML = '';
        var prob = state.problems[idx];
        
        var chain = el('div','gate-chain');
        prob.steps.forEach(function(step, i) {
          var row = el('div','gate-step');
          if (step.gate === 'NOT') {
            row.innerHTML = '<span class="gate-label">' + step.gate + '</span> ' + step.input[0] + ' = <b>?</b>';
          } else {
            row.innerHTML = step.input[0] + ' <span class="gate-label">' + step.gate + '</span> ' + step.input[1] + ' = <b>?</b>';
          }
          if (i < prob.steps.length - 1) {
            row.innerHTML += ' <span class="gate-arrow">\u2192</span>';
          }
          chain.appendChild(row);
        });
        container.appendChild(chain);

        if (diff === 0) {
          var ref = el('div','mod-ref');
          ref.innerHTML = 'AND: 1&1=1 | OR: 0|0=0, else 1 | NOT: flips';
          container.appendChild(ref);
        }

        var btnWrap = el('div','gate-answer-btns');
        [0, 1].forEach(function(v) {
          var btn = el('button','mod-btn gate-choice', '' + v);
          btn.onclick = function() {
            if (v === prob.answer) {
              solved++;
              if (solved >= state.total) cb.solve(); else { cb.subSolve(); showProblem(idx + 1); }
            } else { cb.strike(); }
          };
          btnWrap.appendChild(btn);
        });
        container.appendChild(btnWrap);
      }
      showProblem(0);
    }
  };


  
  
  
  
  
  
  MODULES.pow2 = {
    name: 'Powers of 2',
    counts: [1, 1, 2],
    concept:
      '<b>Powers of 2</b> double each time: 1, 2, 4, 8, 16, 32, 64, 128, 256...<br><br>' +
      '2<sup>0</sup>=1, 2<sup>1</sup>=2, 2<sup>3</sup>=8, 2<sup>8</sup>=256, 2<sup>10</sup>=1024<br><br>' +
      'These show up everywhere in computing: memory sizes, bit widths, network addresses.',
    roundDesc: [
      'What is 2^N? (N = 1\u20138)',
      'What is 2^N? (N = 1\u201316)',
      'Reverse: given a value, name the exponent'
    ],
    generate: function(diff) {
      var count = [1, 1, 2][diff] || 1;
      var problems = [];
      for (var p = 0; p < count; p++) {
        if (diff === 0) {
          var exp = rand(1, 8);
          problems.push({ display: '2^' + exp, answer: '' + Math.pow(2, exp), mode: 'forward', sortKey: Math.pow(2, exp) });
        } else if (diff === 1) {
          var exp2 = rand(1, 16);
          problems.push({ display: '2^' + exp2, answer: '' + Math.pow(2, exp2), mode: 'forward', sortKey: Math.pow(2, exp2) });
        } else {
          var exp3 = rand(1, 16);
          var val = Math.pow(2, exp3);
          problems.push({ display: '' + val, answer: '' + exp3, mode: 'reverse', sortKey: val });
        }
      }
      problems.sort(function(a, b) { return a.sortKey - b.sortKey; });
      return { problems: problems, total: count };
    },
    render: function(container, state, diff, cb) {
      var solved = 0;
      function showProblem(idx) {
        container.innerHTML = '';
        var prob = state.problems[idx];
        var prompt = prob.mode === 'forward' ? 'What is ' + prob.display + '?' : 'What power of 2 equals ' + prob.display + '?';
        container.appendChild(el('div','cipher-shift', prompt));

        var disp = el('div','mod-display', prob.display);
        container.appendChild(disp);

        if (diff === 0) {
          var ref = el('div','mod-ref');
          ref.textContent = '2^1=2  2^2=4  2^3=8  2^4=16  2^5=32  2^6=64  2^7=128  2^8=256';
          container.appendChild(ref);
        }

        var input = document.createElement('input');
        input.type = 'number';
        input.className = 'mod-input';
        input.placeholder = prob.mode === 'forward' ? 'Enter the result...' : 'Enter the exponent...';
        input.inputMode = 'numeric';
        input.style.textAlign = 'center';
        container.appendChild(input);

        var submit = el('button','mod-submit','SUBMIT');
        submit.onclick = function() {
          if (input.value.trim() === prob.answer) {
            solved++;
            if (solved >= state.total) cb.solve(); else { cb.subSolve(); showProblem(idx + 1); }
          } else { cb.strike(); input.value = ''; input.focus(); }
        };
        container.appendChild(submit);
        input.addEventListener('keydown', function(e) { if (e.key === 'Enter') submit.click(); });
        setTimeout(function() { input.focus(); }, 100);
      }
      showProblem(0);
    }
  };


  
  
  
  
  
  
  MODULES.modulo = {
    name: 'Modular Arithmetic',
    counts: [1, 1, 2],
    concept:
      '<b>Modulo</b> (mod / %) gives the <b>remainder</b> after division.<br><br>' +
      '17 mod 5 = <b>2</b> &nbsp;(17 \u00F7 5 = 3 remainder 2)<br>' +
      '20 mod 4 = <b>0</b> &nbsp;(divides evenly)<br><br>' +
      'Used in cryptography, hashing, clock arithmetic, and more.',
    roundDesc: [
      'Simple: A mod B (small numbers)',
      'Bigger numbers',
      'Reverse: find X where X mod B = R \u2014 solve 2!'
    ],
    generate: function(diff) {
      var count = [1, 1, 2][diff] || 1;
      var problems = [];
      for (var p = 0; p < count; p++) {
        if (diff === 0) {
          var b = rand(2, 5);
          var a = rand(b + 1, 20);
          problems.push({ display: a + ' mod ' + b, answer: '' + (a % b), mode: 'forward' });
        } else if (diff === 1) {
          var b2 = rand(3, 12);
          var a2 = rand(20, 99);
          problems.push({ display: a2 + ' mod ' + b2, answer: '' + (a2 % b2), mode: 'forward' });
        } else {
          var b3 = rand(3, 9);
          var r = rand(0, b3 - 1);
          var lo = rand(10, 30);
          var hi = lo + rand(8, 15);
          
          var valid = [];
          for (var x = lo; x <= hi; x++) { if (x % b3 === r) valid.push(x); }
          if (valid.length === 0) { lo--; valid.push(lo); } 
          problems.push({ display: 'X mod ' + b3 + ' = ' + r, range: [lo, hi], answer: valid, mode: 'reverse' });
        }
      }
      return { problems: problems, total: count };
    },
    render: function(container, state, diff, cb) {
      var solved = 0;
      function showProblem(idx) {
        container.innerHTML = '';
        var prob = state.problems[idx];
        var disp = el('div','mod-display', prob.display);
        container.appendChild(disp);

        if (prob.mode === 'reverse') {
          container.appendChild(el('div','cipher-shift', 'Find X in range [' + prob.range[0] + ' .. ' + prob.range[1] + ']'));
        }

        if (diff === 0) {
          var ref = el('div','mod-ref');
          ref.textContent = 'mod = remainder after dividing';
          container.appendChild(ref);
        }

        var input = document.createElement('input');
        input.type = 'number';
        input.className = 'mod-input';
        input.placeholder = prob.mode === 'forward' ? 'Enter remainder...' : 'Enter a valid X...';
        input.inputMode = 'numeric';
        input.style.textAlign = 'center';
        container.appendChild(input);

        var submit = el('button','mod-submit','SUBMIT');
        submit.onclick = function() {
          var v = parseInt(input.value);
          var correct;
          if (prob.mode === 'forward') {
            correct = ('' + v) === prob.answer;
          } else {
            correct = prob.answer.indexOf(v) >= 0;
          }
          if (correct) {
            solved++;
            if (solved >= state.total) cb.solve(); else { cb.subSolve(); showProblem(idx + 1); }
          } else { cb.strike(); input.value = ''; input.focus(); }
        };
        container.appendChild(submit);
        input.addEventListener('keydown', function(e) { if (e.key === 'Enter') submit.click(); });
        setTimeout(function() { input.focus(); }, 100);
      }
      showProblem(0);
    }
  };


  
  
  
  
  
  
  MODULES.sequence = {
    name: 'Number Sequences',
    counts: [2, 1, 2],
    concept:
      'Find the <b>pattern</b> and give the <b>next number</b>.<br><br>' +
      '<b>Arithmetic</b>: adds a constant each time (2, 5, 8, 11, ...)<br>' +
      '<b>Geometric</b>: multiplies by a constant (3, 6, 12, 24, ...)<br>' +
      '<b>Fibonacci</b>: each number = sum of previous two (1, 1, 2, 3, 5, ...)',
    roundDesc: [
      'Arithmetic sequences (+N) \u2014 solve 2!',
      'Geometric sequences (\u00D7N)',
      'Mixed patterns \u2014 solve 2!'
    ],
    generate: function(diff) {
      var count = [2, 1, 2][diff] || 1;
      var problems = [];
      for (var p = 0; p < count; p++) {
        var seq, answer;
        if (diff === 0) {
          var start = rand(1, 10);
          var step = rand(2, 7);
          seq = [];
          for (var i = 0; i < 5; i++) seq.push(start + step * i);
          answer = start + step * 5;
        } else if (diff === 1) {
          var sG = rand(1, 4);
          var mul = rand(2, 4);
          seq = [];
          var v = sG;
          for (var j = 0; j < 5; j++) { seq.push(v); v *= mul; }
          answer = v;
        } else {
          
          if (Math.random() < 0.5) {
            
            var a = rand(1, 5), b = rand(1, 5);
            seq = [a, b];
            for (var k = 2; k < 6; k++) { seq.push(seq[k-1] + seq[k-2]); }
            answer = seq[5] + seq[4];
            seq = seq.slice(0, 6);
          } else {
            
            var s2 = rand(1, 5);
            var addA = rand(2, 5), addB = rand(1, 4);
            seq = [s2];
            for (var m = 0; m < 5; m++) {
              s2 += (m % 2 === 0 ? addA : addB);
              seq.push(s2);
            }
            answer = s2 + (5 % 2 === 0 ? addA : addB);
          }
        }
        problems.push({ seq: seq, answer: answer });
      }
      return { problems: problems, total: count };
    },
    render: function(container, state, diff, cb) {
      var solved = 0;
      function showProblem(idx) {
        container.innerHTML = '';
        var prob = state.problems[idx];
        container.appendChild(el('div','cipher-shift','What comes next in the sequence?'));

        var seqDisp = el('div','seq-display');
        prob.seq.forEach(function(n, i) {
          seqDisp.appendChild(el('span','seq-num', '' + n));
          if (i < prob.seq.length - 1) seqDisp.appendChild(el('span','seq-comma',','));
        });
        seqDisp.appendChild(el('span','seq-blank','?'));
        container.appendChild(seqDisp);

        var input = document.createElement('input');
        input.type = 'number';
        input.className = 'mod-input';
        input.placeholder = 'Next number...';
        input.inputMode = 'numeric';
        input.style.textAlign = 'center';
        container.appendChild(input);

        var submit = el('button','mod-submit','SUBMIT');
        submit.onclick = function() {
          if (parseInt(input.value) === prob.answer) {
            solved++;
            if (solved >= state.total) cb.solve(); else { cb.subSolve(); showProblem(idx + 1); }
          } else { cb.strike(); input.value = ''; input.focus(); }
        };
        container.appendChild(submit);
        input.addEventListener('keydown', function(e) { if (e.key === 'Enter') submit.click(); });
        setTimeout(function() { input.focus(); }, 100);
      }
      showProblem(0);
    }
  };


  
  
  
  
  
  
  (function() {
    var MORSE = {
      A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',
      J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',
      S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..'
    };

    MODULES.morse = {
      name: 'Morse Code',
      counts: [1, 1, 1],
      concept:
        '<b>Morse code</b> encodes letters as <b>dots (.)</b> and <b>dashes (-)</b>.<br><br>' +
        '<b>E</b> = .  &nbsp; <b>T</b> = -  &nbsp; <b>S</b> = ...  &nbsp; <b>O</b> = ---<br>' +
        '<b>SOS</b> = ... --- ...<br><br>' +
        'Letters are separated by spaces, words by larger gaps.',
      roundDesc: [
        'Single letters, chart shown',
        '3-letter words',
        '4-letter words'
      ],
      generate: function(diff) {
        var WORDS_3 = ['BUG','ANT','FLY','BEE','WEB','DIG','HOP','RUN','SOS','HIT'];
        var WORDS_4 = ['BOMB','WIRE','CODE','LOCK','FUSE','SAFE','TICK','HACK','BYTE','TRAP'];
        var count = [1, 1, 1][diff] || 1;
        var problems = [];
        for (var p = 0; p < count; p++) {
          var word;
          if (diff === 0) {
            word = String.fromCharCode(rand(65, 90));
          } else if (diff === 1) {
            word = pick(WORDS_3);
          } else {
            word = pick(WORDS_4);
          }
          var code = word.split('').map(function(ch) { return MORSE[ch] || ''; }).join(' ');
          problems.push({ code: code, answer: word });
        }
        return { problems: problems, total: count };
      },
      render: function(container, state, diff, cb) {
        var solved = 0;
        function showProblem(idx) {
          container.innerHTML = '';
          var prob = state.problems[idx];
          container.appendChild(el('div','cipher-shift','Decode the Morse code:'));

          
          var morseDisp = el('div','morse-display');
          prob.code.split(' ').forEach(function(letter, i) {
            var letterWrap = el('span','morse-letter');
            letter.split('').forEach(function(sym) {
              var dot = el('span', sym === '.' ? 'morse-dot' : 'morse-dash');
              letterWrap.appendChild(dot);
            });
            morseDisp.appendChild(letterWrap);
          });
          container.appendChild(morseDisp);

          
          container.appendChild(el('div','mod-display', prob.code));

          
          var chart = el('div','morse-chart');
          'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(function(ch) {
            chart.appendChild(el('span','morse-ref-item', ch + ' ' + MORSE[ch]));
          });
          container.appendChild(chart);

          var input = document.createElement('input');
          input.type = 'text';
          input.className = 'mod-input';
          input.placeholder = 'Enter letter(s)...';
          input.maxLength = 6;
          input.autocomplete = 'off';
          input.style.textTransform = 'uppercase';
          input.style.letterSpacing = '4px';
          input.style.textAlign = 'center';
          container.appendChild(input);

          var submit = el('button','mod-submit','SUBMIT');
          submit.onclick = function() {
            if (input.value.trim().toUpperCase() === prob.answer) {
              solved++;
              if (solved >= state.total) cb.solve(); else { cb.subSolve(); showProblem(idx + 1); }
            } else { cb.strike(); input.value = ''; input.focus(); }
          };
          container.appendChild(submit);
          input.addEventListener('keydown', function(e) { if (e.key === 'Enter') submit.click(); });
          setTimeout(function() { input.focus(); }, 100);
        }
        showProblem(0);
      }
    };
  })();


  
  
  
  window.BombDefusal = {
    MODULES: MODULES,

    





    start: function(moduleKey, rounds, time) {
      if (window._activeBombGame) window._activeBombGame.destroy();
      var game = new BombGame(moduleKey, rounds || 5, time || 70);
      window._activeBombGame = game;
      game.start();
      return game;
    },

    
    startRandom: function(rounds, time) {
      var keys = Object.keys(MODULES);
      return this.start(pick(keys), rounds, time);
    }
  };

})();
