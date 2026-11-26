/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

import { PATTERNS } from "./patterns";

export const settings = definePluginSettings({
    logging: {
        type: OptionType.BOOLEAN,
        description: "Log what the plugin does to the console.",
        default: false
    },
    codeRegex: {
        type: OptionType.STRING,
        description: "Regular expression that matches a code.",
        default: PATTERNS.defaults.codeRegex,
        isValid(value: string) {
            try {
                new RegExp(value, "g");
                return true;
            } catch (e) {
                return e instanceof Error ? e.message : "That isn't a valid regular expression.";
            }
        }
    },
    ignoredWords: {
        type: OptionType.STRING,
        description: "Comma separated words that look like codes but should be skipped.",
        default: PATTERNS.defaults.ignoredWords
    },
    autoExtractServers: {
        type: OptionType.STRING,
        description: "Comma separated server ids where joining a voice channel copies its code.",
        default: PATTERNS.defaults.autoExtractServers
    },
    copyInfo: { type: OptionType.BOOLEAN, description: "Show Copy Info in a voice channel's Copy submenu.", default: true },
    copyName: { type: OptionType.BOOLEAN, description: "Show Copy Name in a voice channel's Copy submenu.", default: true },
    copyStatus: { type: OptionType.BOOLEAN, description: "Show Copy Status in a voice channel's Copy submenu.", default: true },
    copyCode: { type: OptionType.BOOLEAN, description: "Show Copy Code in a voice channel's Copy submenu.", default: true },
    setStatus: { type: OptionType.BOOLEAN, description: "Show Set Status on voice channels where you're allowed to set it.", default: true },
    userMenu: { type: OptionType.BOOLEAN, description: "Also show the voice channel items when right-clicking a user who is in voice.", default: true },
    openInBrowser: {
        type: OptionType.BOOLEAN,
        description: "Add \"Open in Browser\" after Open Link, which always opens the link in your browser instead of an Equibop window.",
        default: true
    },
    showPttToggle: {
        type: OptionType.BOOLEAN,
        description: "Show a push to talk toggle in the microphone context menu.",
        default: true
    },
    showKrispToggle: {
        type: OptionType.BOOLEAN,
        description: "Show a Krisp toggle in the microphone context menu.",
        default: true
    },
    overrideThresholdWithoutKrisp: {
        type: OptionType.BOOLEAN,
        description: "Set a fixed voice activity sensitivity while Krisp is turned off from the menu, and put the old one back when Krisp is turned on again.",
        default: false
    },
    krispOffThreshold: {
        type: OptionType.SLIDER,
        description: "Sensitivity in dB used while Krisp is off, if the option above is on.",
        default: -60,
        markers: [-100, -80, -60, -40, -20, 0],
        stickToMarkers: false
    },
    showOpenChatWhenLocked: {
        type: OptionType.BOOLEAN,
        description: "Don't hide \"Open Chat\" on locked voice channels whose chat you can see.",
        default: true,
        restartNeeded: true
    }
}).withPrivateSettings<{ savedThreshold?: number; savedAutoThreshold?: boolean; }>();
