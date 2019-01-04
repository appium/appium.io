import { JSDOM } from 'jsdom';
import jQuery from 'jquery';
import relative from 'relative';


export function injectGithubLink (html, filePath) {
  const relativeLink = relative(process.cwd() + '/docs', filePath);
  const paths = relativeLink.split('/');

  let githubLink;
  if (paths[1] === 'commands') {
    const commandsPath = paths.slice(2, paths.length - 1).join('/');
    githubLink = `https://github.com/appium/appium/edit/master/commands-yml/commands/${commandsPath}.yml`;
  } else {
    const mdPath = paths.slice(0, paths.length - 1); // Omit the 'index.html' part of the path
    githubLink = `https://github.com/appium/appium/edit/master/docs/${mdPath.join('/')}.md`;
  }
  const jsdom = new JSDOM(html);
  const win = jsdom.window;
  const $ = jQuery(win);

  const headers = $('.documentation h2, .documentation h1');
  const mainHeader = headers.first();
  mainHeader.prepend(`<a id='github-link' style='padding: 4px 4px;' class='btn btn-default pull-right' href='${githubLink}'>
    <i class="glyphicon glyphicon-pencil"></i>
    &nbsp;&nbsp;Edit this Doc
  </a>`);

  return jsdom.serialize();
}
