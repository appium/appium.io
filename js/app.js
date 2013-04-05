!function ($) {
  // make code pretty
  window.prettyPrint && prettyPrint();
  // side bar
  $('.bs-docs-sidenav').affix({
    offset: {
      top: function () { return $(window).width() <= 980 ? 290 : 210 }
    , bottom: 270
    }
  });
  // Disable certain links in docs
  $('section [href^=#]').click(function (e) {
    e.preventDefault();
  });
}(window.jQuery)
