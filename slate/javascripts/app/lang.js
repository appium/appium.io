/*
Copyright 2008-2013 Concur Technologies, Inc.

Licensed under the Apache License, Version 2.0 (the "License"); you may
not use this file except in compliance with the License. You may obtain
a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations
under the License.
*/
!function(e){function t(e){if(e){var t=window.location.hash;t&&(t=t.replace(/^#+/,"")),history&&history.pushState({},"","?"+e+"#"+t),$("#lang-selector a").removeClass("active"),$("#lang-selector a[data-language-name='"+e+"']").addClass("active");for(var i=0;i<n.length;i++)$(".highlight."+n[i]).hide(),$(".desc."+n[i]).hide();$(".highlight."+e).show(),$(".desc."+e).show()}}function i(e){var i=(e[0],localStorage.getItem("language"));n=e,""!=location.search.substr(1)&&-1!=jQuery.inArray(location.search.substr(1),n)?(t(location.search.substr(1)),localStorage.setItem("language",location.search.substr(1))):t(null!==i&&-1!=jQuery.inArray(i,n)?i:n[0])}var n=[];e.setupLanguages=i,e.activateLanguage=t,$(function(){$("#lang-selector a").on("click",function(){var e=$(this).data("language-name");return t(e),!1}),window.onpopstate=function(){t(window.location.search.substr(1))}})}(window);