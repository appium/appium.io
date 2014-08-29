require_relative 'rake_lib/helper.rb'

desc 'Initial Download and gem install'
task :install do
  sh 'bundle install'
  AppiumIo::Helper.new
  sh 'bundle install'
end

desc 'Quick dev rebuild'
task :quick_build do
  h = AppiumIo::Helper.new refresh: false
  h.update_intro_readme_docs false
end

desc 'Quick master rebuild'
task :master_build do
  h = AppiumIo::Helper.new refresh: true
  h.update_intro_readme_docs true
end

desc 'Download and build'
task :full_build do
  h = AppiumIo::Helper.new
  h.update_intro_readme_docs false
end

desc 'Clean, download , build and publish site'
task :publish => [:hardcore_clean, :install, :full_build] do
  sh 'git add --all .'
  sh 'git commit -am "Update appium.io"'
  sh 'git push origin gh-pages'
end

desc 'Delete site and doc folders'
task :clean do
  sh 'rm -rf slate docs'
end

desc 'Delete site and doc folders'
task :hardcore_clean => :clean  do
  sh 'rm -rf ../appium.io_workspace/*'
end

desc 'Run specs'
task :specs do
  sh 'rspec test/specs/*-specs.rb'
end

linkchecker_thread_num = ENV['LINKCHECKER_THREAD']
linkchecker_thread_num = 10 if !linkchecker_thread_num

linkchecker_pause = ENV['LINKCHECKER_PAUSE']
linkchecker_pause = 1 if !linkchecker_pause

desc 'Run local linkchecker (require manual install)'
task :linkchecker_local do
  # To install: 'sudo pip install linkchecker'
  # Start local jekyll first
  sh 'linkchecker -f .linkcheckerrc -t %s -r "-1" -P %s http://0.0.0.0:4000 --check-extern' % [linkchecker_thread_num, linkchecker_pause]
end

desc 'Run live linkchecker (require manual install)'
task :linkchecker_live do
  # To install: 'sudo pip install linkchecker'
  # Start local jekyll first
  sh 'linkchecker -f .linkcheckerrc -t %s -r "-1" -P %s http://appium.io --check-extern' % [linkchecker_thread_num, linkchecker_pause]
end

desc 'Start/Restart jekyll server (require manual install)'
task :jekyll do  system `pkill -9 -f jekyll`
  system `bundle exec jekyll serve`
end

desc 'Kill jekyll server'
task :kill_jekyll do
  system `pkill -9 -f jekyll`
end

desc 'Usage'
task :usage do
  puts 'Usage:'
  puts '    rake install                 --> Initial Download and gem install.'
  puts '    bundle exec rake full_build  --> Download and build (will reset appium.io_workspace repos, so commit changes first).'
  puts '    bundle exec rake quick_build --> Quick dev rebuild (will stash appium.io_workspace repos, so commit changes first).'
  puts '    bundle exec rake publish     --> Download , build and publish site (will reset appium.io_workspace repos, so commit changes first).'
  puts '    bundle exec rake specs       --> Run specs'
  puts '    rake clean                   --> Delete site and doc folders'
  puts '    rake hardcore_clean          --> Delete repos + site and doc folders'
  puts '    rake linkchecker_local       --> Run linkchecker against local site (require manual install)'
  puts '    rake linkchecker_live        --> Run linkchecker against live site (require manual install)'
  puts '    rake jekyll &                --> Start/Restart jekyll server'
  puts '    rake kill_jekyll             --> Kill jekyll server'
  puts ''
  puts 'Dev Note:'
  puts '    You should do subpackage dev in the ../appium.io_workspace/* folders, using'
  puts '    the quick_build task. Be carefull with the full_build and publish tasks, they'
  puts '    are a little bit hardcore.'

end

task :default => :usage


# jekyll serve -- run local gh pages server
