
/* Highlight */
$( document ).ready(function() {
    hljs.initHighlightingOnLoad();
    $('table').addClass('table table-striped table-hover');
});


$('body').scrollspy({
    target: '.bs-sidebar',
});


/* Prevent disabled links from causing a page reload */
$("li.disabled a").click(function() {
    event.preventDefault();
});

/* handle menu/submenu toggling */
$('ul.dropdown-menu [data-toggle=dropdown]').on('click', function(event) {
  // Avoid following the href location when clicking
  event.preventDefault();
  // Avoid having the menu to close when clicking
  event.stopPropagation();

  // Close the currently opened menu if the menu-to-open is not a descendant of the currently opened one
  var menuToOpen = $(this).closest('.dropdown-submenu');
  var isAlreadyOpen = menuToOpen.hasClass("open");
  menuToOpen.parent().find('.open').removeClass("open");
  if (!isAlreadyOpen) {
    menuToOpen.addClass("open");
  }
});
