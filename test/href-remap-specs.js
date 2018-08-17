import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { remap404Hrefs } from '../scripts/href-remap';
import { fs } from 'appium-support';
import path from 'path';
import jQuery from 'jquery';
import { JSDOM } from 'jsdom';
import isAbsoluteUrl from 'is-absolute-url';

const $ = jQuery(new JSDOM().window);

chai.use(chaiAsPromised);
chai.should();

describe('href-remap.js', function () {
  describe('.remap404Hrefs', function () {
    it('should should append hrefs with new base', function () {
      const html = remap404Hrefs(`<div><a href="/css/path"></a></div>`, '/docs/en');
      html.should.equal(`<html><head></head><body><div><a href="/docs/en/css/path"></a></div></body></html>`);
    });
    it('should remap sample 404.html page', async function () {
      const html = remap404Hrefs(await fs.readFile(path.resolve(__dirname, 'fixtures', '404.html'), 'utf8'), '/docs/en');
      $(html).find('*[href]').each((idx, value) => {
        const href = $(value).attr('href');
        if (href && !isAbsoluteUrl(href)) {
          href.startsWith('/docs/en').should.be.true;
        }
      });
      $(html).find('*[src]').each((idx, value) => {
        const href = $(value).attr('src');
        if (href && !isAbsoluteUrl(href)) {
          href.startsWith('/docs/en').should.be.true;
        }
      });
    });
  });
});