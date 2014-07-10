require_relative 'rake_lib/helper.rb'

desc 'Initial Download and gem install'
task :install do
  system 'bundle install'
  AppiumIo::Helper.new
  system 'bundle install'  
end

desc 'Quick dev rebuild'
task :quick_build do
  h = AppiumIo::Helper.new refresh: false
  h.update_docs
  h.update_readme
  h.update_intro
end

desc 'Download and build'
task :full_build do
  h = AppiumIo::Helper.new
  h.update_docs
  h.update_readme
  h.update_intro
end

desc 'Download , build and publish site'
task :publish => :full_build do
  sh 'git add --all .'
  sh 'git commit -am "Update appium.io"'
  sh 'git push origin gh-pages'
end

desc 'Delete site and doc folders'
task :clean do
  sh 'rm -rf slate docs'
end

desc 'Usage'
task :usage do
  puts 'Usage:'
  puts '    rake install                 --> Initial Download and gem install.'
  puts '    bundle exec rake full_build  --> Download and build (will reset appium.io_workspace repos, so commit changes first).'
  puts '    bundle exec rake quick_build --> Quick dev rebuild (will stash appium.io_workspace repos, so commit changes first).'
  puts '    bundle exec rake publish     --> Download , build and publish site (will reset appium.io_workspace repos, so commit changes first).'
  puts '    bundle exec rake clean       --> Delete site and doc folders'
end

task :default => :usage


# jekyll serve -- run local gh pages server
