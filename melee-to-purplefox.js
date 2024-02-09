// ==UserScript==
// @name         Melee PurpleFox Extract
// @namespace    http://tampermonkey.net/
// @version      1.0.3
// @description  Extract information about the current Melee round, and format it for PurpleFox.
// @author       Andrew Goulart <andrew@goulart.tech>
// @author       Dan Collins <dcollins@batwing.tech>
// @author       Aurélie Violette
// @website      https://github.com/dcollinsn/melee-tampermonkey
// @updateURL    https://raw.githubusercontent.com/dcollinsn/melee-tampermonkey/main/melee-to-purplefox.js
// @downloadURL  https://raw.githubusercontent.com/dcollinsn/melee-tampermonkey/main/melee-to-purplefox.js
// @match        https://mtgmelee.com/Tournament/Control/*
// @match        https://melee.gg/Tournament/Control/*
// @match        https://sk.mtgmelee.com/Tournament/Control/*
// @match        https://sk.melee.gg/Tournament/Control/*
// @icon         https://eor-us.purple-fox.fr/favicon.ico
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// ==/UserScript==

function extractResult() {
    const result = [];
    document.querySelectorAll("#tournament-player-pairings-table tr").forEach((row) => {
        const tableColumn = row.querySelector('.TableNumber-column')?.innerText;
        const tableNumber = tableColumn && parseInt(tableColumn);
        if (tableColumn && tableNumber && !isNaN(tableNumber)) {
            const tableResult = row.querySelector('.Result-column')?.innerText;
            result.push({
                tableNumber,
                playerName1: row.querySelector('.Player1-column a')?.innerText?.trim(),
                playerGameId1: row.querySelector('.Player1-column a')?.getAttribute('data-id'),
                playerName2: row.querySelector('.Player2-column a')?.innerText?.trim(),
                playerGameId2: row.querySelector('.Player2-column a')?.getAttribute('data-id'),
                result: tableResult === 'Not reported' ? null : tableResult,
            });
        }
    });
    return result;
}

function doMenuCommand(event) {
    const result = extractResult();
    GM_setClipboard(JSON.stringify(result));
}

$().ready(function (){
    $("#tournament-player-pairings-table_wrapper").on("draw.dt",doMenuCommand);
});
