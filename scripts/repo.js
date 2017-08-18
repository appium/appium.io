import Github from 'github';
import request from 'request-promise';
import { fs, tempDir, mkdirp } from 'appium-support';
import nodeFS from 'fs';
import path from 'path';
import unzip from 'unzip';
import B from 'bluebird';

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

(async () => {
  const pathToRepoDocs = await getRepoDocs('appium', 'appium');
})();