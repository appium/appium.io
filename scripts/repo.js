import { fs, logger } from 'appium-support';
import { exec } from 'teen_process';
import path from 'path';
import Handlebars from 'handlebars';
import _ from 'lodash';
import { fencedCodeTabifyDocument } from './tabs';
import { reassignMarkdownLinkDocument } from './links';
import { injectGithubLink } from './inject-github-link';
import { remap404Hrefs } from './href-remap';


const LANGUAGES = ['en', 'cn'];
const log = logger.getLogger('APPIUM.IO');

async function getAppiumDocs () {
  log.info(`Cloning Appium from GitHub with 1.x branch`);
  await exec('git', ['clone', '--single-branch', '--branch', '1.x', 'https://github.com/appium/appium.git', 'appium']);
  const pathToDocs = path.resolve('appium', 'docs');

  // Do some treating on the docs to get it working correctly
  await alterDocs(pathToDocs);

  return pathToDocs;
}

/**
 * Adjust the contents of the docs to fit proper MkDocs format
 *  - rename README.md to index.md
 * @param {String} pathToDocs
 */
async function alterDocs (pathToDocs) {
  for (const file of await fs.glob(path.resolve(pathToDocs, '**/*.md'))) {
    const stat = await fs.stat(path.resolve(pathToDocs, file));
    if (!stat.isDirectory()) {
      // Rename README.md to index.md
      if (file.toLowerCase() === 'readme.md') {
        const filePath = path.resolve(pathToDocs, file);
        await (fs.mv(filePath, path.resolve(pathToDocs, 'index.md')));
      }
    }
  }
}

async function alterHTML (pathToHTML, baseUrl) {
  for (const file of await fs.glob(path.resolve(pathToHTML, '**/*.html'))) {
    const stat = await fs.stat(path.resolve(pathToHTML, file));
    if (!stat.isDirectory()) {
      const filePath = path.resolve(pathToHTML, file);
      let treatedHTML = await fs.readFile(filePath, 'utf8');

      // HACK FIX. 404.html doesn't have right base URL, fix the hrefs
      if (filePath.endsWith('/404.html')) {
        treatedHTML = remap404Hrefs(treatedHTML, baseUrl);
      }

      // Add 'fenced code tab' UI
      treatedHTML = fencedCodeTabifyDocument(treatedHTML);

      // Fix links to documents
      treatedHTML = reassignMarkdownLinkDocument(treatedHTML);

      // Add link to GitHub page here
      treatedHTML = injectGithubLink(treatedHTML, filePath);

      await fs.writeFile(filePath, treatedHTML);
    }
  }
}

async function buildFromLocal () {
  const localAppium = process.env.LOCAL_APPIUM || process.cwd();
  if (!localAppium) {
    throw new Error('$LOCAL_APPIUM must be defined to build docs locally');
  } else if (!await fs.exists(localAppium)) {
    throw new Error(`${localAppium} not a valid path`);
  }
  const pathToDocs = path.resolve(localAppium, 'docs');
  await buildDocs(pathToDocs);
}

function buildDocYML (sitemap, baseDir = '', levelCount = 0) {
  let toc = '';
  let indent = ' '.repeat(levelCount * 2);
  for (const [category, content] of sitemap) {
    toc += `${indent}- '${category}':`;
    if (typeof content === 'string') {
      toc += ` '${baseDir}${content}'\n`;
    } else if (_.isArray(content) && content.length) {
      let nextBaseDir = baseDir + content[0] + '/';
      toc += '\n' + buildDocYML(content.slice(1), nextBaseDir, levelCount + 1);
    }
  }
  return toc;
}

async function buildDocs (pathToDocs) {
  const mkdocsTemplate = Handlebars.compile(await fs.readFile(path.resolve(__dirname, '..', 'mkdocs.yml'), 'utf8'));
  const themeDir = path.resolve(__dirname, '..', 'cinder');
  const sitemap = require(path.resolve(pathToDocs, 'toc.js'));
  log.debug(`Building HTML docs from Markdown ${pathToDocs}`);

  // Build the MkDocs for each language
  for (const language of LANGUAGES) {
    // generate pages yaml from the sitemap
    const toc = buildDocYML(sitemap[language]).trim();
    const baseUrl = `/docs/${language}`;
    log.debug(`Setting base url to ${baseUrl}`);

    // Construct the mkdocs.yml file
    await fs.writeFile(path.resolve(pathToDocs, 'mkdocs.yml'), mkdocsTemplate({language, themeDir, toc, baseUrl}));
    const pathToBuildDocsTo = path.resolve(__dirname, '..', 'docs', language);
    try {
      const args = ['build', '--site-dir', pathToBuildDocsTo];
      log.debug(`Executing 'mkdocs' with args ${JSON.stringify(args)} at directory '${pathToDocs}'`);
      await exec('mkdocs', args, {
        cwd: pathToDocs,
      });
    } catch (e) {
      log.error('Could not build', e.message);
      log.error('Reason:', e.stderr);
      throw e;
    }
    await alterHTML(pathToBuildDocsTo, baseUrl);
  }
  log.debug(`Built docs to ${path.resolve(__dirname, '..', 'docs')}`);
}

(async () => {
  if (process.env.BUILD_LOCAL_DOCS) {
    return await buildFromLocal();
  }
  const pathToRepoDocs = await getAppiumDocs();
  await buildDocs(pathToRepoDocs);
  await fs.rimraf('appium');
})().catch(log.error.bind(log));
