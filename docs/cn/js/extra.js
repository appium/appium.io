/* eslint-disable */
"use strict";

(function () {
  function setCookie(key, value) {
    var expires = new Date();
    expires.setTime(expires.getTime() + (1 * 24 * 60 * 60 * 1000));
    document.cookie = key + '=' + value + ';expires=' + expires.toUTCString();
  }

  function getCookie(key) {
      var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
      return keyValue ? keyValue[2] : null;
  }

  function setActiveLanguage (languageChoice) {
    languageChoice = languageChoice || 'java';
    setCookie('language-choice', languageChoice);
    $('a[data-language="' + languageChoice + '"]').tab('show');
  }

  function handleLanguageSelect (e) {
    var jqEl = $(e.target);
    var languageChoice = jqEl.attr('data-language');
    setActiveLanguage(languageChoice);
  }

  $(document).ready(() => {
    var languageChoice = getCookie('language-choice');
    setActiveLanguage(languageChoice);
    $('a[data-language]').on('click', handleLanguageSelect);
  });
})();