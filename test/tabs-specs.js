import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { fencedCodeTabify, fencedCodeTabifyDocument } from '../scripts/tabs';
import jQuery from 'jquery';
import { jsdom } from 'jsdom';
import { fs } from 'appium-support';
import path from 'path';

const $ = jQuery(jsdom().defaultView);

chai.use(chaiAsPromised);

const should = chai.should();

describe('Repo.js', function () {
  describe('.fencedCodeTabify', function () {
    it('should group code tags into one div', function () {
      const fencedCode = fencedCodeTabify(`<div>
        <pre>
          <code class='javascript'>JS code</code>
        </pre>
        <pre>
          <code class='php'>PHP code</code>
        </pre>
      </div>`)
      
      $(fencedCode, '.tab-pane').children().length.should.equal(2);
      $(fencedCode, 'li[role=presentation]').children().length.should.equal(2);
    });

    it('should ignore non-code tags', function () {
      const fencedCode = fencedCodeTabify(`<div>
        <pre>
          <code class='javascript'>JS code</code>
        </pre>
        <pre>
          <code class='c#'>C#</code>
        </pre>
        <div class='hello'>world</div>
        <pre>
        <code class='php'>PHP</code>
      </pre>
      </div>`);
      
      $(fencedCode).find('.nav-tabs').length.should.equal(2);
    });

    it('should make multiple fenced tabs', function () {
      const fencedCode = fencedCodeTabify(`<div>
        <pre>
          <code class='javascript'>JS code</code>
        </pre>
        <pre>
          <code class='php'>PHP code</code>
        </pre>
        <div>
            <pre>
            <code class='javascript'>JS code</code>
          </pre>
          <pre>
            <code class='php'>PHP code</code>
          </pre>
        </div>
      </div>`);

      $(fencedCode, '.nav-tabs').children().length.should.equal(2);
    });

    it('should strip out the language comment', function () {
      fencedCodeTabify(`<div>
        <pre>
          <code class='javascript'>// Javascript 
          JS code</code>
        </pre>
      </div>`).indexOf('// Javascript').should.be.below(0);
    });

    it('should parse an HTML file', async function () {
      fencedCodeTabifyDocument(await fs.readFile(path.resolve(__dirname, 'fixtures', 'sample.html'), 'utf8')).indexOf('nav-tabs').should.be.above(0);
    });

  });
});