/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { findGroupChildrenByChildId, type GlobalContextMenuPatchCallback } from "@api/ContextMenu";
import { parseUrl } from "@utils/misc";
import { Menu } from "@webpack/common";

import { PATTERNS } from "./patterns";
import { settings } from "./settings";

interface LinkMenuProps {
    itemHref?: string;
    itemSafeSrc?: string;
    itemSrc?: string;
}

function linkOf(props: LinkMenuProps | undefined) {
    const url = parseUrl(props?.itemHref ?? props?.itemSafeSrc ?? props?.itemSrc ?? "");
    return url && PATTERNS.openExternally.protocols.includes(url.protocol) ? url.href : undefined;
}

export const linkMenuPatch: GlobalContextMenuPatchCallback = (_navId, children, ...args: Array<LinkMenuProps | undefined>) => {
    if (!settings.store.openInBrowser) return;
    const group = findGroupChildrenByChildId(PATTERNS.openExternally.anchor, children);
    const url = linkOf(args[0]);
    if (!group || !url || group.some(child => child?.props?.id === PATTERNS.openExternally.id)) return;
    const index = group.findIndex(child => child?.props?.id === PATTERNS.openExternally.anchor);
    group.splice(index + 1, 0,
        <Menu.MenuItem
            key={PATTERNS.openExternally.id}
            id={PATTERNS.openExternally.id}
            label="Open in Browser"
            action={() => VencordNative.native.openExternal(url)}
        />
    );
};
