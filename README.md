# VoiceChannelUtils

Equicord user plugin: voice channel helpers in the "Voice Tools" submenu of a voice channel's (or a user in voice's) right-click menu. If the built-in VoiceChatUtilities plugin already adds that submenu, the items are merged into it.

## Menu items

- **Copy**
  - **Copy Info**: a link to the channel and its latest loaded message, plus server, name, topic, status, who is in it and how many messages are loaded.
  - **Copy Name** and **Copy Status**.
  - **Copy Code**: the first code found in the channel status, topic, name, or the loaded messages (newest first).
- **Set Status**: sets or clears the voice channel status. Only shown in voice channels where you're allowed to set it.

## Auto copy

When you join a voice channel in one of the listed servers in this Discord window, or its status changes while you're in it, the plugin copies the channel's code. Joins from your other devices, and muting or deafening, don't trigger it.

## Settings

| Setting | Default | Meaning |
| --- | --- | --- |
| Code regex | five letters or digits | What counts as a code. Invalid expressions are rejected. |
| Ignored words | `camos,grind` | Words that match the regex but aren't codes. |
| Auto extract servers | two COD Warzone servers | Comma separated server ids for auto copy. |
| Logging | off | Debug logging to the console. |

## Install

```sh
cd src/userplugins
git clone https://github.com/bluscream-vencord-plugins/voiceChannelUtils
```

Rebuild Equicord and enable VoiceChannelUtils. Update with `git pull`.
