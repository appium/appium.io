require_relative 'rake_lib/helper.rb'

desc 'Install gems'
task :install do
  system 'bundle install'
  AppiumIo::Helper.new
  system 'bundle install'  
end

# clone from forks for now
desc 'Update appium docs, readme, and intro'
task :appium do
  h = AppiumIo::Helper.new
  h.update_docs
  h.update_readme
  h.update_intro
end

desc 'Publish changes to github'
task :publish => :appium do
  sh 'git add --all .'
  sh 'git commit -am "Update appium.io"'
  sh 'git push origin gh-pages'
end

desc 'Delete folders created by appium task'
task :clean do
  sh 'rm -rf slate docs'
end

task :default => :appium

# jekyll serve -- run local gh pages server