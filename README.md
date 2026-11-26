# BetterContextMenus

Equicord user plugin: adds useful items to Discord's right-click menus. Formerly VoiceChannelUtils; its settings carry over.

## Voice channels

Voice channel helpers sit in a "Voice Channel Utils" submenu of a voice channel's (or a user in voice's) right-click menu. To merge them into the built-in VoiceChatUtilities plugin's "Voice Tools" submenu, use the MenuCustomisation plugin and move `voice-tools-copy-submenu` and `voice-tools-set-status` into `voice-tools`.

- **Copy**
  - **Copy Info**: a link to the channel and its latest loaded message, plus server, name, topic, status, who is in it and how many messages are loaded.
  - **Copy Name** and **Copy Status**.
  - **Copy Code**: the first code found in the channel status, topic, name, or the loaded messages (newest first).
- **Set Status**: sets or clears the voice channel status. Only shown in voice channels where you're allowed to set it.
- **Open Chat on locked channels**: Discord hides its own "Open Chat" item on voice channels you can't join, even though their chat opens fine. With this on, it shows whenever you can see the channel. Needs a restart to change.

### Auto copy

When you join a voice channel in one of the listed servers in this Discord window, or its status changes while you're in it, the plugin copies the channel's code. Joins from your other devices, and muting or deafening, don't trigger it.

## Microphone

Formerly the PttToggle plugin; its settings carry over. Right-click the microphone button:

- **Push to Talk**: switches between push to talk and voice activity. Warns you if push to talk has no keybind.
- **Krisp**: turns Krisp noise cancellation on or off. Optionally sets a fixed voice activity sensitivity while Krisp is off and puts the old one back when it's turned on again (or the plugin is stopped).

## Links

**Open in Browser** appears right after Discord's "Open Link" in any menu that has it, such as a link in a message. It always opens the link in your default browser, even when Equibop's "open links in app" setting would open it in an Equibop window.

## Settings

| Setting | Default | Meaning |
| --- | --- | --- |
| Code regex | five letters or digits | What counts as a code. Invalid expressions are rejected. |
| Ignored words | `camos,grind` | Words that match the regex but aren't codes. |
| Auto extract servers | two COD Warzone servers | Comma separated server ids for auto copy. |
| Copy Info / Copy Name / Copy Status / Copy Code | on | Show each Copy item. With all four off, the Copy submenu is gone. |
| Set Status | on | Show Set Status. |
| User menu | on | Also show the voice channel items on users who are in voice. |
| Show PTT toggle / Show Krisp toggle | on | Show each microphone menu item. |
| Override threshold without Krisp | off | Use a fixed sensitivity while Krisp is off. |
| Krisp off threshold | -60 dB | That sensitivity. |
| Open in browser | on | Adds Open in Browser after Open Link. |
| Show Open Chat when locked | on | See above. |
| Logging | off | Debug logging to the console. |

## Install

```sh
cd src/userplugins
git clone https://github.com/bluscream-vencord-plugins/betterContextMenus
```

Rebuild Equicord and enable BetterContextMenus. Update with `git pull`.
