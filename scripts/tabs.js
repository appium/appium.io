import jQuery from 'jquery';
import { jsdom } from 'jsdom';

const $ = jQuery(jsdom().defaultView);

function stripLanguageComment (html) {
  return html.replace(/(<code [^>]*>)(\/\/ [^\s]*)/, '$1');
}

const LANGUAGE_DISPLAY_NAMES = {
  'php': 'PHP',
  'objectivec': 'Objective-C',
  'csharp': 'C#',
};

function capitalize (languageName) {
  languageName = languageName.toLowerCase();

  let capitalizedName = LANGUAGE_DISPLAY_NAMES[languageName];

  if (capitalizedName) {
    return capitalizedName;
  }

  return languageName.charAt(0).toUpperCase() + languageName.slice(1);
}

function appendLanguageBlock (tabEl, preEl, languageName, id, active) {
  const navTag = tabEl.find('.nav');
  navTag.append(`<li role="presentation" ${active ? 'class="active"' : ''} role="tab">
    <a href='#${id}' data-toggle='tab'>${capitalize(languageName)}</a>
  </li>`);
  const tabPanel = tabEl.find('.tab-content');
  let html = preEl[0].outerHTML;
  html = stripLanguageComment(html);
  tabPanel.append(`<div role="tabpanel" class="tab-pane ${active ? 'active' : ''}" id="${id}">${html.trim()}</div>`);
}

export function fencedCodeTabify (html) {
  const jqHTML = $(html);
  let tabTagHTML = `<div>
    <ul class="nav nav-tabs" role="tablist">
    </ul>
    <div class="tab-content">
    </div>
  </div>`;

  let tabPaneIndex = 0;

  jqHTML.find("pre > code").each((index, codeTag) => {
    const preTag = $(codeTag).parent();
    const siblings = preTag.nextAll();
    const tabEl = $(tabTagHTML);
    let language = capitalize($(codeTag).attr('class'));
    let siblingIndex = 0;
    appendLanguageBlock(tabEl, preTag, language, `${tabPaneIndex}_${siblingIndex++}`, true);
    siblings.each(function (index, siblingEl) {
      language = $(siblingEl).find('code').attr('class');
      if (!language) {
        return false;
      }
      appendLanguageBlock(tabEl, $(siblingEl), language, `${tabPaneIndex}_${siblingIndex++}`);
      $(siblingEl).remove();
    });
    if (siblingIndex > 1) {
      preTag.replaceWith(tabEl);
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