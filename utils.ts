/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { sleep } from "@utils/misc";
import { type Channel } from "@vencord/discord-types";
import { findByCodeLazy, findByPropsLazy, findStoreLazy } from "@webpack";
import { FluxDispatcher, showToast as showDiscordToast } from "@webpack/common";

import { pluginInfo } from "./index";
import { settings } from "./settings";

interface ChannelStatusStore {
    getChannelStatus(channel: Channel): string | undefined;
    hasRequestedStatuses(guildId: string): boolean;
}

const ChannelStatusStore = findStoreLazy("ChannelStatusStore") as ChannelStatusStore;
const requestChannelStatuses = findByCodeLazy('type:"FETCH_CHANNEL_INFO"', "requestChannelInfo(") as (guildId: string) => void;
const ChannelSettingsActions = findByPropsLazy("updateVoiceChannelStatus", "updateChannel") as {
    updateVoiceChannelStatus(channelId: string, status: string): Promise<{ status: number; }>;
};

export function setVoiceChannelStatus(channelId: string, status: string) {
    return ChannelSettingsActions.updateVoiceChannelStatus(channelId, status);
}

export function log(...args: any[]) {
    if (settings.store.logging) {
        console.log("[vcUtils]", ...args);
    }
}

export function showToast(message: string, error?: any | undefined) {
    if (error) console.error(`[${pluginInfo.name}] ${message}:`, error);
    else log(`${message}`);
    showDiscordToast({ text: message, variant: error ? "critical" : "default" });
}

function waitForChannelInfo(guildId: string) {
    return new Promise<void>(resolve => {
        function onChannelInfo(payload: { guildId: string; }) {
            if (payload.guildId !== guildId) return;
            FluxDispatcher.unsubscribe("CHANNEL_INFO", onChannelInfo);
            resolve();
        }
        FluxDispatcher.subscribe("CHANNEL_INFO", onChannelInfo);
        sleep(3000).then(() => {
            FluxDispatcher.unsubscribe("CHANNEL_INFO", onChannelInfo);
            resolve();
        });
    });
}

export async function fetchVoiceChannelStatus(channel: Channel): Promise<string | null> {
    if (!channel.guild_id) return null;
    if (!ChannelStatusStore.hasRequestedStatuses(channel.guild_id)) {
        log(`Requesting channel statuses for guild ${channel.guild_id}`);
        requestChannelStatuses(channel.guild_id);
        await waitForChannelInfo(channel.guild_id);
    }
    const status = ChannelStatusStore.getChannelStatus(channel)?.trim() || null;
    log(`Status for ${channel.name}:`, status);
    return status;
}

export function extractCodeWithIgnore(text: string, regex: RegExp, ignoredWords: string[]): string | null {
    if (!text) return null;
    const matches = text.match(regex);
    if (!matches) return null;
    const ignoredSet = new Set(ignoredWords.map(word => word.toLowerCase().trim()));
    for (const match of matches) {
        if (!ignoredSet.has(match.toLowerCase())) {
            return match;
        }
    }
    return null;
}
