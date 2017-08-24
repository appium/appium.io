import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { reassignMarkdownLink } from '../scripts/links';

chai.use(chaiAsPromised);
chai.should();

describe('links.js', function () {
  describe('.reassignMarkdownLink', function () {
    it('should change extension of absolute paths from .md to html', function () {
      reassignMarkdownLink(`<div><a href="/docs/en/path/to/hello-world.md"></a></div>`).should.equal(`<a href="/docs/en/path/to/hello-world/index.html"></a>`);
    });
    it('should ignore absolute URL paths', function () {
      const markup = `<div><a href="http://example.com/docs/en/path/to/hello-world.md"></a></div>`;
      reassignMarkdownLink(markup).should.equal(`<a href="http://example.com/docs/en/path/to/hello-world.md"></a>`);
    });
    it('should change extensions of relative paths', function () {
      reassignMarkdownLink(`<div><div><a href="docs/en/path/to/hello-world.md"></a></div></div>`).should.equal(`<div><a href="docs/en/path/to/hello-world/index.html"></a></div>`);
    });
    it('should change extensions of multiple absolute paths from .md to html', function () {
      reassignMarkdownLink(`<div><div><a href="/docs/en/path/to/hello-world.md"><a href="foo-bar.md"></a></div></div>`)
        .should.equal(`<div><a href="/docs/en/path/to/hello-world/index.html"></a><a href="foo-bar/index.html"></a></div>`);
    });
  });
});