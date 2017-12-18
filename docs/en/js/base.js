
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
  // toggle the closest dropdown
  $(this).closest(".dropdown-submenu").toggleClass("open");
});
