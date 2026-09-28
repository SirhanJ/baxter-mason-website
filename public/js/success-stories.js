/*
 * Home page Success Stories: draw the newest stories from Vexur Case Studies into the three
 * card slots, in the same hm-post markup the section always used. The cards already in the
 * page stay as they are if this cannot load (no script, network error, empty response).
 */
(function () {
  var grid = document.querySelector('[data-success-stories]');
  if (!grid || !window.fetch) return;

  var entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return entities[c];
    });
  }

  function card(story) {
    return (
      '<a class="hm-post" href="' + esc(story.path) + '">' +
      '<div class="hm-post-img"><img loading="lazy" decoding="async" width="1024" height="683" src="' +
      esc(story.image) + '" alt="' + esc(story.title) + '"></div>' +
      '<span class="hm-post-date">' + esc(story.meta) + '</span>' +
      '<h3>' + esc(story.title) + '</h3>' +
      '<p>' + esc(story.excerpt) + '</p>' +
      '</a>'
    );
  }

  fetch('/api/success-stories', { credentials: 'omit' })
    .then(function (response) {
      return response.ok ? response.json() : null;
    })
    .then(function (data) {
      var stories = data && data.stories;
      if (!stories || !stories.length) return;
      grid.innerHTML = stories.map(card).join('');
    })
    .catch(function () {});
})();
