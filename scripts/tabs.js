import jQuery from 'jquery';
import { JSDOM } from 'jsdom';
import ejs from 'ejs';

const $ = jQuery(new JSDOM().window);

function stripLanguageComment (html) {
  return html.replace(/(<code [^>]*>)(\/\/ [^\s]*\n)/, '$1')
    .replace(/(<code [^>]*>)(# [^\s]*\n)/, '$1');
}

const LANGUAGE_DISPLAY_NAMES = {
  'php': 'PHP',
  'objectivec': 'Objective-C',
  'csharp': 'C#',
};

const LANGUAGE_ORDER = ['java', 'python', 'javascript', 'ruby', 'csharp', 'php', 'objectivec'];

function capitalize (languageName) {
  if (!languageName) {
    return '';
  }

  const capitalizedName = LANGUAGE_DISPLAY_NAMES[languageName.toLowerCase()];
  if (capitalizedName) {
    return capitalizedName;
  }

  return languageName.charAt(0).toUpperCase() + languageName.slice(1);
}


let languageBlocks = [];

function pushLanguageBlock (language, html, tabPaneIndex) {
  languageBlocks.push({
    language: language.toLowerCase(),
    capitalizedLanguage: capitalize(language),
    html: stripLanguageComment(html),
    tabPaneIndex,
  });
}

export function fencedCodeTabify (html) {
  const jqHTML = $(html);

  let tabPaneIndex = 0;


  jqHTML.find('pre > code').each((index, codeTag) => {
    languageBlocks = [];

    // Get the language 'code' tags
    const preTag = $(codeTag).parent();
    const siblings = preTag.nextAll();
    let language = capitalize($(codeTag).attr('class'));

    // Push code tags to an array
    let siblingCount = 1;
    pushLanguageBlock(language, preTag[0].outerHTML, tabPaneIndex);
    siblings.each(function (index, siblingEl) {
      language = $(siblingEl).find('code').attr('class');
      if (!language) {
        return false;
      }
      siblingCount++;
      pushLanguageBlock(language, $(siblingEl)[0].outerHTML, tabPaneIndex);
      $(siblingEl).remove();
    });
    if (siblingCount > 1) {
      const tabTemplate = `<div>
        <ul class="nav nav-tabs" role="tablist">
          <% for (var i=0; i<languages.length; i++) { %>
          <li role="presentation" class="<%= i === 0 ? 'active' : '' %>">
              <a href="#<%= languages[i].tabPaneIndex + '_' + i %>" data-language=<%= languages[i].language %> data-toggle="tab"><%= languages[i].capitalizedLanguage %></a>
          </li>
          <% } %>
        </ul>
        <div class="tab-content">
          <% for (var i=0; i<languages.length; i++) { %>
          <div role="tabpanel" class="tab-pane <%= i === 0 ? 'active' : '' %>" id="<%= languages[i].tabPaneIndex + '_' + i %>">
            <%- languages[i].html %>
          </div>
          <% } %>
        </div>
      </div>`;

      // Sort the language by priority
      languageBlocks.sort((blockOne, blockTwo) => (
        (LANGUAGE_ORDER.indexOf(blockOne.language) < 0 || LANGUAGE_ORDER.indexOf(blockOne.language) > LANGUAGE_ORDER.indexOf(blockTwo.language)) ? 1 : -1
      ));
      preTag.replaceWith($(ejs.render(tabTemplate, {languages: languageBlocks})));
      languageBlocks = [];
      tabPaneIndex++;
    }
  });

  return jqHTML.html();
}

/**
 * Takes a document, parses out the body and then adds fenced code to the body
 * @param {*} htmlDocString
 */
export function fencedCodeTabifyDocument (htmlDocString) {
  const body = '<div id="body-mock">' + htmlDocString.replace(/^[\s\S]*<body.*?>|<\/body>[\s\S]*$/ig, '') + '</div>';
  const newBody = fencedCodeTabify(body);
  const bodyStart = htmlDocString.indexOf('<body>') + '<body>'.length;
  const bodyEnd = htmlDocString.indexOf('</body>');
  return htmlDocString.substr(0, bodyStart) + newBody + htmlDocString.substr(bodyEnd, htmlDocString.length - bodyEnd);
}
