/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { isPluginEnabled } from "@api/PluginManager";
import { copyToClipboard } from "@utils/clipboard";
import { type Channel } from "@vencord/discord-types";
import { AuthenticationStore, ChannelStore, MessageStore, SelectedChannelStore, showToast } from "@webpack/common";

import { PATTERNS } from "./patterns";
import { settings } from "./settings";
import { extractCodeWithIgnore, fetchVoiceChannelStatus, isVoiceChannel, log, splitList } from "./utils";

export interface OwnVoiceState {
    userId: string;
    sessionId?: string;
    channelId?: string | null;
}

let lastChannelId: string | null = null;

async function copyText(text: string) {
    const nativeCopy = IS_WEB ? undefined : VencordNative.pluginHelpers[PATTERNS.nativeUtils]?.copyText;
    if (nativeCopy && isPluginEnabled(PATTERNS.nativeUtils) && await nativeCopy(text) === true) return;
    await copyToClipboard(text);
}

export function resetVoiceTracking() {
    lastChannelId = SelectedChannelStore.getVoiceChannelId() ?? null;
}

export async function extractCode(channel: Channel): Promise<string | null> {
    const regex = new RegExp(settings.store.codeRegex, "g");
    const ignored = new Set(splitList(settings.store.ignoredWords).map(word => word.toLowerCase()));

    const status = await fetchVoiceChannelStatus(channel);
    const fromChannel = [status, channel.topic, channel.name]
        .map(text => text && extractCodeWithIgnore(text, regex, ignored))
        .find(Boolean);
    if (fromChannel) return fromChannel;

    const messages = MessageStore.getMessages(channel.id)?._array ?? [];
    for (const message of messages.toReversed()) {
        const code = message.content && extractCodeWithIgnore(message.content, regex, ignored);
        if (code) return code;
    }
    return null;
}

async function autoExtract(channel: Channel) {
    if (!isVoiceChannel(channel) || !splitList(settings.store.autoExtractServers).includes(channel.guild_id)) return;
    const code = await extractCode(channel);
    log(code ? `Auto-extracted a code in ${channel.id}` : `No code found in ${channel.id}`);
    if (!code) return;
    try {
        await copyText(code);
        showToast({ text: `Auto-extracted code ${code} copied`, variant: "success" });
    } catch (e) {
        log(`Copying code ${code} failed: ${e}`);
        showToast({ text: `Couldn't copy code ${code}.`, variant: "critical" });
    }
}

export function handleVoiceStateUpdates(voiceStates: OwnVoiceState[]) {
    const sessionId = AuthenticationStore.getSessionId();
    const own = voiceStates.find(state => state.sessionId === sessionId);
    if (!own) return;
    const previous = lastChannelId;
    lastChannelId = own.channelId ?? null;
    if (!lastChannelId || lastChannelId === previous) return;
    return autoExtract(ChannelStore.getChannel(lastChannelId));
}

export function handleVoiceChannelStatusUpdate(channelId: string) {
    if (SelectedChannelStore.getVoiceChannelId() !== channelId) return;
    return autoExtract(ChannelStore.getChannel(channelId));
}
