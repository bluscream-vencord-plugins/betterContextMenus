/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { Logger } from "@utils/Logger";
import { findByPropsLazy, findStoreLazy } from "@webpack";
import { MediaEngineStore, Menu, showToast } from "@webpack/common";

import { PATTERNS } from "./patterns";
import { settings } from "./settings";

const logger = new Logger("BetterContextMenus");
const { audio } = PATTERNS;

type InputMode = typeof audio.pttMode | typeof audio.voiceMode;

interface ModeOptions {
    threshold: number;
    autoThreshold: boolean;
}

const AudioActions: {
    setMode(mode: InputMode, options: Partial<ModeOptions>): void;
    setNoiseCancellation(enabled: boolean): void;
} = findByPropsLazy(...audio.audioActions);

const KeybindsStore: { getKeybindForAction(action: string): { enabled: boolean; shortcut: unknown[]; } | null; } = findStoreLazy(audio.keybindsStore);

function hasPttKeybind() {
    const bind = KeybindsStore.getKeybindForAction(audio.pttAction);
    return bind != null && bind.enabled && bind.shortcut.length > 0;
}

function toggleInputMode() {
    const toPtt = MediaEngineStore.getMode() !== audio.pttMode;
    if (toPtt && !hasPttKeybind())
        showToast({ text: "Push to talk has no keybind yet. Set one in Discord's keybind settings, or you won't be able to talk.", variant: "critical" });
    AudioActions.setMode(toPtt ? audio.pttMode : audio.voiceMode, MediaEngineStore.getModeOptions());
}

export function restoreThreshold() {
    const { savedThreshold, savedAutoThreshold } = settings.store;
    if (typeof savedThreshold !== "number") return;
    AudioActions.setMode(MediaEngineStore.getMode(), { ...MediaEngineStore.getModeOptions(), threshold: savedThreshold, autoThreshold: savedAutoThreshold ?? true });
    settings.store.savedThreshold = undefined;
    settings.store.savedAutoThreshold = undefined;
}

function toggleKrisp() {
    const enable = !MediaEngineStore.getNoiseCancellation();
    AudioActions.setNoiseCancellation(enable);
    if (enable) return restoreThreshold();
    if (!settings.store.overrideThresholdWithoutKrisp) return;
    const options = MediaEngineStore.getModeOptions();
    if (typeof settings.store.savedThreshold !== "number") {
        settings.store.savedThreshold = options.threshold;
        settings.store.savedAutoThreshold = options.autoThreshold;
    }
    AudioActions.setMode(MediaEngineStore.getMode(), { ...options, threshold: settings.store.krispOffThreshold, autoThreshold: false });
    logger.info(`Krisp off, sensitivity set to ${settings.store.krispOffThreshold} dB.`);
}

export const audioMenuPatch: NavContextMenuPatchCallback = children => {
    const { showPttToggle, showKrispToggle } = settings.store;
    if (showPttToggle)
        children.push(
            <Menu.MenuCheckboxItem
                id={audio.pttItemId}
                label="Push to Talk"
                checked={MediaEngineStore.getMode() === audio.pttMode}
                action={toggleInputMode}
            />
        );
    if (showKrispToggle && MediaEngineStore.isNoiseCancellationSupported())
        children.push(
            <Menu.MenuCheckboxItem
                id={audio.krispItemId}
                label="Krisp"
                checked={MediaEngineStore.getNoiseCancellation()}
                action={toggleKrisp}
            />
        );
};
