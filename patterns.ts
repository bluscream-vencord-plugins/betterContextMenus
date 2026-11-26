/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/** Discord names and ids this plugin relies on. */
export const PATTERNS = {
    /** Discord's helper that asks the gateway for a server's channel statuses. */
    requestChannelInfo: ['type:"FETCH_CHANNEL_INFO"', "requestChannelInfo("],
    /** The module with Discord's channel actions, including setting a voice channel status. */
    channelSettingsActions: ["updateVoiceChannelStatus", "updateChannel"],
    /** Dispatched once Discord has the channel statuses of a server; the payload carries `guildId`. */
    channelInfoEvent: "CHANNEL_INFO",
    /** Discord answers a successful status change with this HTTP status. */
    statusSetOk: 204,
    /** How long to wait for channel statuses before reading the store anyway. */
    channelInfoTimeoutMs: 3000,

    /** "Open in Browser", placed after Discord's own Open Link item, which Equibop may open in a popup window. */
    openExternally: {
        id: "vc-bcm-open-in-browser",
        anchor: "open-native-link",
        protocols: ["https:", "http:"]
    },

    /** This plugin's name before it became BetterContextMenus; its settings are migrated. */
    oldPluginName: "VoiceChannelUtils",

    /** Discord's voice channel menu only shows "Open Chat" with the Connect permission; this checks View Channel instead. */
    openChat: {
        find: 'id:"end-stage",label',
        match: /(?<=\.can\(\i\.\i\.)CONNECT(?=,\i\),\[\i\]\)&&\i\.isGuildVocal\(\)\?\(0,\i\.jsx\)\(\i\.\i,\{id:"open-chat")/,
        replace: "VIEW_CHANNEL"
    },

    /** Context menus this plugin adds to. */
    menus: {
        channel: "channel-context",
        user: "user-context"
    },
    /** This plugin's own submenu. MenuCustomisation can move its items elsewhere, such as into Voice Tools. */
    submenu: { id: "vc-voice-channel-utils", label: "Voice Channel Utils" },
    items: {
        setStatus: "voice-tools-set-status",
        copy: "voice-tools-copy-submenu",
        copyInfo: "voice-tools-copy-info",
        copyName: "voice-tools-copy-name",
        copyStatus: "voice-tools-copy-status",
        copyCode: "voice-tools-copy-code"
    },

    defaults: {
        /** Five letters and digits, all lower or all upper case. */
        codeRegex: "\\b([a-z0-9]{5}|[A-Z0-9]{5})\\b",
        ignoredWords: "camos,grind",
        /** COD Warzone servers whose voice channels carry lobby codes. */
        autoExtractServers: "500074231544152074,687345074627149873"
    },
    listSeparator: ",",
    /** Optional plugin with a clipboard copy that works while Discord isn't focused. */
    nativeUtils: "NativeUtils"
};
