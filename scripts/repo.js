import Github from 'github';
import request from 'request-promise';
import { fs, tempDir, mkdirp } from 'appium-support';
import { exec } from 'teen_process';
import nodeFS from 'fs';
import path from 'path';
import unzip from 'unzip';
import B from 'bluebird';
import Handlebars from 'handlebars';
import { quote } from './encode';
import jQuery from 'jquery';
import { jsdom } from 'jsdom';

const $ = jQuery(jsdom().defaultView);
const LANGUAGES = ['en', 'cn'];

function stripLanguageComment (html) {
  return html.replace(/(<code [^>]*>)(\/\/ [^\s]*)/, '$1');
}

function capitalize (languageName) {
  if (languageName === 'php') {
    return 'PHP';
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

  jqHTML.find("pre > code").each((index, codeTag) => {
    const preTag = $(codeTag).parent();
    const siblings = preTag.nextAll();
    const tabEl = $(tabTagHTML);
    let language = capitalize($(codeTag).attr('class'));
    let tagIndex = 1;
    appendLanguageBlock(tabEl, preTag, language, `${tagIndex++}_${index}`, true);
    siblings.each(function (index, siblingEl) {
      language = $(siblingEl).find('code').attr('class');
      if (!language) {
        return false;
      }
      appendLanguageBlock(tabEl, $(siblingEl), language, `${tagIndex}_${index}`);
      $(siblingEl).remove();
    });
    preTag.replaceWith(tabEl);
  });

  return jqHTML.html();
}

async function unzipStream (readstream, pathToUnzipped) {
  return new B((resolve, reject) => {
      readstream.pipe(unzip.Extract({
        path: pathToUnzipped,
      }));
      readstream.on('end', resolve);
      readstream.on('close', reject);
  });
}

async function getRepoDocs(owner, repo, branch='master') {
  try {
    // Pull down a zipball of Appium repository
    const github = new Github({
        Promise: require('bluebird')
    });
    const githubBranch = await github.repos.getBranch({owner, repo, branch});
    const ref = githubBranch.data.commit.sha;
    const archive = await request(`https://api.github.com/repos/${owner}/${repo}/zipball/${ref}`, {
      headers: {
        'User-Agent': 'appium',
      },
      encoding: null,
    });

    // Unzip it to a temporary directory
    const tempdir = await tempDir.openDir();
    const pathToZip = path.resolve(tempdir, 'appium.zip');
    await fs.writeFile(pathToZip, archive);
    const readStream = nodeFS.createReadStream(pathToZip);

    const pathToUnzipped = path.resolve(tempdir, 'appium', branch);
    await mkdirp(pathToUnzipped);

    await unzipStream(readStream, pathToUnzipped);

    // Get a reference to the path to the docs
    const pathToAppiumFiles = await fs.readdir(pathToUnzipped);
    const pathToDocs = path.resolve(pathToUnzipped, pathToAppiumFiles[0], 'docs');

    // Do some treating on the docs to get it working correctly
    await alterDocs(pathToDocs);

    return pathToDocs;
  } catch(e) {
    console.error('An error occurred. ', e.message);
  }
};

/**
 * Adjust the contents of the docs to fit proper MkDocs format
 *  - rename README.md to index.md
 * @param {*} pathToDocs 
 */
async function alterDocs (pathToDocs) {
  for (let file of await fs.readdir(pathToDocs)) {
    const stat = await fs.stat(path.resolve(pathToDocs, file));
    if (stat.isDirectory()) {
      alterDocs(path.resolve(pathToDocs, file));
    } else {
      const filePath = path.resolve(pathToDocs, file);

      // Encode UTF8 characters
      const fileContents = await fs.readFile(filePath, 'utf8');
      await fs.writeFile(filePath, quote(fileContents));

      // Rename README.md to index.md
      if (file.toLowerCase() === 'readme.md') {
        await(fs.mv(filePath, path.resolve(pathToDocs, 'index.md')));
      }
    }
  }
}

async function buildDocs (pathToDocs) {
  const mkdocsTemplate = Handlebars.compile(await fs.readFile(path.resolve(__dirname, '..', 'mkdocs.yml'),  'utf8'));

  // Build the MkDocs for each language
  for (let language of LANGUAGES) {
    await fs.writeFile(path.resolve(pathToDocs, 'mkdocs.yml'), mkdocsTemplate({language}));
    const pathToBuildDocsTo = path.resolve(__dirname, '..', 'docs', language);
    await exec('mkdocs', ['build', '--site-dir', pathToBuildDocsTo], {
      cwd: pathToDocs,
    });

    // Copy to _site (TODO: How do we make Jekyll do this automatically?)
    /*const docsSubdirectory = path.resolve(__dirname, '..', '_site', 'docs', language);
    await mkdirp(path.resolve(__dirname, docsSubdirectory));
    await fs.copyFile(pathToBuildDocsTo, docsSubdirectory);*/
  }
};

if (!process.env.TEST) {
  (async () => {
    const pathToRepoDocs = await getRepoDocs('appium', 'appium');
    await buildDocs(pathToRepoDocs);
  })();
}