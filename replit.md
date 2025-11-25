# Overview

This is a Facebook Messenger chatbot built in Arabic, named "Kaguya Bot" (also referred to as "Mirai Bot" in some files). The bot is designed to interact with Facebook Messenger groups and users, providing various entertainment, utility, and moderation features. It uses a custom Facebook Chat API implementation and supports a command-based architecture with events, middleware, and a role-based permission system.

The bot includes features like:
- Multi-language support (primarily Arabic)
- Interactive games (tic-tac-toe, riddles, word games)
- Moderation tools (warnings, kicks, admin management)
- Content filtering (bad words detection)
- Welcome/farewell messages with custom cards
- YouTube video/audio downloads
- Translation services
- Group management utilities
- Economy and experience point systems
- Image manipulation commands (grave images, proposal cards)

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes (November 23, 2025)

## New Commands Added
- **طلب** (propose): Creates a dramatic proposal image with two profile pictures composited onto a template. Accepts 1 mention (combines sender with mentioned user) or 2 mentions (uses first two mentioned users). 40 total commands now loaded.

## Commands Enhanced
- **قبر** (grave): Added reply functionality - users can now reply to someone's message and use `.قبر` to place them in the grave image. Also improved image positioning and quality.
- **اختر** (choose): Removed as requested

## Active Command Count
- Current: 40 commands loaded and working
- Previous: 39 commands

# System Architecture

## Core Framework
- **Runtime**: Node.js with ES modules (`"type": "module"` in package.json)
- **Entry Point**: `index.js` initializes the bot via `Kaguya` class (EventEmitter-based)
- **Keep-Alive Server**: Express server (`server.js`) provides health check endpoints for uptime monitoring on port 3000

## Authentication & Session Management
- **Login Method**: Uses a custom Facebook Chat API fork (`@xaviabot/fca-unofficial`)
- **Session Storage**: AppState cookies stored in `KaguyaSetUp/KaguyaState.json`
- **MQTT Connection**: Maintains persistent connection with configurable refresh interval (1200000ms default)

## Command & Event System
- **Command Loading**: Dynamic import from `commands/` directory with subdirectory support
- **Event Loading**: Dynamic import from `event/` directory
- **Middleware Pattern**: `commandMiddleware()` and `eventMiddleware()` load and validate commands/events
- **Command Handler**: `CommandHandler` class processes incoming messages, checks permissions, cooldowns, and banned status
- **Reply System**: Global reply handler (`global.client.handler.reply`) for multi-step interactions
- **Dual Storage**: Both full command objects and execution functions stored separately in Maps to prevent serialization issues

## Permission & Access Control
- **Role Hierarchy**: 
  - 0: All users
  - 1: Group admins + developers
  - 2: Developers only
- **Developer IDs**: Configured in `config.ADMIN_IDS` array
- **Mode Toggles**:
  - Admin-only mode (per-group, stored in `adminOnlyMode.json`)
  - Developer-only mode (global, stored in `devOnlyMode.json`)
- **Exempted Users**: Hardcoded bypass list in command handler

## Database Architecture
- **Type**: Dual support for MongoDB and JSON file storage
- **Selection**: Configured via `config.database.type`
- **JSON Implementation**:
  - Users data: `database/users.json`
  - Threads data: `database/threads.json`
  - Warnings: `database/warns.json`
  - File watching via `chokidar` for real-time updates
- **Controllers**: MVC-style controllers for users, threads, economy, and experience points
- **Models**: Mongoose schemas for MongoDB compatibility (even though JSON is currently used)

## Group Management
- **Thread Tracking**: Auto-creates thread records on bot join
- **Anti-Change Protection**: Optional protection against group name/image changes
- **Approval Mode**: Tracks and manages group approval settings
- **Member Tracking**: Maintains accurate member counts
- **Admin Detection**: Tracks group admin IDs for permission checks

## Moderation Features
- **Warning System**: 3-strike system with auto-kick functionality
- **Bad Words Filter**: Per-group blacklist with exact match detection and auto-kick
- **Auto-Prevention**: Prevents re-adding of kicked members until warnings cleared
- **Kick Commands**: Multiple kick/ban commands with permission checks

## Custom Prefix System
- **Per-Group Prefixes**: Stored in `prefixes.json`
- **Default Prefix**: "." (dot)
- **Private Message Handling**: Empty prefix (no prefix required) for DMs
- **Dynamic Parsing**: Prefix detection before command name extraction

## Rate Limiting & Queue Management
- **Message Queue**: Custom queue system to avoid Facebook rate limits
- **Retry Logic**: Automatic retry with exponential backoff on rate limit errors (1390008)
- **Delay**: 800ms between messages with queue processing
- **Reaction Handling**: Non-blocking message reactions for user feedback

## Media Handling
- **Attachment Processing**: Streams images, videos, GIFs from URLs
- **YouTube Downloads**: `ytdl-core` for video/audio extraction with custom agent
- **Image Manipulation**: Jimp for creating welcome/farewell cards
- **File Caching**: Temporary storage in `cache/` directories

## External Service Integrations
- **Translation**: Google Translate API via `@vitalets/google-translate-api`
- **YouTube Search**: `yt-search` for video lookup
- **Anime Content**: JSON-based anime image pairs storage
- **Weather**: `weather-js` package (listed in dependencies)

## Error Handling & Logging
- **Custom Logger**: Chalk-based colored console logging
- **System Errors**: EventEmitter-based error handling with auto-exit
- **Notifications**: Node-notifier for Windows desktop notifications
- **Health Monitoring**: Memory usage tracking with optional garbage collection

## Configuration Management
- **Central Config**: `KaguyaSetUp/config.js` with bot settings
- **Dynamic Updates**: Some settings can be modified at runtime
- **Validation**: Credential and version checking on startup
- **Version Control**: Semver-based version checking (though implementation appears incomplete)

## Game System
- **State Management**: Global game state maps for active sessions
- **Turn-Based Logic**: Tic-tac-toe with multiplayer and AI modes
- **Riddle System**: JSON-based question bank with hint system
- **Point Tracking**: Separate points data stored in `pontsData.json`

## Security Considerations
- **Bot Security Check**: Disabled by default (event file shows inactive implementation)
- **Approved Groups**: JSON-based whitelist system (`approved.json`) exists but not actively enforced
- **Owner Verification**: Hardcoded developer IDs for sensitive operations
- **Command Permissions**: Role-based access with exemption list

## Cooldown System
- **Per-User Cooldowns**: Map-based tracking in `global.client.cooldowns`
- **Configurable Duration**: Each command specifies its own cooldown period
- **User-Specific Storage**: Cooldown data stored in user profiles under `other.cooldowns`

# External Dependencies

## Third-Party APIs
- **Facebook Graph API**: For fetching user profile pictures and friend requests
- **Google Translate API**: Translation service via `@vitalets/google-translate-api`
- **YouTube Data**: Video metadata and search via `yt-search`

## NPM Packages
- **Facebook Chat**: `@xaviabot/fca-unofficial` (custom fork)
- **Media Processing**: 
  - `@distube/ytdl-core` for YouTube downloads
  - `jimp` for image manipulation
  - `axios` for HTTP requests
- **Database**: 
  - `mongoose` for MongoDB ODM
  - `fs-extra` for JSON file operations
  - `chokidar` for file watching
- **Web Framework**: `express` for health check server
- **Utilities**:
  - `moment-timezone` for time handling
  - `gradient-string` for colored console output
  - `semver` for version comparison
  - `form-data` for multipart uploads

## Data Storage Services
- **MongoDB**: Configured but not actively used (JSON files used instead)
- **Local JSON Files**: Primary storage method for users, threads, warnings, and configuration
- **File System**: Cache and temporary file storage

## Message Queue Service
- **MQTT**: Listed in dependencies but implementation details not visible in provided files

## External Media Sources
- **ImgBB**: Used for hosting anime pair images
- **Facebook CDN**: For user profile pictures via Graph API URLs
# Latest Updates (November 24, 2025 - Final)

## Auto-Download Feature Added
- **Command**: `.تحميل on/off` or `.تحميل تلقائي` to toggle auto-download
- **Functionality**: Any URL sent in the group will be automatically converted to video when enabled
- **Admin-only**: Only group admins can enable/disable
- **New Event**: `auto-download.js` monitors messages for URLs when feature is enabled
- **Storage**: Auto-download state saved per group in database

## Cleanup Completed
- ✅ Deleted `oto.js` command (auto mode)
- ✅ Merged `أهلا.js` and `أذكار.js` into `greeting-azkar.js`
- ✅ Deleted all unused files (player scripts, old data files, temp folders)
- ✅ Now 43 commands and 8 events (clean structure)

