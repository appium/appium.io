import Github from 'github';
import request from 'request-promise';
import { fs, tempDir, mkdirp } from 'appium-support';
import { exec } from 'teen_process';
import nodeFS from 'fs';
import path from 'path';
import unzip from 'unzip';
import B from 'bluebird';
import Handlebars from 'handlebars';
import { fencedCodeTabifyDocument } from './tabs';

const LANGUAGES = ['en', 'cn'];

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

      // Rename README.md to index.md
      if (file.toLowerCase() === 'readme.md') {
        await(fs.mv(filePath, path.resolve(pathToDocs, 'index.md')));
      }
    }
  }
}

async function applyTabs (pathToHTML) {
  for (let file of await fs.readdir(pathToHTML)) {
    const stat = await fs.stat(path.resolve(pathToHTML, file));
    if (stat.isDirectory()) {
      applyTabs(path.resolve(pathToHTML, file));
    } else {
      const filePath = path.resolve(pathToHTML, file);
      if (path.extname(file) === '.html') {
        let treatedHTML = fencedCodeTabifyDocument(await fs.readFile(filePath, 'utf8'));
        await fs.writeFile(filePath, treatedHTML);
      }
    }
  }
}

async function buildDocs (pathToDocs) {
  const mkdocsTemplate = Handlebars.compile(await fs.readFile(path.resolve(__dirname, '..', 'mkdocs.yml'),  'utf8'));
  const themeDir = path.resolve(__dirname, '..', 'cinder');

  // Build the MkDocs for each language
  for (let language of LANGUAGES) {
    await fs.writeFile(path.resolve(pathToDocs, 'mkdocs.yml'), mkdocsTemplate({language, themeDir}));
    const pathToBuildDocsTo = path.resolve(__dirname, '..', 'docs', language);
    await exec('mkdocs', ['build', '--site-dir', pathToBuildDocsTo], {
      cwd: pathToDocs,
    });
    await applyTabs(pathToBuildDocsTo);
  }
};

(async () => {
  const pathToRepoDocs = await getRepoDocs('appium', 'appium');
  await buildDocs(pathToRepoDocs);
})().catch(console.error);
