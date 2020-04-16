const blc = require('broken-link-checker');
const chalk = require('chalk');
const humanizeDuration = require('humanize-duration');
const log = require('fancy-log');


let siteUrl = 'http://127.0.0.1:4000';
const lastArg = process.argv[process.argv.length - 1];
if (!lastArg.endsWith(__filename)) {
  siteUrl = lastArg;
}

const excludedUrls = [
  'apple.com',
  'search.maven.org',
  'wiki.jenkins.io', // This domain is slow response
  // 'https://github.com/',
];

function logPage (url) {
  log(`${chalk.white('Getting links from: ')} ${chalk.yellow(url)}`);
}

function logMetrics (brokenLinks, excludedLinks, totalLinks, duration) {
  let output = chalk.gray(`Finished! ${totalLinks} links found.`);

  if (excludedLinks > 0) {
    output += chalk.gray(` ${excludedLinks} excluded.`);
  }

  if (totalLinks > 0) {
    output += chalk[brokenLinks > 0 ? 'red' : 'green'](` ${brokenLinks} broken`);
    output += chalk.gray('.');
  }

  if (duration) {
    output += chalk.gray(`\nElapsed time: `);
    output += chalk.gray(humanizeDuration(duration, {round: true, largest: 2}));
  }

  log(output);
}

let data = {
  delay: null,
  page: {
    brokenLinks: 0,
    currentIndex: 0,
    done: false,
    excludedLinks: 0,
    totalLinks: 0,
  },
  total: {
    brokenLinks: [],
    excludedLinks: 0,
    links: 0,
    pages: 0,
    startTime: Date.now()
  },
};

const handlers = {
  html (tree, robots, response, pageUrl) {
    // get everything back to the beginning for this page
    data.page.brokenLinks = 0;
    data.page.currentIndex = 0;
    data.page.done = false;
    data.page.excludedLinks = 0;
    data.page.totalLinks = 0;

    logPage(pageUrl);
  },
  junk () {
    data.page.totalLinks++;
    data.page.excludedLinks++;

    data.total.links++;
    data.total.excludedLinks++;
  },
  link (result) {
    data.page.totalLinks++;
    data.total.links++;

    if (result.broken === true) {
      const url = result.url.resolved ? result.url.resolved : result.url.original;
      const base = result.base.resolved ? result.base.resolved : result.base.original;
      data.page.brokenLinks++;
      data.total.brokenLinks.push({url, base});
      log(`  BROKEN - ${url} (${result.brokenReason})`);
    }
  },
  page (error, pageUrl) {
    if (error) {
      logPage(pageUrl);

      log(chalk[error.code !== 200 ? 'red' : 'gray'](`${error.name}: ${error.message}`));
    } else {
      data.page.done = true;

      logMetrics(data.page.brokenLinks, data.page.excludedLinks, data.page.totalLinks);
    }
  },
  end () {
    if (data.total.brokenLinks.length) {
      log('Broken links');
      for (const link of data.total.brokenLinks) {
        log(`  Page: ${chalk.yellow(link.base)}`);
        log(`    -> ${chalk.red(link.url)}`);
      }
    }
    logMetrics(data.total.brokenLinks.length, data.total.excludedLinks, data.total.links, Date.now() - data.total.startTime);
    process.exit(data.total.brokenLinks.length === 0 ? 0 : 1);
  }
};

const instance = new blc.SiteChecker({
  excludedKeywords: excludedUrls,
  requestMethod: 'get',
}, handlers);

instance.enqueue(siteUrl);
