appium.io
=========

The public front-end for Appium, visible at [appium.io](http://appium.io).
There are two components to this:

1. A Jekyll server which takes markdown files and turns them into our public-facing website
2. A set of scripts which take the Appium docs and convert them to HTML using MkDocs

To locally preview appium.io

## Requirements

1. [Ruby 2.1.0 or higher](https://www.ruby-lang.org/en/downloads/)
1. Node + NPM
1. Ruby Bundler (`gem install bundler`)
1. pip (`brew install pip`)
1. MkDocs 0.16.3 (`pip install mkdocs==1.0.4`)

## Setup

```
bundle install
npm install
```

## Development

```
npm run build:docs
```

Build the docs locally. Must set env variable LOCAL_APPIUM to the path to your local appium repo

```
npm run build:docs:local
```

Start a local Jekyll server (this allows you to view appium.io at `localhost:4000`):

```
npm run serve
```

Lint & test:

```
npm run lint
npm run test
```

Crawl for broken links:

```
npm run crawl
```

## Publishing

Newly built docs must be committed and pushed to the `gh-pages` branch on GitHub.
