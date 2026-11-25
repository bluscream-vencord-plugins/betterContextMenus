/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { GlobalContextMenuPatchCallback } from "@api/ContextMenu";
import ErrorBoundary from "@components/ErrorBoundary";
import { copyWithToast } from "@utils/discord";
import { type Channel, type RenderModalProps, type User } from "@vencord/discord-types";
import { ChannelType } from "@vencord/discord-types/enums";
import { ChannelStore, GuildStore, Menu, MessageStore, Modal, openModal, PermissionsBits, PermissionStore, TextInput, UserStore, useState, VoiceStateStore } from "@webpack/common";
import type { ReactElement, ReactNode } from "react";

import { extractCode } from "./logic";
import { PATTERNS } from "./patterns";
import { cachedVoiceChannelStatus, fetchVoiceChannelStatus, isVoiceChannel, setVoiceChannelStatus, showToast } from "./utils";

type MenuChildren = Array<ReactElement<any> | null>;

interface SetStatusModalProps {
    channel: Channel;
    initialStatus: string;
    modalProps: RenderModalProps;
}

const SetStatusModal = ErrorBoundary.wrap(({ channel, initialStatus, modalProps }: SetStatusModalProps) => {
    const [status, setStatus] = useState(initialStatus);

    async function save() {
        modalProps.onClose();
        const next = status.trim();
        if (next === initialStatus) return;
        try {
            if (await setVoiceChannelStatus(channel.id, next))
                showToast(next ? `Status of ${channel.name} set.` : `Status of ${channel.name} cleared.`);
            else
                showToast("Discord didn't accept the channel status.", true);
        } catch (error) {
            showToast("Could not set the channel status.", error);
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
}, { noop: true });

function addToVoiceTools(children: MenuChildren, items: ReactNode[]) {
    const existing = children.find(child => child?.props?.id === PATTERNS.voiceTools.id);
    if (existing) {
        const current: ReactNode = existing.props.children;
        existing.props.children = [...(Array.isArray(current) ? current : [current]), ...items];
        return;
    }
    children.splice(-1, 0,
        <Menu.MenuItem id={PATTERNS.voiceTools.id} key={PATTERNS.voiceTools.id} label={PATTERNS.voiceTools.label}>
            {items}
        </Menu.MenuItem>
    );
}

async function copyInfo(channel: Channel) {
    const guild = GuildStore.getGuild(channel.guild_id);
    const status = await fetchVoiceChannelStatus(channel);
    const users = Object.values(VoiceStateStore.getVoiceStatesForChannel(channel.id))
        .map(state => UserStore.getUser(state.userId))
        .filter(Boolean)
        .map(user => `\\@${user.username}`)
        .join(", ");
    const messages = MessageStore.getMessages(channel.id)?._array ?? [];
    const lastMessage = messages.at(-1);

    let info = `${location.origin}/channels/${channel.guild_id}/${channel.id}`;
    if (lastMessage) info += `/${lastMessage.id}`;
    if (guild) info += `\nGuild: \`${guild.name}\``;
    info += `\nName: \`${channel.name}\``;
    if (channel.topic) info += `\nTopic: \`${channel.topic}\``;
    if (status) info += `\nStatus: \`${status}\``;
    if (users) info += `\nUsers: ${users}`;
    if (messages.length) info += `\nMessages: ${messages.length}`;
    copyWithToast(info);
}

function copySubmenuFor(channel: Channel) {
    return (
        <Menu.MenuItem key={PATTERNS.items.copy} id={PATTERNS.items.copy} label="Copy">
            <Menu.MenuItem
                id={PATTERNS.items.copyInfo}
                label="Copy Info"
                action={() => copyInfo(channel).catch(error => showToast("Could not copy the channel info.", error))}
            />
            <Menu.MenuItem
                id={PATTERNS.items.copyName}
                label="Copy Name"
                action={() => copyWithToast(channel.name, `Channel name "${channel.name}" copied`)}
            />
            <Menu.MenuItem
                id={PATTERNS.items.copyStatus}
                label="Copy Status"
                action={async () => {
                    const status = await fetchVoiceChannelStatus(channel);
                    if (status) copyWithToast(status, `Channel status "${status}" copied`);
                    else showToast("This channel has no status.");
                }}
            />
            <Menu.MenuItem
                id={PATTERNS.items.copyCode}
                label="Copy Code"
                action={async () => {
                    const code = await extractCode(channel);
                    if (code) copyWithToast(code, `Code ${code} copied`);
                    else showToast("No code found in this channel.");
                }}
            />
        </Menu.MenuItem>
    );
}

function addVoiceChannelItems(children: MenuChildren, channel: Channel) {
    const items = [copySubmenuFor(channel)];
    if (channel.type === ChannelType.GUILD_VOICE && PermissionStore.can(PermissionsBits.SET_VOICE_CHANNEL_STATUS, channel)) {
        items.push(
            <Menu.MenuItem
                key={PATTERNS.items.setStatus}
                id={PATTERNS.items.setStatus}
                label="Set Status"
                action={() => {
                    const initialStatus = cachedVoiceChannelStatus(channel) ?? "";
                    openModal(modalProps => <SetStatusModal channel={channel} initialStatus={initialStatus} modalProps={modalProps} />);
                }}
            />
        );
    }
    addToVoiceTools(children, items);
}

export const contextMenuPatch: GlobalContextMenuPatchCallback = (navId, children, props: { channel?: Channel; user?: User; }) => {
    if (navId === PATTERNS.menus.channel) {
        if (isVoiceChannel(props.channel)) addVoiceChannelItems(children, props.channel);
        return;
    }
    if (navId !== PATTERNS.menus.user || !props.user) return;
    const channelId = VoiceStateStore.getVoiceStateForUser(props.user.id)?.channelId;
    const channel = channelId ? ChannelStore.getChannel(channelId) : null;
    if (isVoiceChannel(channel)) addVoiceChannelItems(children, channel);
};
