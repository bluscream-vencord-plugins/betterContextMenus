/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// // Plugin originally written for Equicord at 2026-02-16 by https://github.com/Bluscream, https://antigravity.google
// region Imports
import { Logger } from "@utils/Logger";
import definePlugin from "@utils/types";
import { UserStore, VoiceStateStore } from "@webpack/common";

// endregion Imports
import { pluginInfo } from "./info";
import { handleVoiceStateUpdate } from "./logic";
import { UserContextMenuPatch,VoiceChannelContext } from "./menus";
import { settings } from "./settings";
import { log } from "./utils";
import { registerSharedContextMenu } from "./utils/menus";
export { pluginInfo };

// region Variables
const logger = new Logger(pluginInfo.id, pluginInfo.color);
// endregion Variables

// region Definition
export default definePlugin({
    name: pluginInfo.name,
    description: pluginInfo.description,
    authors: pluginInfo.authors,
    settings,
    flux: {
        VOICE_CHANNEL_STATUS_UPDATE({ type, id, guildId, status }) {
            log(`${type};${guildId}/${id};"${status}"`);
        },
        VOICE_STATE_UPDATES({ voiceStates }) {
            log("🎯 VOICE_STATE_UPDATES flux event received:", voiceStates.length, "states");
            const me = UserStore.getCurrentUser();
            if (!me) return;

            for (const voiceState of voiceStates) {
                if (voiceState.userId === me.id) {
                    log("🎯 Processing my voice state update:", voiceState);
                    handleVoiceStateUpdate(voiceState);
                    break;
                }
            }
        },
        VOICE_STATE_CONNECT(voiceState) {
            log("🎤 VOICE_STATE_CONNECT event received:", voiceState);
            handleVoiceStateUpdate(voiceState);
        },
        VOICE_STATE_DISCONNECT(voiceState) {
            log("🎤 VOICE_STATE_DISCONNECT event received:", voiceState);
        },
        VOICE_CHANNEL_SELECT({ type, channelId, guildId }) {
            log(`${type};${guildId}/${channelId}`);
        },
        RTC_CONNECTION_STATE_CHANGE({ type, state, channelId, guildId }) {
            log(`${type};${guildId}/${channelId};"${state}"`);
        }
    },
    stopCleanup: null as (() => void) | null,
    start() {
        log(`🚀 Plugin started - auto-extract servers: ${settings.store.autoExtractServers}`);
        const me = UserStore.getCurrentUser();
        if (me) {
            log("🎤 Current voice state:", VoiceStateStore.getVoiceStateForUser(me.id));
        }
        this.stopCleanup = registerSharedContextMenu(pluginInfo.id, {
            "channel-context": (children, props) => {
                if (props.channel) VoiceChannelContext(children, props);
            },
            "user-context": (children, props) => {
                if (props.user) UserContextMenuPatch(children, props);
            }
        }, log);
    },
    stop() {
        this.stopCleanup?.();
    }
});
// endregion Definition
