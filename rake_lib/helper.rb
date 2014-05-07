# stdlib
require 'date'

# ruby gems
require 'rubygems'
require 'posix/spawn'

# local
require_relative 'files'
require_relative 'repo'

# Enforce UTF-8 Encoding
Encoding.default_external = Encoding::UTF_8
Encoding.default_internal = Encoding::UTF_8

module AppiumIo
  class Helper
    include AppiumIo::Files

    attr_reader :default_checkout, :git_dir, :appium_repo, :api_docs_repo

    # Creates a new Helper object. The appium repository is cloned and updated.
    #
    # git_dir    - dir to clone git repos into. defaults to appium_io_git
    # appium_dir - clone of appium/appium
    # api_docs_dir - clone of appium/api-docs
    def initialize opts={}
      @git_dir         = expand_path '../appium.io_workspace'

      # appium repo. always fetch from appium/appium. ignore @username
      appium_path      = repo_path 'appium.git'
      appium_clone_url = 'https://github.com/appium/appium.git'
      @appium_repo     = Repo.new path: appium_path, clone: appium_clone_url

      @default_checkout  = 'master'

      # api docs repo
      api_docs_path      = repo_path 'api-docs.git'
      api_docs_clone_url = 'https://github.com/appium/api-docs.git'
      @api_docs_repo     = Repo.new path: api_docs_path, clone: api_docs_clone_url, master: true

      # tutorial repo
      # todo: support tutorial once it's updated to work with Slate
    end

    def repo_path path
      raise 'git dir must be set' unless @git_dir
      join @git_dir, path
    end

    # docs are published exactly once per tag
    # the docs never change after publishing
    def update_docs
      tags = @appium_repo.valid_tags
      # target branches instead of tags until the new tags are available
      tags = @appium_repo.branches

      metadata = []
      tags.each do |tag|
        @appium_repo.checkout tag

        # copy english readme into the english docs
        readme_src = join @appium_repo.path, 'README.md'
        readme_dst = join(@appium_repo.path, 'docs', 'en', 'README.md')
        copy_entry readme_src, readme_dst

        # fix readme links for Slate
        data = File.read readme_dst
        data.gsub!('](docs/en/)', '](#)')
        data.gsub!('](sample-code/examples)', '](https://github.com/appium/appium/tree/master/sample-code/examples)')
        File.open(readme_dst, 'w') { |f| f.write data }

        # copy english contributing into the english docs
        contributing_src = join @appium_repo.path, 'CONTRIBUTING.md'
        copy_entry contributing_src, join(@appium_repo.path, 'docs', 'en', 'CONTRIBUTING.md')

        source = join @appium_repo.path, 'docs', '*'
        Dir.glob(source) do |path|
          path     = expand_path path
          language = basename path
          dest     = join Dir.pwd, 'docs', language, tag

          # # tags never change so don't override
          # next if exists? dest
          # # overwrite for testing
          rm_rf dest if exists? dest

          copy_entry path, dest

          process_with_slate input: dest, language: language, tag: tag
          metadata << [language, tag]
        end
      end

      File.open('_data/slate.yml', 'w') do |f|
        result = ''
        metadata.each do |language, tag|
          # must be exactly two spaces before tag or YAML parsing fails
          result += "\n- language: #{language}\n  tag: #{tag}\n"
        end

        f.write result.strip
      end
    end

    def process_with_slate opts={}
      input    = opts[:input]
      language = opts[:language]
      tag      = opts[:tag]

      raise 'Must pass input, language, and tag' unless input && language && tag

      # doc_folder - pwd/docs/en/v1.0.0-beta
      publish_folder = join Dir.pwd, 'slate', language, tag

      # lint input directory
      @api_docs_repo.sh 'appium_doc_lint', input
      # merge into one .md file
      @api_docs_repo.sh "rake md[#{input}]"
      # generate html
      @api_docs_repo.sh 'rake build'

      build_folder = join @api_docs_repo.path, 'build'
      copy_entry build_folder, publish_folder
    end

    def rewrite_github_links data, prefix='docs/'
      data.gsub(/(?<!!) \[ ( [^\[]* ) \] \( ( [^)]+ ) \)/mx) do |full|
        result = full

        link_text   = $1
        link_target = $2
        link_target = link_target.strip if link_target

        if link_target && link_target.start_with?(prefix)
          link_target = File.basename link_target
          ext         = File.extname link_target

          unless ext.empty?
            # If a link has a hash, use that. Otherwise link to the start of the file.
            ext, hash = ext.split '#'
            if ext == '.md'
              # use english version of the master branch
              # todo: replace with tag
              result = " [#{link_text}](/slate/en/master/##{hash || link_target.split('/').last.strip})"
            end
          end
        end

        result
      end
    end

    # readme is always updated from the newest tag
    def update_readme
      raise 'Unable to find newest tag' unless default_checkout # @appium_repo.newest_tag

      yaml = <<YAML
---
permalink: /getting-started.html
layout: default
title: Getting started
description: Want to rock your mobile app automation? This is how you get started!
---

YAML

      @appium_repo.checkout default_checkout # @appium_repo.newest_tag

      source = join @appium_repo.path, 'README.md'
      dest   = join Dir.pwd, 'getting-started.md'

      puts "update_readme :: Using: #{File.basename(source)} from tag #{default_checkout}"
      copy_entry source, dest

      # Prepend with yaml
      data = File.read dest

      # for legacy reasons, the readme may have yaml already
      data.gsub! /^---.*---$/m, ''

      data = rewrite_github_links data

      # Fix readme links for Jekyll
      # - contributing lacks docs/ prefix
      # - docs/en links to github
      # - sample code links to github
      data.gsub!('](CONTRIBUTING.md)', '](/slate/en/master/#CONTRIBUTING.md)')
      data.gsub!('](docs/en/)', '](/slate/en/master/)')
      data.gsub!('](sample-code/examples)', '](https://github.com/appium/appium/tree/master/sample-code/examples)')

      File.open(dest, 'w') { |f| f.write(yaml + data) }
    end

    def update_intro
      branch = default_checkout # @appium_repo.newest_tag
      raise 'Unable to find newest tag' unless branch
      @appium_repo.checkout branch

      # intro.md doesn't exist in some early tags
      source = join @appium_repo.path, 'docs', 'en', 'intro.md'

      # if there's not a tagged version, use the master branch
      unless File.exist?(source)
        @appium_repo.checkout 'master'
        branch = 'master'
      end
      raise "intro.md doesn't exist on #{branch}" unless File.exist?(source)

      puts "update_intro :: using intro.md from #{branch}"
      yaml = <<YAML
---
permalink: /introduction.html
layout: default
title: Introduction
description: Introduction to Appium's Philosophy, Design and Concepts
---

YAML

      dest = join Dir.pwd, 'intro.md'
      copy_entry source, dest

      # Prepend with yaml
      data = rewrite_github_links File.read(dest), ''
      File.open(dest, 'w') { |f| f.write(yaml + data) }
    end
  end # class Helper
end # module AppiumIo