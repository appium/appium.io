require_relative 'files'

module AppiumIo
  class Repo
    include AppiumIo::Files
    attr_reader :path, :clone, :newest_tag, :valid_tags, :branches, :master

    # path  - the on disk path to the folder containing the git repo
    # clone - the url to clone from
    # if master is set then tags/branches are ignored
    def initialize opts={}
      @refresh = opts[:refresh]
      @path  = opts[:path]
      @clone = opts[:clone]
      @master = opts.fetch :master, false

      if @refresh
        refresh
      else
        update_branches
        update_tags
      end
    end

    # Checks out the target tag after a hard reset
    #
    # @param tag [String] the target tag
    # @return [void]
    def checkout tag
      if @refresh
        sh 'git reset --hard'
      else
        sh 'git stash'
      end
      sh "git checkout #{tag}"
    end

    def clean
      sh 'git reset --hard && git clean -dfx'
    end

    # Execute shell command within the appium dir
    # If not successful, print the output and raise an error
    #
    # @param cmd [String] shell command to execute as a string
    # @param working_dir [String] directory to execute the command in
    # @return stdout [String] the stripped standard output
    def sh cmd, working_dir=@path
      opts = {}
      if working_dir
        opts[:chdir] = working_dir
        mkdir_p working_dir unless exists? working_dir
      end

      puts "  #{File.basename(working_dir)}$ #{cmd}"

      process = POSIX::Spawn::Child.new cmd, opts

      unless process.success?
        raise "Command #{cmd} failed. out: #{process.out}\nerr: #{process.err}"
      end

      out = process.out
      out ? out.strip : out
    end

    # Sorts all annotated tags by date. lightweight tags will not work.
    # Tags after '2014-04-10' are discarded because the docs didn't exist
    # in jekyll format before then.
    #
    # Does nothing if repo is set as having only a master branch
    #
    # An exception is raised if no valid tags are found.
    # @return [void]
    def update_tags
      return if master
      all_tags_by_date = "git for-each-ref --sort='-*authordate' --format '%(taggerdate:short) %(tag)' refs/tags"
      all_tags_by_date = sh all_tags_by_date

      start_date  = Date.parse '2014-05-02'
      @valid_tags = []

      # discard all tags before 2014-04-24 v0.18.2
      all_tags_by_date.split(/\r?\n/).each do |line|
        # 2014-04-10 v0.18.1
        date_tag_pair = line.split ' '
        date          = date_tag_pair.first
        tag           = date_tag_pair.last
        date          = Date.parse date

        @valid_tags << tag unless date < start_date
      end

      puts "Valid tags: #{valid_tags.join(', ')}"

=begin
valid_tags = %w[v0.18.2 v1.0.0-beta.1 v0.18.1]

{"v0.18.2" => [0, 18, 2],
 "v1.0.0-beta.1" => [1, 0, 0, 1],
 "v0.18.1" => [0, 18, 1]}

v1.0.0-beta.1
=end

      tag_map = {}
      valid_tags.each { |tag| tag_map[tag] = tag.gsub(/[^\d\.]/, '').split('.').map { |v| v.to_i } }
      @newest_tag = tag_map.sort_by { |key, value| value }.reverse.first.first

      puts "Newest tag: #{newest_tag}"

      raise 'No valid tags' if valid_tags.empty?
    end

    def update_branches
      return @branches = ['master'] if master
      list = sh 'git branch --remote'
      valid_branches = []
      list.split(/\r?\n/).each do |line|
        # origin/HEAD -> origin/master
        # origin/master
        if line.include?('origin/') && !line.include?('->')
          valid_branches << line.split('/').last.strip
        end
      end

      @branches = valid_branches.uniq.sort
    end

    # Clones the repository. Hard resets. Runs git pull with rebase.
    # Updates tag information (newest_tag, valid_tags)
    # @return [void]
    def refresh
      clone_appium = "git clone #{clone} #{path}"
      sh clone_appium unless File.exists? path

      sh 'git reset --hard'
      sh 'git fetch --tags'

      update_branches

      branches.each do |branch|
        sh "git checkout #{branch}"
        sh "git pull --rebase origin #{branch}"
      end

      update_tags
    end
  end
end
