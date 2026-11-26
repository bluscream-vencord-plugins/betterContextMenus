/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addGlobalContextMenuPatch, removeGlobalContextMenuPatch } from "@api/ContextMenu";
import { migratePluginSettings, migrateSettingsFromPlugin } from "@api/Settings";
import definePlugin from "@utils/types";

import { audioMenuPatch, restoreThreshold } from "./audioMenu";
import { pluginInfo } from "./info";
import { handleVoiceChannelStatusUpdate, handleVoiceStateUpdates, type OwnVoiceState, resetVoiceTracking } from "./logic";
import { linkMenuPatch } from "./linkMenu";
import { channelMenuPatch, userMenuPatch } from "./menus";
import { PATTERNS } from "./patterns";
import { settings } from "./settings";

migratePluginSettings(pluginInfo.name, PATTERNS.oldPluginName);
migrateSettingsFromPlugin(pluginInfo.name, PATTERNS.audio.oldPlugin, ...PATTERNS.audio.oldSettings);

export default definePlugin({
    name: pluginInfo.name,
    description: pluginInfo.description,
    authors: pluginInfo.authors,
    settings,

    patches: [
        {
            find: PATTERNS.openChat.find,
            predicate: () => settings.store.showOpenChatWhenLocked,
            replacement: {
                match: PATTERNS.openChat.match,
                replace: PATTERNS.openChat.replace
            }
        }
    ],

    contextMenus: {
        [PATTERNS.menus.channel]: channelMenuPatch,
        [PATTERNS.menus.user]: userMenuPatch,
        [PATTERNS.audio.menuId]: audioMenuPatch
    },

    flux: {
        VOICE_CHANNEL_STATUS_UPDATE({ id }: { id: string; }) {
            return handleVoiceChannelStatusUpdate(id);
        },
        VOICE_STATE_UPDATES({ voiceStates }: { voiceStates: OwnVoiceState[]; }) {
            return handleVoiceStateUpdates(voiceStates);
        }
    },

    dependencies: ["ContextMenuAPI"],

    start() {
        resetVoiceTracking();
        addGlobalContextMenuPatch(linkMenuPatch);
    },

    stop() {
        removeGlobalContextMenuPatch(linkMenuPatch);
        restoreThreshold();
    }
});
