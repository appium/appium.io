import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { fencedCodeTabify, fencedCodeTabifyDocument } from '../scripts/tabs';
import jQuery from 'jquery';
import { jsdom } from 'jsdom';
import { fs } from 'appium-support';
import path from 'path';

const $ = jQuery(jsdom().defaultView);

chai.use(chaiAsPromised);
chai.should();

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
      </div>`);

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
        <pre>
          <code class='c#'>C#</code>
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

    it('should not do tabs if only one code block', function () {
      fencedCodeTabify(`<div>
        <pre>
          <code class='javascript'>JS code</code>
        </pre>
      </div>`).indexOf('nav-tabs').should.be.below(0);
    });

    it('should link correct tabs', function () {
      const fencedCode = fencedCodeTabify(`<div>
        <pre>
          <code class='javascript'>JS code</code>
        </pre>
        <pre>
          <code class='php'>PHP</code>
        </pre>
        <div>Hello World</div>
        <pre>
          <code class='javascript'>JS code</code>
        </pre>
        <pre>
          <code class='php'>PHP</code>
        </pre>
      </div>`);

      fencedCode.indexOf('0_0').should.be.above(0);
      fencedCode.indexOf('1_1').should.be.above(0);
      fencedCode.indexOf('1_0').should.be.above(0);
      fencedCode.indexOf('1_1').should.be.above(0);
    });

    it('should strip out the language comment', function () {
      fencedCodeTabify(`<div>
        <pre>
          <code class='javascript'>// Javascript 
          JS code</code>
        </pre>
        <pre>
          <code class='javascript'>// Javascript 
          JS code</code>
        </pre>
      </div>`).indexOf('// Javascript').should.be.below(0);
    });

    it('should order the language comments by priority', function () {

      const html = fencedCodeTabify(`<div>
        <pre>
          <code class='prolog'>// Prolog 
          Prolog code</code>
        </pre>
        <pre>
          <code class='python'>// Python 
          JS code</code>
        </pre>
        <pre>
          <code class='java'>// Java 
          JS code</code>
        </pre>
      </div>`);

      html.indexOf('java').should.be.below(html.indexOf('python'));
      html.indexOf('python').should.be.below(html.indexOf('prolog'));
    });

    it('should parse an HTML file', async function () {
      fencedCodeTabifyDocument(await fs.readFile(path.resolve(__dirname, 'fixtures', 'sample.html'), 'utf8')).indexOf('nav-tabs').should.be.above(0);
    });

  });
});