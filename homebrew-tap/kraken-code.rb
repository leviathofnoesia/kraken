class KrakenCode < Formula
  desc "Transforms OpenCode into an autonomous, high-density development environment"
  homepage "https://github.com/leviathofnoesia/kraken-code"
  version "1.1.5"
  license "MIT"

  # Intel Macs
  if OS.mac? && Hardware::CPU.intel?
    url "https://github.com/leviathofnoesia/kraken-code/releases/download/v#{version}/kraken-code-macos-x64.tar.gz"
    sha256 "PLACEHOLDER_SHA256_MACOS_X64"
  end

  # Apple Silicon Macs
  if OS.mac? && Hardware::CPU.arm?
    url "https://github.com/leviathofnoesia/kraken-code/releases/download/v#{version}/kraken-code-macos-arm64.tar.gz"
    sha256 "PLACEHOLDER_SHA256_MACOS_ARM64"
  end

  # Linux x64
  if OS.linux? && Hardware::CPU.intel?
    url "https://github.com/leviathofnoesia/kraken-code/releases/download/v#{version}/kraken-code-linux-x64.tar.gz"
    sha256 "PLACEHOLDER_SHA256_LINUX_X64"
  end

  # Linux ARM64
  if OS.linux? && Hardware::CPU.arm?
    url "https://github.com/leviathofnoesia/kraken-code/releases/download/v#{version}/kraken-code-linux-arm64.tar.gz"
    sha256 "PLACEHOLDER_SHA256_LINUX_ARM64"
  end

  depends_on "bun" => :recommended

  def install
    bin.install "kraken-code"
    
    # Bash completion
    (bash_completion/"kraken-code").write <<~EOS
      _kraken_code_completion() {
        local cur prev opts
        COMPREPLY=()
        cur="${COMP_WORDS[COMP_CWORD]}"
        prev="${COMP_WORDS[COMP_CWORD-1]}"
        opts="install init uninstall status doctor --help --version"
        
        if [[ ${cur} == -* ]]; then
          COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
          return 0
        fi
      }
      complete -F _kraken_code_completion kraken-code
    EOS

    # Zsh completion
    (zsh_completion/"_kraken-code").write <<~EOS
      #compdef kraken-code
      
      _kraken_code() {
        local curcontext="$curcontext" state line
        typeset -A opt_args
        
        _arguments -C \\
          '(-h --help)'{-h,--help}'[Show help]' \\
          '(-v --version)'{-v,--version}'[Show version]' \\
          '1: :->command' \\
          '*:: :->args'
        
        case "$state" in
          command)
            _values 'commands' \\
              'install[Install Kraken Code plugin]' \\
              'init[Initialize Kraken Code configuration]' \\
              'uninstall[Uninstall Kraken Code]' \\
              'status[Show installation status]' \\
              'doctor[Run system diagnostics]'
            ;;
          args)
            case "$line[1]" in
              init)
                _arguments \\
                  '--minimal[Minimal setup]' \\
                  '--full[Full setup with all features]'
                ;;
              uninstall)
                _arguments \\
                  '--config[Also remove config files]' \\
                  '--verbose[Show detailed output]'
                ;;
              doctor)
                _arguments \\
                  '--category[Run specific category checks]' \\
                  '--json[Output as JSON]' \\
                  '--verbose[Show detailed output]'
                ;;
            esac
            ;;
        esac
      }
      
      _kraken_code "$@"
    EOS
  end

  def post_install
    ohai "Initializing Kraken Code..."
    system "#{bin}/kraken-code", "init", "--minimal"
  end

  def caveats
    <<~EOS
      Kraken Code has been installed!
      
      To get started:
        1. Restart your terminal
        2. Run 'opencode' to start using Kraken Code
        3. Try 'blitz' or 'blz' for Blitzkrieg Mode
      
      Documentation: https://github.com/leviathofnoesia/kraken-code
      Support: https://github.com/leviathofnoesia/kraken-code/issues
    EOS
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/kraken-code --version")
    assert_match "Kraken Code", shell_output("#{bin}/kraken-code --help")
  end
end
