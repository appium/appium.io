import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { injectGithubLink } from '../scripts/inject-github-link';
import { fs } from 'appium-support';
import path from 'path';
import jQuery from 'jquery';
import { JSDOM } from 'jsdom';

const $ = jQuery(new JSDOM().window);

chai.use(chaiAsPromised);
chai.should();

describe('inject-github-link', function () {
  describe('.injectGithubLink', function () {
    it('should insert link to md', async function () {
      const filePath = process.cwd() + '/docs/en/about-appium/api/index.html';
      const html = injectGithubLink(await fs.readFile(path.resolve(__dirname, 'fixtures', 'command-page.html'), 'utf8'), filePath);
      const el = $(html).find('#github-link');
      el.should.exist;
      el.html().should.contain('Edit this Doc');
      el.attr('href').should.equal(`https://github.com/appium/appium/edit/master/docs/en/about-appium/api.md`);
      el.length.should.equal(1);
    });

    it('should insert link to command yml', async function () {
      const filePath = process.cwd() + '/docs/en/commands/status/index.html';
      const html = injectGithubLink(await fs.readFile(path.resolve(__dirname, 'fixtures', 'command-page.html'), 'utf8'), filePath);
      const el = $(html).find('#github-link');
      el.should.exist;
      el.html().should.contain('Edit this Doc');
      el.attr('href').should.equal(`https://github.com/appium/appium/edit/master/commands-yml/commands/status.yml`);
      el.length.should.equal(1);
    });
  });
});