/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import ErrorBoundary from "@components/ErrorBoundary";
import { copyWithToast } from "@utils/discord";
import { isTruthy } from "@utils/guards";
import { type Channel, type RenderModalProps, type User } from "@vencord/discord-types";
import { ChannelType } from "@vencord/discord-types/enums";
import { ChannelStore, GuildStore, Menu, MessageStore, Modal, openModal, PermissionsBits, PermissionStore, TextInput, UserStore, useState, VoiceStateStore } from "@webpack/common";
import type { ReactElement, ReactNode } from "react";

import { extractCode } from "./logic";
import { PATTERNS } from "./patterns";
import { settings } from "./settings";
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

function addSubmenu(children: MenuChildren, items: ReactNode[]) {
    children.push(
        <Menu.MenuItem id={PATTERNS.submenu.id} key={PATTERNS.submenu.id} label={PATTERNS.submenu.label}>
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
    const { copyInfo: info, copyName, copyStatus, copyCode } = settings.store;
    const items = [
        info && <Menu.MenuItem
            key={PATTERNS.items.copyInfo}
            id={PATTERNS.items.copyInfo}
            label="Copy Info"
            action={() => copyInfo(channel).catch(error => showToast("Could not copy the channel info.", error))}
        />,
        copyName && <Menu.MenuItem
            key={PATTERNS.items.copyName}
            id={PATTERNS.items.copyName}
            label="Copy Name"
            action={() => copyWithToast(channel.name, `Channel name "${channel.name}" copied`)}
        />,
        copyStatus && <Menu.MenuItem
            key={PATTERNS.items.copyStatus}
            id={PATTERNS.items.copyStatus}
            label="Copy Status"
            action={async () => {
                const status = await fetchVoiceChannelStatus(channel);
                if (status) copyWithToast(status, `Channel status "${status}" copied`);
                else showToast("This channel has no status.");
            }}
        />,
        copyCode && <Menu.MenuItem
            key={PATTERNS.items.copyCode}
            id={PATTERNS.items.copyCode}
            label="Copy Code"
            action={async () => {
                const code = await extractCode(channel);
                if (code) copyWithToast(code, `Code ${code} copied`);
                else showToast("No code found in this channel.");
            }}
        />
    ].filter(isTruthy);
    if (!items.length) return null;
    return <Menu.MenuItem key={PATTERNS.items.copy} id={PATTERNS.items.copy} label="Copy">{items}</Menu.MenuItem>;
}

function addVoiceChannelItems(children: MenuChildren, channel: Channel) {
    const items = [copySubmenuFor(channel)].filter(isTruthy);
    if (settings.store.setStatus && channel.type === ChannelType.GUILD_VOICE && PermissionStore.can(PermissionsBits.SET_VOICE_CHANNEL_STATUS, channel)) {
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
    if (items.length) addSubmenu(children, items);
}

export const channelMenuPatch: NavContextMenuPatchCallback = (children, { channel }: { channel?: Channel; }) => {
    if (isVoiceChannel(channel)) addVoiceChannelItems(children, channel);
};

export const userMenuPatch: NavContextMenuPatchCallback = (children, { user }: { user?: User; }) => {
    if (!user || !settings.store.userMenu) return;
    const channelId = VoiceStateStore.getVoiceStateForUser(user.id)?.channelId;
    const channel = channelId ? ChannelStore.getChannel(channelId) : null;
    if (isVoiceChannel(channel)) addVoiceChannelItems(children, channel);
};
