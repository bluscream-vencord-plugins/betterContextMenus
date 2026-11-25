/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Logger } from "@utils/Logger";
import { sleep } from "@utils/misc";
import { type Channel } from "@vencord/discord-types";
import { ChannelType } from "@vencord/discord-types/enums";
import { findByCodeLazy, findByPropsLazy } from "@webpack";
import { ChannelStatusStore, FluxDispatcher, showToast as showDiscordToast } from "@webpack/common";

import { pluginInfo } from "./info";
import { PATTERNS } from "./patterns";
import { settings } from "./settings";

export const logger = new Logger(pluginInfo.name, pluginInfo.color);

const requestChannelStatuses: (guildId: string) => void = findByCodeLazy(...PATTERNS.requestChannelInfo);
const ChannelSettingsActions: {
    updateVoiceChannelStatus(channelId: string, status: string): Promise<{ status: number; }>;
} = findByPropsLazy(...PATTERNS.channelSettingsActions);

export function log(...args: unknown[]) {
    if (settings.store.logging) logger.debug(...args);
}

export function isVoiceChannel(channel: Channel | null | undefined): channel is Channel {
    return channel?.type === ChannelType.GUILD_VOICE || channel?.type === ChannelType.GUILD_STAGE_VOICE;
}

export function showToast(message: string, error?: unknown) {
    if (error) logger.error(message, error);
    showDiscordToast({ text: message, variant: error ? "critical" : "default" });
}

export async function setVoiceChannelStatus(channelId: string, status: string) {
    const { status: httpStatus } = await ChannelSettingsActions.updateVoiceChannelStatus(channelId, status);
    return httpStatus === PATTERNS.statusSetOk;
}

function waitForChannelInfo(guildId: string) {
    return new Promise<void>(resolve => {
        function onChannelInfo(payload: { guildId: string; }) {
            if (payload.guildId !== guildId) return;
            FluxDispatcher.unsubscribe(PATTERNS.channelInfoEvent, onChannelInfo);
            resolve();
        }
        FluxDispatcher.subscribe(PATTERNS.channelInfoEvent, onChannelInfo);
        sleep(PATTERNS.channelInfoTimeoutMs).then(() => {
            FluxDispatcher.unsubscribe(PATTERNS.channelInfoEvent, onChannelInfo);
            resolve();
        });
    });
}

export function cachedVoiceChannelStatus(channel: Channel) {
    return ChannelStatusStore.getChannelStatus(channel)?.trim() || null;
}

export async function fetchVoiceChannelStatus(channel: Channel): Promise<string | null> {
    if (!channel.guild_id) return null;
    if (!ChannelStatusStore.hasRequestedStatuses(channel.guild_id)) {
        requestChannelStatuses(channel.guild_id);
        await waitForChannelInfo(channel.guild_id);
    }
    return cachedVoiceChannelStatus(channel);
}

export function splitList(value: string) {
    return value.split(PATTERNS.listSeparator).map(item => item.trim()).filter(Boolean);
}

export function extractCodeWithIgnore(text: string, regex: RegExp, ignored: Set<string>): string | null {
    for (const [match] of text.matchAll(regex)) {
        if (!ignored.has(match.toLowerCase())) return match;
    }
    return null;
}
