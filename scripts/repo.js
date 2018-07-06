import Github from '@octokit/rest';
import request from 'request-promise';
import { fs, tempDir, mkdirp, logger } from 'appium-support';
import { exec } from 'teen_process';
import nodeFS from 'fs';
import path from 'path';
import unzip from 'unzip';
import B from 'bluebird';
import Handlebars from 'handlebars';
import _ from 'lodash';
import { fencedCodeTabifyDocument } from './tabs';
import { reassignMarkdownLinkDocument } from './links';

const LANGUAGES = ['en', 'cn'];
const log = logger.getLogger('APPIUM.IO');

async function unzipStream (readstream, pathToUnzipped) {
  return await new B((resolve, reject) => {
    readstream.pipe(unzip.Extract({
      path: pathToUnzipped,
    }));
    readstream.on('end', resolve);
    readstream.on('close', reject);
  });
}

async function getRepoDocs (owner, repo, branch='master') {
  // Pull down a zipball of Appium repository
  const github = new Github();
  const githubBranch = await github.repos.getBranch({owner, repo, branch});

  const ref = githubBranch.data.commit.sha;
  const downloadUrl = `https://api.github.com/repos/${owner}/${repo}/zipball/${ref}`;
  log.debug(`Downloading repo from: ${downloadUrl}`);
  const archive = await request(downloadUrl, {
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

async function alterHTML (pathToHTML) {
  for (const file of await fs.glob(path.resolve(pathToHTML, '**/*.html'))) {
    const stat = await fs.stat(path.resolve(pathToHTML, file));
    if (!stat.isDirectory()) {
      const filePath = path.resolve(pathToHTML, file);
      let treatedHTML = await fs.readFile(filePath, 'utf8');
      treatedHTML = fencedCodeTabifyDocument(treatedHTML);
      treatedHTML = reassignMarkdownLinkDocument(treatedHTML);
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

function buildDocYML (sitemap, baseDir='', levelCount=0) {
  let toc = '';
  let indent = ' '.repeat(levelCount * 2);
  for (let [category, content] of sitemap) {
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
  const mkdocsTemplate = Handlebars.compile(await fs.readFile(path.resolve(__dirname, '..', 'mkdocs.yml'),  'utf8'));
  const themeDir = path.resolve(__dirname, '..', 'cinder');
  const sitemap = require(path.resolve(pathToDocs, 'toc.js'));
  log.debug(`Building HTML docs from Markdown ${pathToDocs}`);

  // Build the MkDocs for each language
  for (let language of LANGUAGES) {
    // generate pages yaml from the sitemap
    let toc = buildDocYML(sitemap[language]);
    toc = toc.trim();
    const baseUrl = `/docs/${language}`;
    log.debug(`Setting base url to ${baseUrl}`);

    await fs.writeFile(path.resolve(pathToDocs, 'mkdocs.yml'), mkdocsTemplate({language, themeDir, toc, baseUrl}));
    const pathToBuildDocsTo = path.resolve(__dirname, '..', 'docs', language);
    try {
      const args = ['build', '--site-dir', pathToBuildDocsTo];
      log.debug(`Executing 'mkdocs' with args ${JSON.stringify(args)} at directory '${pathToDocs}'`);
      await exec('mkdocs', args, {
        cwd: pathToDocs,
      });
    } catch (e) {
      console.log('Could not build', e.message);
      console.log('Reason:', e.stderr);
      throw e;
    }
    await alterHTML(pathToBuildDocsTo);
  }
  log.debug(`Built docs to ${path.resolve(__dirname, '..', 'docs')}`);
}

(async () => {
  if (process.env.BUILD_LOCAL_DOCS) {
    return await buildFromLocal();
  }
  const pathToRepoDocs = await getRepoDocs('appium', 'appium');
  await buildDocs(pathToRepoDocs);
})().catch(console.error);
