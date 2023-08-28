// ==UserScript==
// @name         GEM PurpleFox Extract
// @namespace    http://tampermonkey.net/
// @version      1.0.4
// @description  Extract information about the current GEM round, and format it for PurpleFox.
// @author       Andrew Goulart <andrew@goulart.tech>
// @author       Dan Collins <dcollins@batwing.tech>
// @author       Aurélie Violette
// @website      https://github.com/dcollinsn/gem-tampermonkey
// @match        https://gem.fabtcg.com/gem/*/run/*/report/
// @icon         https://eor-us.purple-fox.fr/favicon.ico
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// ==/UserScript==

// Establish necessary variables needed for validating and managing state information.
const RESULTS = ["1WIN", "2WIN", "DRAW", "LOSSALL"];
var gData = {};
var LSKEYS = {};
gData.tourneyId = new URL(window.location).pathname.split("/")[2];
LSKEYS.PFID = "gem-" + gData.tourneyId;
LSKEYS.UPDATEPF = "gem-updatepf-" + gData.tourneyId;
LSKEYS.UPDATESOLO = "gem-updatepfsolo-" + gData.tourneyId;
gData.pfTourney = localStorage.getItem(LSKEYS.PFID);

// Scrape results from Matches table. Returns array of JS objects containing match data for PurpleFox.
function extractResults() {
    const PLAYER_REGEXP = /^(.+) \((.+)\)$/
    const arrResults = [];
    document.querySelectorAll(".match-row").forEach((row) => {
        const cells = row.querySelectorAll(".match-element");
        const [,playerName1 = null, playerGameId1 = null] = cells[1].innerHTML.match(PLAYER_REGEXP) || []
        const [,playerName2 = null, playerGameId2 = null] = cells[2].innerHTML.match(PLAYER_REGEXP) || []
        const resultvalue = cells[3].querySelector("select").value || null
        arrResults.push({
            tableNumber: parseInt(cells[0].innerHTML),
            playerName1,
            playerGameId1,
            playerName2,
            playerGameId2,
            result: (RESULTS.includes(resultvalue)) ? resultvalue : null,
            tournamentId: gData.pfTourney,
            isAtStage: RESULTS.includes(resultvalue)
        });
    });
    return arrResults;
}

// Scrapes results from Matches table for completed matches. Returns array of JS objects containing table status for PurpleFox.
function extractDone() {
    const arrResults = [];
    document.querySelectorAll(".match-row").forEach((row) => {
        const cells = row.querySelectorAll(".match-element");
        if(RESULTS.includes(cells[3].querySelector("select").value)){
            arrResults.push({
                status: "done",
                tournamentId: gData.pfTourney,
                tableNumber: parseInt(cells[0].innerHTML)
            });
        }
    });
    return arrResults;
}

// Scrapes results from Matches table for in-process matches. Returns array of JS objects containing table status for PurpleFox. 
// Currently not being sent to PurpleFox and is used to determine if Pair Next Round button should replace Accept All Results.
function extractOutstanding() {
    const RESULTS = ["1WIN", "2WIN", "DRAW", "LOSSALL"];
    const arrResults = [];
    document.querySelectorAll(".match-row").forEach((row) => {
        const cells = row.querySelectorAll(".match-element");
        if(!RESULTS.includes(cells[3].children[0].value)){
            arrResults.push({
                status: "playing",
                tournamentId: gData.pfTourney,
                tableNumber: parseInt(cells[0].innerHTML)
            });
        }
    });
    return arrResults;
}

// Initializes userscript to work with PurpleFox. On first load of a new tournament, no PurpleFox Tournament UUID will be present.
// User is prompted for PurpleFox URL to parse UUID from. If left empty, user is prompted to skip PF integration for the remainder
// of the tournament by entering "skip", which is stored as the PF Tournament UUID instead. Finally, if the URL parsed doesn't
// contain a valid UUID, the function escapes and the user will be prompted to initialize again next page load.
function initializePurpleFox(){
    if(gData.pfTourney == null){
        let pfUrl = prompt("Please Copy/Paste the PurpleFox URL");
        if (pfUrl == "" || pfUrl == null){
            let pfSkip = prompt("If you want to skip PurpleFox Integration, type skip","skip")
            if (pfSkip == "skip"){
                localStorage.setItem(LSKEYS.PFID,"skip");
                localStorage.removeItem(LSKEYS.UPDATEPF);
            } else {
                return;
            }
        } else if (pfUrl == "skip") {
            localStorage.setItem(LSKEYS.PFID,"skip");
            localStorage.removeItem(LSKEYS.UPDATEPF);
        }
        let pfId = new URL(pfUrl).pathname.split("/").pop();
        let regexExp = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi
        let regexTest = regexExp.test(pfId)
        if(regexTest){
            localStorage.setItem(LSKEYS.PFID,pfId);
            gData.pfTourney = pfId;
            localStorage.removeItem(LSKEYS.UPDATEPF);
        } else {
            return;
        }
    }
}

function checkSkipPurpleFox(){
    return gData.pfTourney == "skip"
}

// Asynchronous function to push updates to PurpleFox API. If tied to the created "Push to PurpleFox" button, the default event is cancelled to prevent page reload.
// JSON body from extractResults and extractDone is pushed to API endpoint. 
async function pushToPurpleFox(event = null) {
    if(event != null){
        event.preventDefault();
    }
    if(checkSkipPurpleFox()) { return }
    if(gData.pfTourney == null){
        initializePurpleFox();
        return;
    }
    var pfBody = JSON.stringify(extractResults());
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
    var pfBody2 = JSON.stringify(extractDone());
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
    localStorage.removeItem(LSKEYS.UPDATEPF);
}

// Function to change the Accept All Results button to Pair Next Round if all match results are in.
function changeAcceptAllToNextRound() {
    let link = document.querySelectorAll('a.ml-2:nth-child(2)')[0];
    let nextRound = false;
    if(extractOutstanding().length == 0){
        link.setAttribute("href","https://gem.fabtcg.com/gem/"+window.tourneyId+"/next-round/");
        link.innerHTML = "Pair Next Round";
        nextRound = true;
    }
    let href = link.getAttribute("href");
    link.onclick = function(event){
        event.preventDefault();
        let txtPrompt = 'Are you sure you wish to pair the next round?';
        if(nextRound){
            if(confirm(txtPrompt)){
               if(gData.pfTourney !="skip"){
                   localStorage.setItem(LSKEYS.UPDATEPF,"yes");
               }
               window.open(href, "_self");
            }
        } else if (!nextRound) {
            if(gData.pfTourney!="skip"){
                localStorage.setItem(LSKEYS.UPDATEPF,"yes")
            }
            window.open(href, "_self");
        }
    }
}

(function() {
    'use strict';
    window.addEventListener("load",async function (e){
        // Add a 30-second check to accept all mutually agreed results and push to PurpleFox if any links were processed.
        setInterval(async function(){ 
            document.querySelectorAll(".fa-check").forEach(async function (row) {
                await fetch(row.parentElement.href);
                localStorage.setItem(LSKEYS.UPDATESOLO,"yes")
            });
            if(localStorage.getItem(LSKEYS.UPDATESOLO)!= null) {
                localStorage.removeItem(LSKEYS.UPDATESOLO);
                await pushToPurpleFox();
            }
        }, 30000);

        // Check to see if all match results are in. If so, change the Accept All Results button to a Pair Next Round button.
        changeAcceptAllToNextRound();

        // Check if an update to PurpleFox is currently pending from pressing the Accept All button. If so, push to PurpleFox.
        if(localStorage.getItem(LSKEYS.UPDATEPF)!=null){
            await pushToPurpleFox();
            localStorage.removeItem(LSKEYS.UPDATEPF);
        }

        //Adds a Push to PurpleFox Button
        if([null,'skip'].includes(gData.pfTourney) == false){
            var newLink = document.querySelectorAll("a.ml-2:nth-child(2)")[0].cloneNode(true);
            newLink.setAttribute("href","#")
            newLink.innerText="Push to PurpleFox";
            newLink.onclick = pushToPurpleFox;
            document.getElementsByTagName("h2")[0].appendChild(newLink);
        }
    });
})();
