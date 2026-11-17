var ProfileViewer = (function() {
  var API_BASE = window.__API_BASE ||
    (window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://api.28awesomebugs.org');

  function ensureUnfriendModal() {
    if (document.getElementById('unfriend-confirm-modal')) return;
    var div = document.createElement('div');
    div.id = 'unfriend-confirm-modal';
    div.className = 'modal';
    div.style.display = 'none';
    div.innerHTML = '<div class="modal-content" style="max-width:360px;text-align:center;padding:24px">' +
      '<h3 style="margin:0 0 12px;font-size:1.1rem">Remove Friend</h3>' +
      '<p id="unfriend-confirm-username" style="margin:0 0 20px;color:var(--ink-muted,#666)"></p>' +
      '<div style="display:flex;gap:10px;justify-content:center">' +
      '<button id="unfriend-confirm-no" class="auth-btn" style="flex:1;padding:8px 16px">No</button>' +
      '<button id="unfriend-confirm-yes" class="auth-btn" style="flex:1;padding:8px 16px;background:#e74c3c;color:#fff;border-color:#c0392b">Yes</button>' +
      '</div></div>';
    document.body.appendChild(div);
  }

  ensureUnfriendModal();

  var _currentUsername = null;
  var _currentBugData = null;

  var bugImages = [];
  if (typeof window.bugImages !== 'undefined') {
    bugImages = window.bugImages;
  }

  var bugExtMap = {};
  bugImages.forEach(function(p) {
    var m = p.match(/bug(\d+)\.\w+$/);
    if (m) bugExtMap['bug' + m[1]] = p;
  });

  function avatarSrc(key) {
    if (!key) return 'src/bug1.png';
    if (key.startsWith('elliebug')) return 'src/elliebugs/' + key + '.png';
    return bugExtMap[key] || ('src/' + key + '.jpg');
  }

  function sanitize(str) {
    if (typeof str !== 'string') return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  var ALLOWED_TAG_EFFECTS = {
    shine: true,
    glow: true,
    sparkle: true,
    rainbow: true,
    gradient: true,
    'moody-gradient': true
  };

  function tagEffectClass(effect) {
    if (!effect || !ALLOWED_TAG_EFFECTS[effect]) return '';
    return ' tag-' + effect;
  }

  function $(id) { return document.getElementById(id); }

  function openProfile(username, extra) {
    var modal = $('pub-profile-modal');
    if (!modal) return;
    _currentUsername = username;
    _currentBugData = null;

    $('pub-profile-avatar').src = avatarSrc(null);
    $('pub-profile-username').textContent = '';
    $('pub-profile-username').style.color = '';
    $('pub-profile-friend-count').textContent = '';
    $('pub-profile-hero').style.background = '';
    $('pub-profile-tags').innerHTML = '';
    $('pub-profile-bio').textContent = '';
    var showcaseEl = $('pub-profile-showcase');
    if (showcaseEl) { showcaseEl.innerHTML = ''; showcaseEl.style.display = ''; }
    var postsEl = $('pub-profile-posts');
    if (postsEl) { postsEl.innerHTML = ''; postsEl.style.display = ''; }
    var friendBtn = $('pub-profile-friend-btn');
    friendBtn.style.display = 'none';

    var beckonBtn = $('pub-profile-beckon-btn');
    if (beckonBtn) beckonBtn.style.display = 'none';
    var creatorBtn = $('pub-profile-creator-btn');
    if (creatorBtn) creatorBtn.style.display = 'none';

    modal.style.display = 'block';

    fetch(API_BASE + '/api/auth/profile/' + encodeURIComponent(username), { credentials: 'include' })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data.success || !data.profile) return;
        var p = data.profile;
        $('pub-profile-avatar').src = avatarSrc(p.profilePicture);
        $('pub-profile-username').textContent = p.username;
        if (p.nameColor) $('pub-profile-username').style.color = p.nameColor;
        $('pub-profile-friend-count').textContent = p.friendCount + ' friend' + (p.friendCount === 1 ? '' : 's');
        if (p.bannerColor) $('pub-profile-hero').style.background = p.bannerColor;

        var tagsEl = $('pub-profile-tags');
        if (p.tags && p.tags.length > 0) {
          tagsEl.innerHTML = p.tags.map(function(tag) {
            var effectClass = tagEffectClass(tag.tag_effect);
            var safeColor = /^#[0-9a-fA-F]{6}$/.test(tag.tag_color) ? tag.tag_color : '#888888';
            return '<span class="profile-tag' + effectClass + '" style="border-color:' + safeColor + ';color:' + safeColor + '">' + escapeTagHtml(tag.tag_name) + '</span>';
          }).join('');
        }

        if (p.bio) $('pub-profile-bio').textContent = p.bio;

        
        if (typeof StatShowcase !== 'undefined') {
          fetch(API_BASE + '/api/auth/profile-stats/' + encodeURIComponent(username), { credentials: 'include' })
            .then(function(r) { return r.json(); })
            .then(function(statsData) {
              if (!statsData.success) return;
              StatShowcase.renderPublic(
                $('pub-profile-showcase'),
                statsData.progress && statsData.progress['28bugs_stat_showcase'],
                statsData.progress,
                statsData.serverStats
              );
            })
            .catch(function() {});
        }

        fetch(API_BASE + '/api/auth/user-posts/' + encodeURIComponent(username), { credentials: 'include' })
          .then(function(r) { return r.json(); })
          .then(function(postsData) {
            renderPostHistory($('pub-profile-posts'), postsData.posts || []);
          })
          .catch(function() {});

        if (p.relationship !== 'self') {
          friendBtn.style.display = '';
          updateFriendButton(p.relationship);
          friendBtn.onclick = function() { handleFriendAction(p.id, p.username, p.relationship); };
        }

        if (extra && extra.onOpen) extra.onOpen(p);
      })
      .catch(function() {});
  }

  function renderPostHistory(container, posts) {
    if (!container) return;
    container.innerHTML = '';

    var header = document.createElement('div');
    header.className = 'pub-posts-header';
    header.textContent = 'Recent Posts';
    container.appendChild(header);

    if (!posts || posts.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'pub-posts-empty';
      empty.textContent = 'No posts yet.';
      container.appendChild(empty);
      return;
    }

    posts.forEach(function(post) {
      var item = document.createElement('div');
      item.className = 'pub-post-item';

      var title = document.createElement('div');
      title.className = 'pub-post-title';
      title.textContent = post.title;

      var meta = document.createElement('div');
      meta.className = 'pub-post-meta';
      var date = post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '';
      meta.textContent = date + (post.commentCount > 0 ? '  \u00b7  ' + post.commentCount + ' comment' + (post.commentCount === 1 ? '' : 's') : '');

      item.appendChild(title);
      item.appendChild(meta);
      container.appendChild(item);
    });
  }

  function openBugProfile(bug) {
    var modal = $('pub-profile-modal');
    if (!modal) return;
    _currentBugData = bug;
    _currentUsername = null;

    $('pub-profile-avatar').src = bug.background || avatarSrc(null);
    $('pub-profile-username').textContent = bug.name || '';
    $('pub-profile-username').style.color = '';
    $('pub-profile-friend-count').textContent = 'Lvl ' + (bug.level || 1);
    $('pub-profile-hero').style.background = bug.bannerColor || 'linear-gradient(135deg, #5b9aff, #9b6aff)';
    $('pub-profile-tags').innerHTML = '';
    $('pub-profile-bio').textContent = bug.backstory || (bug.creator ? 'Created by ' + sanitize(bug.creator) : 'A wandering bug looking for a playground!');

    var showcaseEl = $('pub-profile-showcase');
    if (showcaseEl) { showcaseEl.innerHTML = ''; showcaseEl.style.display = 'none'; }
    var postsEl = $('pub-profile-posts');
    if (postsEl) { postsEl.innerHTML = ''; postsEl.style.display = 'none'; }

    var friendBtn = $('pub-profile-friend-btn');
    friendBtn.style.display = 'none';

    var beckonBtn = $('pub-profile-beckon-btn');
    if (beckonBtn) {
      beckonBtn.style.display = '';
      var atCapacity = window.PlaygroundComm && typeof window.PlaygroundComm._atCapacity === 'function'
        ? window.PlaygroundComm._atCapacity() : false;
      beckonBtn.textContent = atCapacity ? 'Guest Capacity Full' : 'Beckon to Playground';
      beckonBtn.disabled = atCapacity;
      beckonBtn.onclick = function() {
        if (window.PlaygroundComm && typeof PlaygroundComm.beckonBug === 'function') {
          PlaygroundComm.beckonBug(bug);
        }
        closeProfile();
      };
    }

    var creatorBtn = $('pub-profile-creator-btn');
    if (creatorBtn && bug.creator) {
      creatorBtn.style.display = '';
      creatorBtn.textContent = 'View Creator: ' + sanitize(bug.creator);
      creatorBtn.onclick = function() {
        closeProfile();
        if (typeof ProfileViewer === 'undefined' || !ProfileViewer.openProfile) return;
        ProfileViewer.openProfile(bug.creator);
      };
    }

    modal.style.display = 'block';
  }

  function closeProfile() {
    var modal = $('pub-profile-modal');
    if (modal) modal.style.display = 'none';
    _currentUsername = null;
    _currentBugData = null;
  }

  function updateFriendButton(relationship) {
    var btn = $('pub-profile-friend-btn');
    if (!btn) return;
    if (relationship === 'none') {
      btn.textContent = '+ Add Friend';
      btn.className = 'auth-btn pub-profile-friend-btn pub-profile-friend-add';
    } else if (relationship === 'friends') {
      btn.textContent = '✓ Friends';
      btn.className = 'auth-btn pub-profile-friend-btn pub-profile-friend-remove';
    } else if (relationship === 'request_sent') {
      btn.textContent = 'Request Sent';
      btn.className = 'auth-btn pub-profile-friend-btn pub-profile-friend-pending';
    } else if (relationship === 'request_received') {
      btn.textContent = 'Accept Request';
      btn.className = 'auth-btn pub-profile-friend-btn pub-profile-friend-add';
    }
  }

  var _pendingUnfriend = null;

  function showUnfriendConfirm(username, userId) {
    var modal = $('unfriend-confirm-modal');
    if (!modal) return confirm('Remove ' + username + ' from friends?');
    _pendingUnfriend = { userId: userId, username: username };
    $('unfriend-confirm-username').textContent = 'Are you sure you want to unfriend ' + username + '?';
    modal.style.display = 'block';
    $('unfriend-confirm-no').focus();
    return false;
  }

  function closeUnfriendConfirm() {
    var modal = $('unfriend-confirm-modal');
    if (modal) modal.style.display = 'none';
    _pendingUnfriend = null;
  }

  async function executeUnfriend() {
    if (!_pendingUnfriend) return;
    var btn = $('pub-profile-friend-btn');
    if (btn) btn.disabled = true;
    try {
      var res = await fetch(API_BASE + '/api/auth/friends/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: _pendingUnfriend.userId })
      });
      var data = await res.json();
      if (data.success) {
        updateFriendButton('none');
        if (btn) btn.onclick = function() { handleFriendAction(_pendingUnfriend.userId, _pendingUnfriend.username, 'none'); };
        if (window.ProfileModal && typeof ProfileModal.refreshBadge === 'function') {
          ProfileModal.refreshBadge();
        }
        if (window.PlaygroundComm && typeof PlaygroundComm._refreshFriends === 'function') {
          PlaygroundComm._refreshFriends();
        }
      }
    } catch(e) {}
    if (btn) btn.disabled = false;
    closeUnfriendConfirm();
  }

  async function handleFriendAction(userId, username, currentRelationship) {
    var btn = $('pub-profile-friend-btn');
    if (!btn) return;
    btn.disabled = true;
    try {
      if (currentRelationship === 'none' || currentRelationship === 'request_received') {
        var res = await fetch(API_BASE + '/api/auth/friends/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username: username })
        });
        var data = await res.json();
        if (data.success) {
          var newRel = data.status === 'accepted' ? 'friends' : 'request_sent';
          updateFriendButton(newRel);
          btn.onclick = function() { handleFriendAction(userId, username, newRel); };
          if (window.ProfileModal && typeof ProfileModal.refreshBadge === 'function') {
            ProfileModal.refreshBadge();
          }
        }
      } else if (currentRelationship === 'friends') {
        if (!showUnfriendConfirm(username, userId)) { btn.disabled = false; return; }
      } else if (currentRelationship === 'request_sent') {
        var res = await fetch(API_BASE + '/api/auth/friends/remove', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ userId: userId })
        });
        var data = await res.json();
        if (data.success) {
          updateFriendButton('none');
          btn.onclick = function() { handleFriendAction(userId, username, 'none'); };
        }
      }
    } catch(e) {}
    btn.disabled = false;
  }

  function escapeTagHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  
  var closeBtn = $('pub-profile-close');
  var modal = $('pub-profile-modal');
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', closeProfile);
    modal.addEventListener('click', function(e) { if (e.target === modal) closeProfile(); });
  }

  var unfriendModal = $('unfriend-confirm-modal');
  if (unfriendModal) {
    unfriendModal.addEventListener('click', function(e) { if (e.target === unfriendModal) closeUnfriendConfirm(); });
    var noBtn = $('unfriend-confirm-no');
    var yesBtn = $('unfriend-confirm-yes');
    if (noBtn) noBtn.addEventListener('click', function() {
      var btn = $('pub-profile-friend-btn');
      if (btn) btn.disabled = false;
      closeUnfriendConfirm();
    });
    if (yesBtn) yesBtn.addEventListener('click', executeUnfriend);
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (unfriendModal && unfriendModal.style.display === 'block') {
        var btn = $('pub-profile-friend-btn');
        if (btn) btn.disabled = false;
        closeUnfriendConfirm();
      } else if (modal && modal.style.display === 'block') {
        closeProfile();
      }
    }
  });

  return {
    openProfile: openProfile,
    openBugProfile: openBugProfile,
    closeProfile: closeProfile,
    avatarSrc: avatarSrc,
    handleFriendAction: handleFriendAction,
    updateFriendButton: updateFriendButton,
    _showUnfriendConfirm: showUnfriendConfirm
  };
})();
