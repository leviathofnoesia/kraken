# Mobile Solutions for OpenCode

Documented mobile solutions for using OpenCode remotely from your phone.

## Solutions

### 1. Pocket Agent (Recommended - Open Source)

**Platform:** iOS (TestFlight)  
**Type:** Mobile app + local server  
**Cost:** Free  
**Status:** Production-ready

#### Features
- Full terminal access with hardware-accelerated streaming
- Real-time file editing with syntax highlighting
- Touch-optimized controls with gesture navigation
- Multi-tab sessions with persistent state
- Cloud background agents via Cursor API
- Works with **ANY CLI agent** including OpenCode
- Local + Cloud execution modes
- Push notifications for completion

#### Installation

```bash
# Install server on your machine
curl -fsSL https://www.pocket-agent.xyz/install | bash

# Pair your device
pocket-server pair  # or --remote for internet access

# Start server
pocket-server start     # or --remote for Cloudflare tunnel
```

Then download the iOS app from TestFlight and enter your server URL + PIN.

#### Website
https://www.pocket-agent.xyz

---

### 2. Remote Code (Commercial - Vanna.ai)

**Platform:** iOS (TestFlight)  
**Type:** iPhone app + "Uplink" desktop client  
**Cost:** Free (currently in beta)  
**Status:** Production-ready

#### Features
- OpenCode integration specifically designed
- Built-in Git integration (status, commits, branches)
- Session continuity across devices
- Mobile keyboard optimizations
- AI in-pocket experience

#### Installation

1. Download Uplink from https://remote-code.com/install (Mac/Windows/Linux)
2. Download iOS app from TestFlight
3. Pair your iPhone via QR code or manual entry

#### Website
https://remote-code.com/opencode

---

### 3. openMode (Open Source - Work in Progress)

**Platform:** iOS + Android (Flutter)  
**Type:** Direct server connection  
**Cost:** Free  
**Status:** WIP - basic features only

#### Features
- AI chat interface
- Server connection with configurable settings
- Session management
- Modern UI with Material Design 3

#### Installation

Requires building from source using Flutter:

```bash
git clone https://github.com/easychen/openMode
cd openMode
flutter pub get
flutter run
```

#### Website
https://github.com/easychen/openMode

---

## Comparison

| Feature | Pocket Agent | Remote Code | openMode |
|---------|-------------|-------------|-----------|
| Open | ✅ | ❌ | ✅ |
| Platforms | iOS | iOS | iOS + Android |
| Terminal | ✅ | ❌ | ❌ |
| Code Editor | ✅ | ❌ | ❌ |
| Git Integration | Basic | Built-in | ❌ |
| Cloud Agents | ✅ | ❌ | ❌ |
| Status | Production | Production | WIP |
| Cost | Free | Free (beta) | Free |

## Recommendation

**Use Pocket Agent for:**
- Full terminal access from anywhere
- Running background agents remotely
- Complete control of local development
- Future-proof support for any CLI agent

**Use Remote Code for:**
- Focused OpenCode mobile experience
- Built-in Git workflow
- Simple setup with guided pairing

**Use openMode for:**
- Cross-platform (Android) needs
- Open source contribution
- Building custom mobile solution
