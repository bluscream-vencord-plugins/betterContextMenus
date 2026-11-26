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
    showOpenChatWhenLocked: {
        type: OptionType.BOOLEAN,
        description: "Don't hide \"Open Chat\" on locked voice channels whose chat you can see.",
        default: true,
        restartNeeded: true
    }
});
