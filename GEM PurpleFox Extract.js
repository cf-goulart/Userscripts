// ==UserScript==
// @name         GEM PurpleFox Extract
// @namespace    http://tampermonkey.net/
// @version      1.0.3
// @description  Extract information about the current GEM round, and format it for PurpleFox.
// @author       Dan Collins <dcollins@batwing.tech>
// @author       Aurélie Violette
// @author       Andrew Goulart <andrew@goulart.tech>
// @website      https://github.com/dcollinsn/gem-tampermonkey
// @match        https://gem.fabtcg.com/gem/*/run/*/report/
// @icon         https://eor-us.purple-fox.fr/favicon.ico
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// ==/UserScript==

function extractAutoResult(tourneyId) {
    const RESULTS = ["1WIN", "2WIN", "DRAW", "LOSSALL"];
    const PLAYER_REGEXP = /^(.+) \((.+)\)$/
    const result = [];
    document.querySelectorAll(".match-row").forEach((row) => {
        const cells = row.querySelectorAll(".match-element");
        const [,playerName1 = null, playerGameId1 = null] = cells[1].innerHTML.match(PLAYER_REGEXP) || []
        const [,playerName2 = null, playerGameId2 = null] = cells[2].innerHTML.match(PLAYER_REGEXP) || []
        const resultvalue = cells[3].querySelector("select").value || null
        result.push({
            tableNumber: parseInt(cells[0].innerHTML),
            playerName1,
            playerGameId1,
            playerName2,
            playerGameId2,
            result: (resultvalue && resultvalue != "selected") ? resultvalue : null,
            tournamentId: tourneyId,
            isAtStage: RESULTS.includes(cells[3].querySelector("select").value)
        });
    });
    return result;
}

function extractDone(tourneyId) {
    const result = [];
    const RESULTS = ["1WIN", "2WIN", "DRAW", "LOSSALL"];
    document.querySelectorAll(".match-row").forEach((row) => {
        const cells = row.querySelectorAll(".match-element");
        if(RESULTS.includes(cells[3].querySelector("select").value)){
            result.push({
                status: "done",
                tournamentId: tourneyId,
                tableNumber: parseInt(cells[0].innerHTML)
            });
        }
    });
    return result;
}

function extractOutstanding() {
    const RESULTS = ["1WIN", "2WIN", "DRAW", "LOSSALL"];
    const result = [];
    document.querySelectorAll(".match-row").forEach((row) => {
        const cells = row.querySelectorAll(".match-element");
        if(!RESULTS.includes(cells[3].children[0].value)){
            result.push({
                status: "playing",
                tableNumber: parseInt(cells[0].innerHTML)
            });
        }
    });
    return result;
}


function overwriteAcceptAll() {
    let link = document.querySelectorAll('a.ml-2:nth-child(2)')[0];
    let outsanding = extractOutstanding();
    let nextRound = false;
    if(outsanding.length == 0){
        link.setAttribute("href","https://gem.fabtcg.com/gem/"+window.tourneyId+"/next-round/");
        link.innerHTML = "Pair Next Round";
        nextRound = true;
    }
    let href = link.getAttribute("href");
    link.onclick = function(event){
        event.preventDefault();
        let txtPrompt = `Are you sure you wish to ${(nextRound)?'pair the next round':'accept all results'}?`
        if(nextRound){
            if(confirm(txtPrompt)){
               if(localStorage.getItem('gem-'+window.tourneyId)!="skip"){
                   localStorage.removeItem('gem-'+window.tourneyId);
                   localStorage.setItem('gem-updatepf-'+window.tourneyId,"yes");
               }
               window.open(href, "_self");
            }
        } else if (!nextRound) {
            if(localStorage.getItem('gem-'+window.tourneyId)!="skip"){
                localStorage.setItem('gem-updatepf-'+window.tourneyId,"yes")
            }
            window.open(href, "_self");
        }
    }
}

(function() {
    'use strict';
    window.addEventListener("load",async function (e){
        let urlItem = new URL(window.location);
        let pathArray = urlItem.pathname.split("/");
        let tourneyId = pathArray[2];
        window.tourneyId = tourneyId;
        let pfId = localStorage.getItem('gem-'+tourneyId);
        if(pfId == null){
            let pfUrl = prompt("Please Copy/Paste the PurpleFox URL");
            if (pfUrl == "" || pfUrl == null){
                let pfSkip = prompt("If you want to skip PurpleFox Integration, type skip","skip")
                if (pfSkip == "skip"){
                    localStorage.setItem('gem-'+tourneyId,"skip");
                    localStorage.setItem('gem-update-'+tourneyId,'no')
                } else {
                    return;
                }
            }
            let pfUrlItem = new URL(pfUrl);
            let pfPathArray = pfUrlItem.pathname.split("/");
            let pfId = pfPathArray[pfPathArray.length - 1];
            let regexExp = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi
            let regexTest = regexExp.test(pfId)
            if(regexTest){
                localStorage.setItem('gem-'+tourneyId,pfId);
                localStorage.setItem('gem-update-'+tourneyId,"no");
            } else {
                return;
            }
        }
        if(pfId == "skip"){
            return;
        }
        if(localStorage.getItem('gem-updatepf-'+tourneyId)=="yes"){
            // Push results to PurpleFox
            let urlItem = new URL(window.location);
            let pathArray = urlItem.pathname.split("/");
            let tourneyId = pathArray[2];
            let pfId = localStorage.getItem('gem-'+tourneyId);
            var pfBody = JSON.stringify(extractAutoResult(pfId));
            await fetch("https://upbcarvmkmyzhbosheyo.supabase.co/rest/v1/tables?columns=%22tableNumber%22%2C%22playerName1%22%2C%22playerGameId1%22%2C%22playerName2%22%2C%22playerGameId2%22%2C%22result%22%2C%22tournamentId%22%2C%22isAtStage%22", {
                "headers": {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
                    "Accept": "*/*",
                    "Accept-Language": "en-US,en;q=0.5",
                    "X-Client-Info": "supabase-js/1.35.7",
                    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwYmNhcnZta215emhib3NoZXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTE5MjQ5NjIsImV4cCI6MTk2NzUwMDk2Mn0.Ris66avSM8Qf7yEpyziybP4fm6NB7MPWPR4pRIflamI",
                    "Prefer": "return=representation,resolution=merge-duplicates",
                    "Content-Profile": "public",
                    "Content-Type": "application/json",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "cross-site"
                },
                "referrer": "https://eor-us.purple-fox.fr/",
                "body": pfBody,
                "method": "POST",
                "mode": "cors"
            });
            var pfBody2 = JSON.stringify(extractDone(pfId));
            await fetch("https://upbcarvmkmyzhbosheyo.supabase.co/rest/v1/table_status?columns=%22tournamentId%22%2C%22tableNumber%22%2C%22status%22", {
                "headers": {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
                    "Accept": "*/*",
                    "Accept-Language": "en-US,en;q=0.5",
                    "X-Client-Info": "supabase-js/1.35.7",
                    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwYmNhcnZta215emhib3NoZXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTE5MjQ5NjIsImV4cCI6MTk2NzUwMDk2Mn0.Ris66avSM8Qf7yEpyziybP4fm6NB7MPWPR4pRIflamI",
                    "Prefer": "return=representation,resolution=merge-duplicates",
                    "Content-Profile": "public",
                    "Content-Type": "application/json",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "cross-site"
                },
                "referrer": "https://eor-us.purple-fox.fr/",
                "body": pfBody2,
                "method": "POST",
                "mode": "cors"
            });
            localStorage.setItem('gem-updatepf-'+tourneyId,"no");
        }
        overwriteAcceptAll();
    });
})();
