/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addGlobalContextMenuPatch, removeGlobalContextMenuPatch } from "@api/ContextMenu";
import { migratePluginSettings } from "@api/Settings";
import definePlugin from "@utils/types";

import { pluginInfo } from "./info";
import { handleVoiceChannelStatusUpdate, handleVoiceStateUpdates, type OwnVoiceState, resetVoiceTracking } from "./logic";
import { linkMenuPatch } from "./linkMenu";
import { channelMenuPatch, userMenuPatch } from "./menus";
import { PATTERNS } from "./patterns";
import { settings } from "./settings";

migratePluginSettings(pluginInfo.name, PATTERNS.oldPluginName);

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
        [PATTERNS.menus.user]: userMenuPatch
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
    }
});
