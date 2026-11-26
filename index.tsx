/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";

import { pluginInfo } from "./info";
import { handleVoiceChannelStatusUpdate, handleVoiceStateUpdates, type OwnVoiceState, resetVoiceTracking } from "./logic";
import { channelMenuPatch, userMenuPatch } from "./menus";
import { PATTERNS } from "./patterns";
import { settings } from "./settings";

export default definePlugin({
    name: pluginInfo.name,
    description: pluginInfo.description,
    authors: pluginInfo.authors,
    settings,

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

    start() {
        resetVoiceTracking();
    }
});
