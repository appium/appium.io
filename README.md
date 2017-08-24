appium.io
=========

The public front-end for Appium, visible at [appium.io](http://appium.io).
There are two components to this:

1. A Jekyll server which takes markdown files and turns them into our public-facing website
2. A set of scripts which take the Appium docs and convert them to HTML using MkDocs

To locally preview appium.io

## Requirements

1. [Ruby 2.1.0 or higher](https://www.ruby-lang.org/en/downloads/)
2. Node + NPM
3. Ruby Bundler (`gem install bundler`)
4. MkDocs (`brew install mkdocs`)

## Setup

```
bundle install
npm install
```

## Development

Build the docs (this clones the Appium repo with its docs folder into a temp
directory, and runs MkDocs on that to generate HTML inside the local `docs/`
folder)

```
npm run build:docs
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

## Publishing

Newly built docs must be committed and pushed to the `gh-pages` branch on GitHub.
