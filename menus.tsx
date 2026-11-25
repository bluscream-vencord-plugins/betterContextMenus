/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import ErrorBoundary from "@components/ErrorBoundary";
import { copyWithToast } from "@utils/discord";
import { type Channel, type Message, type RenderModalProps, type User } from "@vencord/discord-types";
import { ChannelStore, GuildStore, Menu, MessageStore, Modal, openModal, PermissionsBits, PermissionStore, React, TextInput, UserStore, useState, VoiceStateStore } from "@webpack/common";

import { extractCode } from "./logic";
import { fetchVoiceChannelStatus, log, setVoiceChannelStatus, showToast } from "./utils";
import { isVoiceChannel } from "./utils/channels";
import { addToSubmenu } from "./utils/menus";

interface VoiceChannelContextProps {
    channel: Channel;
}

interface SetStatusModalProps {
    channel: Channel;
    initialStatus: string;
    modalProps: RenderModalProps;
}

function SetStatusModal({ channel, initialStatus, modalProps }: SetStatusModalProps) {
    const [status, setStatus] = useState(initialStatus);

    async function save() {
        modalProps.onClose();
        try {
            await setVoiceChannelStatus(channel.id, status.trim());
            showToast(status.trim() ? `Status of ${channel.name} set` : `Status of ${channel.name} cleared`);
        } catch (error) {
            showToast("Could not set the channel status", error);
        }
    }

    return (
        <Modal
            {...modalProps}
            size="sm"
            title={`Set status of ${channel.name}`}
            actions={[{ text: "Save", variant: "primary", onClick: save }]}
        >
            <form onSubmit={e => { e.preventDefault(); save(); }}>
                <TextInput value={status} onChange={setStatus} placeholder="Leave empty to clear the status" maxLength={500} autoFocus />
            </form>
        </Modal>
    );
}

const SafeSetStatusModal = ErrorBoundary.wrap(SetStatusModal);

export const VoiceChannelContext: NavContextMenuPatchCallback = (children, { channel }: VoiceChannelContextProps) => {
    log("VoiceChannelContext patch running for channel", channel.name);
    if (!isVoiceChannel(channel)) return children;

    const items = [copySubmenuFor(channel)];
    if (PermissionStore.can(PermissionsBits.SET_VOICE_CHANNEL_STATUS, channel)) {
        items.push(
            <Menu.MenuItem
                key="voice-tools-set-status"
                id="voice-tools-set-status"
                label="Set Status"
                action={async () => {
                    const initialStatus = await fetchVoiceChannelStatus(channel) ?? "";
                    openModal(modalProps => <SafeSetStatusModal channel={channel} initialStatus={initialStatus} modalProps={modalProps} />);
                }}
            />
        );
    }

    addToSubmenu(children, "voice-tools", "Voice Tools", items, log);
    return children;
};

function copySubmenuFor(channel: Channel) {
    return (
        <Menu.MenuItem
            key="voice-tools-copy-submenu"
            id="voice-tools-copy-submenu"
            label="Copy"
        >
            <Menu.MenuItem
                key="voice-tools-copy-info"
                id="voice-tools-copy-info"
                label="Copy Info"
                action={async () => {
                    try {
                        log(`Starting copy info for channel: ${channel.name}`);
                        let guild;
                        try { guild = GuildStore.getGuild(channel.guild_id); } catch (e) {}
                        const status = await fetchVoiceChannelStatus(channel);

                        let users = "";
                        try {
                            const voiceStates = VoiceStateStore.getVoiceStatesForChannel(channel.id) as Record<string, any>;
                            users = Object.values(voiceStates || {}).map(state => {
                                const user = UserStore.getUser(state.userId);
                                return user ? `\\@${user.username}` : null;
                            }).filter(Boolean).join(", ");
                        } catch (e) {}

                        let messageCount = 0;
                        let lastMessage: Message | null = null;
                        try {
                            const messages = MessageStore.getMessages(channel.id)?._array;
                            messageCount = messages?.length ?? 0;
                            lastMessage = messages?.[0] ?? null;
                        } catch (e) {}

                        let info = `https://discord.com/channels/${channel.guild_id}/${channel.id}`;
                        if (lastMessage) info += `/${lastMessage.id}`;
                        if (guild) info += `\nGuild: \`${guild.name}\``;
                        if (channel?.name) info += `\nName: \`${channel.name}\``;
                        if (channel?.topic) info += `\nTopic: \`${channel.topic}\``;
                        if (status) info += `\nStatus: \`${status}\``;
                        if (users) info += `\nUsers: ${users}`;
                        if (messageCount > 0) info += `\nMessages: ${messageCount}`;

                        log("Final info:", info);
                        copyWithToast(info.trim());
                    } catch (error) {
                        showToast("Error copying info", error);
                    }
                }}
            />
            <Menu.MenuItem
                key="voice-tools-copy-name"
                id="voice-tools-copy-name"
                label="Copy Name"
                action={() => {
                    if (channel?.name) copyWithToast(channel.name, `Channel name "${channel.name}" copied`);
                }}
            />
            <Menu.MenuItem
                key="voice-tools-copy-status"
                id="voice-tools-copy-status"
                label="Copy Status"
                action={async () => {
                    const status = await fetchVoiceChannelStatus(channel);
                    if (status) copyWithToast(status, `Channel status "${status}" copied`);
                    else showToast("This channel has no status.");
                }}
            />
            <Menu.MenuItem
                key="voice-tools-copy-code"
                id="voice-tools-copy-code"
                label="Copy Code"
                action={async () => {
                    const code = await extractCode(channel);
                    if (code) copyWithToast(code, `Code ${code} copied`);
                }}
            />
        </Menu.MenuItem>
    );
}

export const UserContextMenuPatch: NavContextMenuPatchCallback = (children, { user }: { user: User }) => {
    if (!user) return;
    const voiceState = VoiceStateStore.getVoiceStateForUser(user.id);
    if (!voiceState?.channelId) return;

    const channel = ChannelStore.getChannel(voiceState.channelId);
    if (!channel) return;

    VoiceChannelContext(children, { channel });
    return children;
};
