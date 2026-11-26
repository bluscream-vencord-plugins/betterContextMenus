/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addGlobalContextMenuPatch, findGroupChildrenByChildId, removeGlobalContextMenuPatch } from "@api/ContextMenu";
import definePlugin from "@utils/types";

import { pluginInfo } from "./info";
import { handleVoiceChannelStatusUpdate, handleVoiceStateUpdates, type OwnVoiceState, resetVoiceTracking } from "./logic";
import { contextMenuPatch } from "./menus";
import { PATTERNS } from "./patterns";
import { settings } from "./settings";

export default definePlugin({
    name: pluginInfo.name,
    description: pluginInfo.description,
    authors: pluginInfo.authors,
    dependencies: ["ContextMenuAPI"],
    settings,

    contextMenus: {
        [PATTERNS.menus.channel](children) {
            if (!settings.store.hideJoinWithoutEntranceSound) return;
            const group = findGroupChildrenByChildId(PATTERNS.joinWithoutEntranceSound, children);
            const index = group?.findIndex(c => c?.props?.id === PATTERNS.joinWithoutEntranceSound) ?? -1;
            if (group && index !== -1) group.splice(index, 1);
        }
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
        addGlobalContextMenuPatch(contextMenuPatch);
    },

    stop() {
        removeGlobalContextMenuPatch(contextMenuPatch);
    }
});
