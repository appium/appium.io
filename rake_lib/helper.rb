# stdlib
require 'date'

# ruby gems
require 'rubygems'
require 'posix-spawn'
require 'nokogiri'

# local
require_relative 'files'
require_relative 'repo'

# Enforce UTF-8 Encoding
Encoding.default_external = Encoding::UTF_8
Encoding.default_internal = Encoding::UTF_8

module AppiumIo
  class Helper
    include AppiumIo::Files

    attr_reader :default_checkout, :git_dir, :appium_repo, :api_docs_repo, :tutorial_repo,
                :dot_app_repo, :dot_exe_repo

    # Creates a new Helper object. The appium repository is cloned and updated.
    #
    # git_dir    - dir to clone git repos into. defaults to appium_io_git
    # appium_dir - clone of appium/appium
    # api_docs_dir - clone of appium/api-docs
    def initialize opts={}
      opts = {:refresh => true}.merge(opts)

      @@slate_published_once = false
      @git_dir               = expand_path '../appium.io_workspace'
      @default_checkout      = 'master'

      # appium repo. always fetch from appium/appium. ignore @username
      appium_path            = repo_path 'appium.git'
      appium_clone_url       = 'https://github.com/appium/appium.git'
      @appium_repo           = Repo.new path: appium_path, clone: appium_clone_url, refresh: opts[:refresh]

      # api docs repo
      api_docs_path          = repo_path 'api-docs.git'
      api_docs_clone_url     = 'https://github.com/appium/api-docs.git'
      @api_docs_repo         = Repo.new path: api_docs_path, clone: api_docs_clone_url, master: true, refresh: opts[:refresh]

      # tutorial repo
      tutorial_path          = repo_path 'tutorial.git'
      tutorial_clone_url     = 'https://github.com/appium/tutorial.git'
      @tutorial_repo         = Repo.new path: tutorial_path, clone: tutorial_clone_url, master: true, refresh: opts[:refresh]

      # appium-dot-app
      dot_app_path           = repo_path 'dot_app'
      dot_app_clone_url      = 'https://github.com/appium/appium-dot-app.git'
      @dot_app_repo          = Repo.new path: dot_app_path, clone: dot_app_clone_url, master: true, refresh: opts[:refresh]

      # appium-dot-exe
      dot_exe_path           = repo_path 'dot_exe'
      dot_exe_clone_url      = 'https://github.com/appium/appium-dot-exe'
      @dot_exe_repo          = Repo.new path: dot_exe_path, clone: dot_exe_clone_url, master: true, refresh: opts[:refresh]
    end

    def update_intro_readme_docs is_master
      update_docs is_master
      update_readme
      update_intro
    end

    def repo_path path
      raise 'git dir must be set' unless @git_dir
      join @git_dir, path
    end

    def slate_image_folder
      # ensure trailing slash
      @slate_image_folder ||= join(Dir.pwd, 'slate', 'images', '')
      mkdir_p @slate_image_folder unless exists? @slate_image_folder
      @slate_image_folder
    end

    def update_dot_app_exe_images
      dot_app_repo.checkout 'master'
      dot_exe_repo.checkout 'master'
      # copy dot app and exe images
      dot_app_images = join(dot_app_repo.path, 'README-files', '**', '*.png')
      dot_exe_images = join(dot_exe_repo.path, 'README-files', '**', '*.png')
      Dir.glob(dot_app_images) do |file|
        next if File.directory?(file)
        copy_entry file, slate_image_folder
      end
      Dir.glob(dot_exe_images) do |file|
        next if File.directory?(file)
        copy_entry file, slate_image_folder
      end
    end

    def update_tutorial
      tutorial_repo.checkout 'master'
      tutorial_repo.sh 'rake build' # create '01_native_ios_automation.md'

      slate_root     = join Dir.pwd, 'slate'
      publish_folder = join slate_root, 'en', 'tutorial'
      build_folder   = join tutorial_repo.path, 'tutorials', 'en'

      # copy tutorial images
      Dir.glob(join(build_folder, '*.png')) do |file|
        next if File.directory?(file)
        copy_entry file, slate_image_folder
      end

      md_html_pairs = ['01_native_ios_automation.md', 'ios.html',
                       '02_native_android_automation.md', 'android.html']
      md_html_pairs.each_slice(2) do |source_md, dest_html|
        src_markdown_file = join build_folder, source_md
        dst_markdown_file = join @api_docs_repo.path, 'source', 'index.md'
        copy_entry src_markdown_file, dst_markdown_file

        @api_docs_repo.sh 'rake build'

        # pull html from api_docs
        api_folder = join @api_docs_repo.path, 'build'

        html_file   = 'index.html'
        input_html  = join api_folder, html_file
        output_html = join publish_folder, dest_html

        rewrite_slate_index input_html, output_html
      end
    end

    def _process_appium_readme readme_src, readme_dst
      # readme may not exist at this point in the git history
      return unless exists?(expand_path(readme_src))
      copy_entry readme_src, readme_dst
      # fix readme links for Slate
      data = File.read readme_dst
      data.gsub!('](docs/en/)', '](#)')
      data.gsub!('](sample-code/examples)', '](https://github.com/appium/appium/tree/master/sample-code/examples)')

      # remove badges (image links) when readme is copied into docs
      # [![NPM version](https://badge.fury.io/js/appium.png)](https://npmjs.org/package/appium)
      data.gsub!(/ \[ ! \[ [^\]]* \] \( [^)]+ \) \] \( [^)]+ \)/mx) do |full|
        ''
      end

      File.open(readme_dst, 'w') { |f| f.write data }
    end

    # docs are published exactly once per tag
    # the docs never change after publishing
    def update_docs is_master

      tags     = @appium_repo.valid_tags
      # don't publish branches, use only valid tags
      # tag is valid if it's published on or after '2014-05-02'
      # tags = @appium_repo.branches

      # also publish branches
      branches = %w[master 0.18.x]
      if is_master
        tags = %w[master]
      else
        # Adding branches
        tags = @appium_repo.documentation_publish_branches + tags
        tags.unshift(branches[0]).push(branches[1]);
      end

      update_dot_app_exe_images

      metadata = Hash.new []
      puts "Processing: #{tags}"
      tags.each do |tag|
        @appium_repo.checkout tag
        dest_folder = join appium_repo.path, 'docs', 'en'
        folders = Dir.entries(dest_folder).select {|folder| File.directory? File.join(dest_folder,folder) and !(folder =='.' || folder == '..') }
        readme_src = join appium_repo.path, 'README.md'
        dot_app_readme_src = join dot_app_repo.path, 'README.md'
        dot_exe_readme_src = join dot_exe_repo.path, 'README.md'
        readme_dst = ''
        dot_app_readme_dst = ''
        # For new folder structure
        if folders.length > 0
          readme_dst         = join appium_repo.path, 'docs', 'en', 'about-appium', 'README.md'
          dot_app_readme_dst = join appium_repo.path, 'docs', 'en', 'appium-gui', 'dot-app.md'
          dot_exe_readme_dst = join appium_repo.path, 'docs', 'en', 'appium-gui', 'dot-exe.md'
        else
          readme_dst         = join appium_repo.path, 'docs', 'en', 'README.md'
          dot_app_readme_dst = join appium_repo.path, 'docs', 'en', 'dot_app.md'
          dot_exe_readme_dst = join appium_repo.path, 'docs', 'en', 'dot-exe.md'
        end
        #copying
        _process_appium_readme readme_src, readme_dst
        copy_entry dot_app_readme_src, dot_app_readme_dst
        copy_entry dot_exe_readme_src, dot_exe_readme_dst
        # process cn readme
        cn_readme_src = join appium_repo.path, 'docs', 'cn', 'README.md'
        if exists?(cn_readme_src)
          # cn may be deprecated
          cn_readme_dst = join appium_repo.path, 'docs', 'cn', 'README.md.tmp'
          _process_appium_readme cn_readme_src, cn_readme_dst
          copy_entry cn_readme_dst, cn_readme_src # use tmp to override old
          File.unlink cn_readme_dst # delete temp file
        end


        # fix dot app links for Slate
        data = File.read dot_app_readme_dst
        data.gsub!('](/README-files/images/', '](../../images/')
        File.open(dot_app_readme_dst, 'w') { |f| f.write data }

        # fix dot exe links for slate
        data = File.read dot_exe_readme_dst
        data.gsub!('](/README-files/', '](../../images/')
        File.open(dot_exe_readme_dst, 'w') { |f| f.write data }

        source = join @appium_repo.path, 'docs', '*'
        Dir.glob(source) do |path|

          next unless File.directory?(path) # languages must be folders not files.
          path               = expand_path path
          language           = basename path

          # `old` dir contains deprecated doc
          next if language == 'old'

          dest               = join Dir.pwd, 'docs', language, tag

          # update metadata before skipping
          metadata[language] += [tag]

          # delete existing branches
          rm_rf dest if exists?(dest) && branches.include?(tag)
          copy_entry path, dest
          puts "Processing with slate: #{language} #{tag}"
          process_with_slate input: dest, language: language, tag: tag
        end
        # cleaning added files
        @appium_repo.clean
      end # tags.each do |tag|

      unless is_master
        # update tutorial after docs are complete
        update_tutorial
        File.open('_data/slate.yml', 'w') do |f|
          result        = ''

          # promote en to first
          metadata_keys = (metadata.keys - ['en']).insert(0, 'en')
          metadata_keys.each do |key|
            result += "\n#{key}:\n"
            values = metadata[key]
            values.each do |tag|
              # must be exactly two spaces before tag or YAML parsing fails
              result += "  - #{tag}\n"
            end
          end

          f.write result.strip
        end
      end
    end

    def relativize_slate_url url
      return url if url.start_with?('/') || url.start_with?('http')
      "../../#{url}"
    end

    # Convert links in the index.html generated by slate to use relative paths
    # @param input [String] path to input file
    # @param output [String] path to output file
    def rewrite_slate_index input, output
=begin
    <link href="stylesheets/screen.css" rel="stylesheet" type="text/css" media="screen" />
    <link href="stylesheets/print.css" rel="stylesheet" type="text/css" media="print" />
    <link href="stylesheets/custom_appium.css" rel="stylesheet" type="text/css" />
    <script src="javascripts/all.js" type="text/javascript"></script>
    <img src="images/logo.png" />

transforms into:

    <link href="../../stylesheets/screen.css" rel="stylesheet" type="text/css" media="screen" />
    <link href="../../stylesheets/print.css" rel="stylesheet" type="text/css" media="print" />
    <link href="../../stylesheets/custom_appium.css" rel="stylesheet" type="text/css" />
    <script src="../../javascripts/all.js" type="text/javascript"></script>
    <img src="../../images/logo.png" />
=end
      parsed = Nokogiri::HTML File.read input

      targets = {
        'link'   => :href,
        'script' => :src,
        'img'    => :src
      }

      nodes = targets.keys.join(',')

      parsed.search(nodes).each do |node|
        attr       = targets[node.name]
        node[attr] = relativize_slate_url(node[attr]) if node[attr]
      end

      FileUtils.mkdir_p dirname output
      File.open(output, 'w') { |f| f.write parsed.to_html }
    end

    def process_with_slate opts={}
      input    = opts[:input]
      language = opts[:language]
      tag      = opts[:tag]

      raise 'Must pass input, language, and tag' unless input && language && tag

      # doc_folder - pwd/docs/en/v1.0.0-beta
      publish_folder = join Dir.pwd, 'slate', language, tag

      # lint input directory
      #@api_docs_repo.sh 'appium_doc_lint', input

      # merge into one .md file
      @api_docs_repo.sh "rake md[#{input}]"

      # generate html
      @api_docs_repo.sh 'rake build'

      build_folder = join @api_docs_repo.path, 'build'
      html_file    = 'index.html'
      input_html   = join build_folder, html_file
      output_html  = join publish_folder, html_file

      rewrite_slate_index input_html, output_html

      # Update root index files with slate exactly once
      unless @@slate_published_once
        @@slate_published_once = true
        publish_slate_root     = join Dir.pwd, 'slate'
        copy_entry build_folder, publish_slate_root
        root_index = join publish_slate_root, html_file
        File.delete root_index if exists?(root_index)
      end
    end

    def self.rewrite_github_links data, prefix=/\/?docs\//
      data = data.gsub(/(?<!!) \[ ( [^\[]* ) \] \( ( [^)]+ ) \)/mx) do |full|
        result = full
        link_text   = $1
        link_target = $2
        link_target = link_target.strip if link_target
        if(link_target =~  /^\/?docs\/.*\/$/ )
          # links to main doc page
          result = link_target.gsub(/^\/?docs\/(.*)\/$/) do |lang|
            res = '[%s](/documentation.html?lang=%s)' % [link_text, $1]
          end
        elsif link_target && link_target =~ prefix
          # links to specific doc sections
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
      data
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

      data = self.class.rewrite_github_links data

      # Fix readme links
      # https://raw.githubusercontent.com/appium/appium/master/README.md
      # - contributing lacks docs/ prefix
      # - docs/en links to github
      # - sample code links to github
      data.gsub!('](CONTRIBUTING.md)', '](/slate/en/master/#CONTRIBUTING.md)')
      data.gsub!('](docs/en/)', '](/slate/en/master/)')
      data.gsub!('](/docs/en/)', '](/slate/en/master/)')
      data.gsub! /]\s*\(\/docs\/en\/.*\//, '](/slate/en/master/#'

      data.gsub!('](sample-code/examples)', '](https://github.com/appium/appium/tree/master/sample-code/examples)')
      File.open(dest, 'w') { |f| f.write(yaml + data) }
    end

    def update_intro
      branch = default_checkout # @appium_repo.newest_tag
      raise 'Unable to find newest tag' unless branch
      @appium_repo.checkout branch

      # intro.md doesn't exist in some early tags
      source = join @appium_repo.path, 'docs', 'en', 'about-appium','intro.md'
      # previous location
      source = join @appium_repo.path, 'docs', 'en', 'intro.md' unless File.exist?(source)

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
      data = self.class.rewrite_github_links File.read(dest), prefix=/.*/
      File.open(dest, 'w') { |f| f.write(yaml + data) }
    end
  end # class Helper
end # module AppiumIo
