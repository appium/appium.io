(function ($) {
    // update active link
    // set active class on nav navbar-nav
    var href = window.location.pathname;

    // activate documentation for nested docs
    // example: docs/1.0-beta/cn/index.html
    if (href.indexOf('/docs/') === 0) {
        href = '/documentation.html';
    }

    var link = $('#bs-example-navbar-collapse-1 a[href="' + href + '"]');
    link.parent().addClass("active");

    // side bar
    $('.bs-docs-sidenav').affix({
        offset: {
            top: function () {
                return $(window).width() <= 980 ? 290 : 210
            }, bottom: 270
        }
    });

    // Disable certain links in docs
    $('section [href^=#]').click(function (e) {
        e.preventDefault();
    });
}(window.jQuery));