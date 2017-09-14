import Github from 'github';
import request from 'request-promise';
import { fs, tempDir, mkdirp } from 'appium-support';
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
const SITEMAP = {
  en: [
    ['Home', 'about-appium/intro.md'],
    ['About', ['about-appium',
      ['Introduction', 'intro.md'],
      ['The Appium Clients', 'appium-clients.md']]],
    ['Setup', ['appium-setup',
      ['Supported Platforms', 'platform-support.md'],
      ['Running on OS X', 'running-on-osx.md'],
      ['Running on Windows', 'running-on-windows.md'],
      ['Running on Linux', 'running-on-linux.md'],
      ['Android Setup', 'android-setup.md'],
      ['Android HAX Emulation', 'android-hax-emulator.md'],
      ['Real Device Setup', 'real-devices.md'],
      ['Real iOS Devices', 'real-devices-ios.md'],
      ['Real Android Devices', 'real-devices-android.md'],
      ['Setup for Parallel Testing', 'parallel_tests.md'],
      ['Troubleshooting', 'troubleshooting.md']]],
    ['Writing & Running Tests', ['writing-running-appium',
      ['Running Tests', 'running-tests.md'],
      ['CLI Arguments', 'server-args.md'],
      ['The --default-capabilities flag', 'default-capabilities-arg.md'],
      ['Desired Capabilities', 'caps.md'],
      ['Appium Command List', 'appium-bindings.md'],
      ['Finding Elements', 'finding-elements.md'],
      ['Mobile Web Testing', 'mobile-web.md'],
      ['Reset Strategies', 'reset-strategies.md'],
      ['Network Connection Guide', 'network_connection.md'],
      ['Touch Actions', 'touch-actions.md'],
      ['XCUITest Mobile Gestures', 'ios-xctest-mobile-gestures.md'],
      ['iOS Pasteboard Guide', 'ios-xctest-pasteboard.md'],
      ['iOS Predicate Guide', 'ios_predicate.md'],
      ['iOS Touch ID Guide', 'ios-touch-id.md'],
      ['UiSelector Guide', 'uiautomator_uiselector.md'],
      ['Android Code Coverage Guide', 'android_coverage.md'],
      ['Using Unicode with Appium', 'unicode.md'],
      ['The UiAutomator2 Driver', 'uiautomator2.md'],
      ['The Espresso Driver', 'espresso.md'],
      ['Windows App Testing', 'windows-app-testing.md']]],
    ['Advanced', ['advanced-concepts',
      ['Migrating to Appium 1.0', 'migrating-to-1-0.md'],
      ['Migrating to XCUITest', 'migrating-to-xcuitest.md'],
      ['Automating Hybrid Apps', 'hybrid.md'],
      ['Using Selenium Grid with Appium', 'grid.md'],
      ['Chromedriver Troubleshooting', 'chromedriver.md'],
      ['Cross-domain iframes', 'cross-domain-iframes.md'],
      ['Using ios-webkit-debug-proxy', 'ios-webkit-debug-proxy.md'],
      ['Using a custom WDA server', 'wda-custom-server.md'],
      ['The Event Timings API', 'event-timings.md'],
      ['The Settings API', 'settings.md']]],
    ['Contributing', ['contributing-to-appium',
      ['Running Appium from Source', 'appium-from-source.md'],
      ['Developer Overview', 'developers-overview.md'],
      ['Standard Gulp Commands', 'gulp.md'],
      ['Appium Style Guide', 'style-guide-2.0.md'],
      ['How to Write Docs', 'how-to-write-docs.md'],
      ['Appium Package Structure', 'appium-packages.md'],
      ['Credits', 'credits.md']]]
  ], cn: [
  ]
};

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
  const github = new Github({
    Promise: B,
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
  const localAppium = process.env.LOCAL_APPIUM;
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

  // Build the MkDocs for each language
  for (let language of LANGUAGES) {
    // generate pages yaml from the sitemap
    let toc = buildDocYML(SITEMAP[language]);
    toc = toc.trim();

    await fs.writeFile(path.resolve(pathToDocs, 'mkdocs.yml'), mkdocsTemplate({language, themeDir, toc}));
    const pathToBuildDocsTo = path.resolve(__dirname, '..', 'docs', language);
    try {
      await exec('mkdocs', ['build', '--site-dir', pathToBuildDocsTo], {
        cwd: pathToDocs,
      });
    } catch (e) {
      console.log('Could not build', e.message);
      console.log('Reason:', e.stderr);
      throw e;
    }
    await alterHTML(pathToBuildDocsTo);
  }
}

(async () => {
  if (process.env.BUILD_LOCAL_DOCS) {
    return await buildFromLocal();
  }
  const pathToRepoDocs = await getRepoDocs('appium', 'appium');
  await buildDocs(pathToRepoDocs);
})().catch(console.error);
