import Github from 'github';
import request from 'request-promise';
import { fs, tempDir, mkdirp } from 'appium-support';
import { exec } from 'teen_process';
import nodeFS from 'fs';
import path from 'path';
import unzip from 'unzip';
import B from 'bluebird';
import Handlebars from 'handlebars';

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

    const pathToAppiumFiles = await fs.readdir(pathToUnzipped);
    const pathToDocs = path.resolve(pathToUnzipped, pathToAppiumFiles[0], 'docs');

    return pathToDocs;
  } catch(e) {
    console.error('Could not download repo archive. ', e.message);
  }
};

async function buildDocs (pathToDocs) {
  const mkdocsTemplate = Handlebars.compile(await fs.readFile(path.resolve(__dirname, '..', 'mkdocs.yml'),  'utf8'));

  // Build the MkDocs for each language
  for (let language of LANGUAGES) {
    //await fs.copyFile(path.resolve(__dirname, '..', 'mkdocs.yml'), path.resolve(pathToDocs, language, 'mkdocs.yml'));
    console.log('MkDOCS yml', mkdocsTemplate({language}));
    await fs.writeFile(path.resolve(pathToDocs, 'mkdocs.yml'), mkdocsTemplate({language}));
    const pathToBuildDocsTo = path.resolve(__dirname, '..', 'docs', language);
    console.log("Building documents to", pathToDocs);
    await exec('mkdocs', ['build', '--site-dir', pathToBuildDocsTo], {
      cwd: pathToDocs,
    });

    // Copy to _site (TODO: How do we make Jekyll do this automatically?)
    const docsSubdirectory = path.resolve(__dirname, '..', '_site', 'docs', language);
    await mkdirp(path.resolve(__dirname, docsSubdirectory));
    await fs.copyFile(pathToBuildDocsTo, docsSubdirectory);
  }
};

(async () => {
  const pathToRepoDocs = await getRepoDocs('appium', 'appium');
  await buildDocs(pathToRepoDocs);
})();