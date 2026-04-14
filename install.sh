#!/bin/bash
#
# Kraken Code Smart Installer
# Auto-detects environment and installs via best available method
#

set -e

VERSION="1.1.4"
PACKAGE_NAME="kraken-code"
REPO_URL="https://github.com/leviathofnoesia/kraken-code"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_banner() {
    echo ""
    echo -e "${BLUE}🔱 =========================================${NC}"
    echo -e "${BLUE}🔱  Kraken Code v${VERSION} Installer${NC}"
    echo -e "${BLUE}🔱 =========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Detect OS
detect_os() {
    case "$(uname -s)" in
        Linux*)     echo "linux";;
        Darwin*)    echo "macos";;
        CYGWIN*|MINGW*|MSYS*) echo "windows";;
        *)          echo "unknown";;
    esac
}

# Detect architecture
detect_arch() {
    case "$(uname -m)" in
        x86_64|amd64) echo "x64";;
        arm64|aarch64) echo "arm64";;
        i386|i686) echo "x86";;
        *) echo "unknown";;
    esac
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install via package manager (npm/bun)
install_via_package_manager() {
    if command_exists bun; then
        print_info "📦 Using Bun (fastest)..."
        if bun install -g "${PACKAGE_NAME}@${VERSION}"; then
            print_success "Installed via Bun"
            return 0
        fi
    fi
    
    if command_exists npm; then
        print_info "📦 Using NPM..."
        if npm install -g "${PACKAGE_NAME}@${VERSION}"; then
            print_success "Installed via NPM"
            return 0
        fi
    fi
    
    return 1
}

# Install via standalone binary
install_via_binary() {
    local os=$(detect_os)
    local arch=$(detect_arch)
    
    if [ "$os" = "windows" ]; then
        print_error "Windows binary installation not supported yet"
        print_info "Please use npm: npm install -g ${PACKAGE_NAME}"
        return 1
    fi
    
    if [ "$os" = "unknown" ] || [ "$arch" = "unknown" ]; then
        return 1
    fi
    
    local binary_name="kraken-code-${os}-${arch}"
    local download_url="${REPO_URL}/releases/download/v${VERSION}/${binary_name}"
    local install_dir="/usr/local/bin"
    local temp_file="/tmp/kraken-code-$$"
    
    print_info "⬇️  Downloading binary for ${os}-${arch}..."
    
    if curl -fsSL --max-time 60 -o "$temp_file" "$download_url"; then
        chmod +x "$temp_file"
        
        # Try to install to /usr/local/bin, fallback to ~/.local/bin
        if [ -w "$install_dir" ]; then
            mv "$temp_file" "${install_dir}/kraken-code"
            print_success "Installed to ${install_dir}/kraken-code"
        else
            install_dir="$HOME/.local/bin"
            mkdir -p "$install_dir"
            mv "$temp_file" "${install_dir}/kraken-code"
            print_success "Installed to ${install_dir}/kraken-code"
            print_warning "Make sure ${install_dir} is in your PATH"
        fi
        
        return 0
    else
        rm -f "$temp_file"
        return 1
    fi
}

# Install via curl (direct tarball download)
install_via_curl() {
    print_info "⬇️  Downloading via curl..."
    
    local temp_dir=$(mktemp -d)
    local tarball_url="https://registry.npmjs.org/${PACKAGE_NAME}/-/${PACKAGE_NAME}-${VERSION}.tgz"
    
    if curl -fsSL --max-time 120 -o "${temp_dir}/package.tgz" "$tarball_url"; then
        cd "$temp_dir"
        tar -xzf package.tgz
        
        local package_dir="${temp_dir}/package"
        local cli_path="${package_dir}/dist/cli/index.js"
        
        if [ -f "$cli_path" ]; then
            # Create global bin directory if needed
            local bin_dir="$HOME/.local/bin"
            mkdir -p "$bin_dir"
            
            # Create wrapper script
            cat > "${bin_dir}/kraken-code" << EOF
#!/bin/bash
exec bun run "${cli_path}" "\$@"
EOF
            chmod +x "${bin_dir}/kraken-code"
            
            print_success "Installed to ${bin_dir}/kraken-code"
            print_warning "Make sure ${bin_dir} is in your PATH"
            
            # Cleanup
            rm -rf "$temp_dir"
            return 0
        fi
    fi
    
    rm -rf "$temp_dir"
    return 1
}

# Initialize Kraken Code
initialize_kraken() {
    echo ""
    print_info "🔧 Initializing Kraken Code..."
    
    if command_exists kraken-code; then
        if kraken-code init --minimal; then
            print_success "Kraken Code initialized"
        else
            print_warning "Initialization failed. Run manually: kraken-code init --minimal"
        fi
    else
        print_error "kraken-code command not found in PATH"
        print_info "You may need to restart your shell or add the install directory to PATH"
    fi
}

# Main installation logic
main() {
    print_banner
    
    local os=$(detect_os)
    local arch=$(detect_arch)
    
    print_info "Detected: ${os} (${arch})"
    echo ""
    
    # Try installation methods in order of preference
    if install_via_package_manager; then
        : # Success
    elif install_via_binary; then
        : # Success
    elif install_via_curl; then
        : # Success
    else
        print_error "All installation methods failed"
        echo ""
        print_info "Manual installation options:"
        echo "  1. npm install -g ${PACKAGE_NAME}"
        echo "  2. bun install -g ${PACKAGE_NAME}"
        echo "  3. Visit: ${REPO_URL}"
        exit 1
    fi
    
    # Initialize
    initialize_kraken
    
    # Success message
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}🎉 Kraken Code v${VERSION} installed successfully!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Restart your terminal or run: source ~/.bashrc (or ~/.zshrc)"
    echo "  2. Run 'opencode' to start using Kraken Code"
    echo "  3. Try 'blitz' or 'blz' to activate Blitzkrieg Mode"
    echo ""
    echo "Documentation: ${REPO_URL}"
    echo "Support: ${REPO_URL}/issues"
    echo ""
}

# Run main function
main "$@"
