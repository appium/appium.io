source 'https://rubygems.org'

# jekyll-sitemap included in github-pages deps
gem 'github-pages', '>= 18'
gem 'nokogiri', '>= 1.6.1'
gem 'posix-spawn', '>= 0.3.8'
gem 'rake', '>= 10.3.2'
gem 'appium_doc_lint', '~> 0.0.9'

# load gems from appium/tutorial & appium/api-docs
gem 'escape_utils', '~> 1.0.1'
gem 'rspec', '~> 3.0.0'

def eval_gemfile root_path
  gem_path = File.expand_path(File.join(root_path, 'Gemfile'))
  gem_str = File.read(gem_path)

  # ignoring rake and rspec
  gem_str.gsub!(/^gem ['"]rake['"].*$/, "# ignoring rake") 
  gem_str.gsub!(/^gem ['"]rspec['"].*$/, "# ignoring rspec") 
  # ignoring redcarpet (version incompatibility)
  gem_str.gsub!(/^gem ['"]redcarpet['"].*$/, "# ignoring rspec") 
  
  eval(gem_str, nil, 'Gemfile')
end

workspace = 'appium.io_workspace'
tutorial  = File.expand_path File.join('..', '..', workspace, 'tutorial.git'), __FILE__
if File.exist?(tutorial)
  eval_gemfile tutorial
else
  puts "Warning: Doesn't exist: #{tutorial}"
end

api_docs = File.expand_path File.join('..', '..', workspace, 'api-docs.git'), __FILE__
if File.exist?(api_docs)
  eval_gemfile api_docs
else
  puts "Warning: Doesn't exist: #{api_docs}"
end