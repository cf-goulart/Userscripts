// ==UserScript==
// @name         Melee-To-PurpleFox Bridge
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  Extract information about the current GEM round and automatically import it into PurpleFox.
// @author       Andrew Goulart <andrew@goulart.tech>
// @author       Dan Collins <dcollins@batwing.tech>
// @author       Aurélie Violette
// @website      https://github.com/cf-agoulart/userscripts
// @updateURL    https://raw.githubusercontent.com/cf-goulart/Userscripts/main/melee-ghosts.js
// @downloadURL  https://raw.githubusercontent.com/cf-goulart/Userscripts/main/melee-ghosts.js
// @match        https://mtgmelee.com/Tournament/Control/*
// @match        https://melee.gg/Tournament/Control/*
// @match        https://sk.mtgmelee.com/Tournament/Control/*
// @match        https://sk.melee.gg/Tournament/Control/*
// ==/UserScript==

// Establish necessary variables needed for validating and managing state information.
var mData = {};
var LSKEYS = {};
mData.tourneyId = new URL(window.location).pathname.split("/")[3];
LSKEYS.PFID = "melee-" + mData.tourneyId;
LSKEYS.UPDATEPF = "melee-updatepf-" + mData.tourneyId;
mData.pfTourney = localStorage.getItem(LSKEYS.PFID);

// Query results from Melee. Sends arrays of JS objects to PurpleFox.
async function processTournament() {
    if(checkSkipPurpleFox()) { return; }
    if(mData.pfTourney == null){
        initializePurpleFox();
        return;
    }
    await fetch(`https://melee.gg/Tournament/GetTournamentMetrics/${mData.tourneyId}`, {
        "credentials": "include",
        "headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.5",
            "X-Requested-With": "XMLHttpRequest",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "Pragma": "no-cache",
            "Cache-Control": "no-cache"
        },
        "method": "GET",
        "mode": "cors"
    }).then((response) => {
        if(!response.ok){
            console.log("ERROR Occured! Status: " + response.status);
        } else {
            console.log(response);
            return response.json();
        }
    }).then(async (response) => {    
        metricsJson = response;
        console.log(metricsJson);
        var curRound = metricsJson.CurrentRound.replace(/\D/g,'');
        await fetch(`https://melee.gg/Tournament/GetRoundTurnover/${mData.tourneyId}`, {
            "credentials": "include",
            "headers": {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
                "Accept": "application/json, text/javascript, */*; q=0.01",
                "Accept-Language": "en-US,en;q=0.5",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin",
                "Pragma": "no-cache",
                "Cache-Control": "no-cache"
            },
            "body": "draw=1&columns%5B0%5D%5Bdata%5D=PhaseSortOrder&columns%5B0%5D%5Bname%5D=PhaseSortOrder&columns%5B0%5D%5Bsearchable%5D=true&columns%5B0%5D%5Borderable%5D=true&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=RoundNumber&columns%5B1%5D%5Bname%5D=RoundNumber&columns%5B1%5D%5Bsearchable%5D=true&columns%5B1%5D%5Borderable%5D=true&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=LastMatchCreatedDate&columns%5B2%5D%5Bname%5D=LastMatchCreatedDate&columns%5B2%5D%5Bsearchable%5D=true&columns%5B2%5D%5Borderable%5D=true&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=LastMatchSubmitted&columns%5B3%5D%5Bname%5D=LastMatchSubmitted&columns%5B3%5D%5Bsearchable%5D=true&columns%5B3%5D%5Borderable%5D=true&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=RoundLength&columns%5B4%5D%5Bname%5D=RoundLength&columns%5B4%5D%5Bsearchable%5D=false&columns%5B4%5D%5Borderable%5D=false&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&order%5B0%5D%5Bcolumn%5D=0&order%5B0%5D%5Bdir%5D=asc&order%5B1%5D%5Bcolumn%5D=1&order%5B1%5D%5Bdir%5D=asc&start=0&length=25&search%5Bvalue%5D=&search%5Bregex%5D=false",
            "method": "POST",
            "mode": "cors"
        }).then((response) => {
            if(!response.ok){
                console.log("ERROR Occured! Status: " + response.status);
            } else {
                console.log(response);
                return response.json();
            }
        }).then(async (response) => {    
            roundTurnoverData = response;
            console.log(roundTurnoverData);
            roundId = roundTurnoverData.data[curRound-1].RoundId;
            await fetch(`https://melee.gg/Tournament/GetRoundPairings/${roundId}?showUnpublished=true`, {
                "credentials": "include",
                "headers": {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
                    "Accept": "application/json, text/javascript, */*; q=0.01",
                    "Accept-Language": "en-US,en;q=0.5",
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "X-Requested-With": "XMLHttpRequest",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-origin",
                    "Pragma": "no-cache",
                    "Cache-Control": "no-cache"
                },
                "body": "draw=4&columns%5B0%5D%5Bdata%5D=ID&columns%5B0%5D%5Bname%5D=ID&columns%5B0%5D%5Bsearchable%5D=false&columns%5B0%5D%5Borderable%5D=false&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=TableNumber&columns%5B1%5D%5Bname%5D=TableNumber&columns%5B1%5D%5Bsearchable%5D=true&columns%5B1%5D%5Borderable%5D=true&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=Player1&columns%5B2%5D%5Bname%5D=Player1&columns%5B2%5D%5Bsearchable%5D=false&columns%5B2%5D%5Borderable%5D=true&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=Player1FirstName&columns%5B3%5D%5Bname%5D=Player1FirstName&columns%5B3%5D%5Bsearchable%5D=true&columns%5B3%5D%5Borderable%5D=true&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=Player1LastName&columns%5B4%5D%5Bname%5D=Player1LastName&columns%5B4%5D%5Bsearchable%5D=true&columns%5B4%5D%5Borderable%5D=true&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B5%5D%5Bdata%5D=Player1CheckedIn&columns%5B5%5D%5Bname%5D=Player1CheckedIn&columns%5B5%5D%5Bsearchable%5D=false&columns%5B5%5D%5Borderable%5D=true&columns%5B5%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B5%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B6%5D%5Bdata%5D=Player1Discord&columns%5B6%5D%5Bname%5D=Player1Discord&columns%5B6%5D%5Bsearchable%5D=true&columns%5B6%5D%5Borderable%5D=true&columns%5B6%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B6%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B7%5D%5Bdata%5D=Player1Twitch&columns%5B7%5D%5Bname%5D=Player1Twitch&columns%5B7%5D%5Bsearchable%5D=true&columns%5B7%5D%5Borderable%5D=true&columns%5B7%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B7%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B8%5D%5Bdata%5D=Player1Decklist&columns%5B8%5D%5Bname%5D=Player1Decklist&columns%5B8%5D%5Bsearchable%5D=true&columns%5B8%5D%5Borderable%5D=true&columns%5B8%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B8%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B9%5D%5Bdata%5D=Player2&columns%5B9%5D%5Bname%5D=Player2&columns%5B9%5D%5Bsearchable%5D=false&columns%5B9%5D%5Borderable%5D=true&columns%5B9%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B9%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B10%5D%5Bdata%5D=Player2FirstName&columns%5B10%5D%5Bname%5D=Player2FirstName&columns%5B10%5D%5Bsearchable%5D=true&columns%5B10%5D%5Borderable%5D=true&columns%5B10%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B10%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B11%5D%5Bdata%5D=Player2LastName&columns%5B11%5D%5Bname%5D=Player2LastName&columns%5B11%5D%5Bsearchable%5D=true&columns%5B11%5D%5Borderable%5D=true&columns%5B11%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B11%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B12%5D%5Bdata%5D=Player2CheckedIn&columns%5B12%5D%5Bname%5D=Player2CheckedIn&columns%5B12%5D%5Bsearchable%5D=false&columns%5B12%5D%5Borderable%5D=true&columns%5B12%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B12%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B13%5D%5Bdata%5D=Player2Discord&columns%5B13%5D%5Bname%5D=Player2Discord&columns%5B13%5D%5Bsearchable%5D=true&columns%5B13%5D%5Borderable%5D=true&columns%5B13%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B13%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B14%5D%5Bdata%5D=Player2Twitch&columns%5B14%5D%5Bname%5D=Player2Twitch&columns%5B14%5D%5Bsearchable%5D=true&columns%5B14%5D%5Borderable%5D=true&columns%5B14%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B14%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B15%5D%5Bdata%5D=Player2Decklist&columns%5B15%5D%5Bname%5D=Player2Decklist&columns%5B15%5D%5Bsearchable%5D=true&columns%5B15%5D%5Borderable%5D=true&columns%5B15%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B15%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B16%5D%5Bdata%5D=HasResults&columns%5B16%5D%5Bname%5D=HasResults&columns%5B16%5D%5Bsearchable%5D=false&columns%5B16%5D%5Borderable%5D=true&columns%5B16%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B16%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B17%5D%5Bdata%5D=Result&columns%5B17%5D%5Bname%5D=Result&columns%5B17%5D%5Bsearchable%5D=false&columns%5B17%5D%5Borderable%5D=false&columns%5B17%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B17%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B18%5D%5Bdata%5D=PodNumber&columns%5B18%5D%5Bname%5D=PodNumber&columns%5B18%5D%5Bsearchable%5D=true&columns%5B18%5D%5Borderable%5D=true&columns%5B18%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B18%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B19%5D%5Bdata%5D=LastSubmitted&columns%5B19%5D%5Bname%5D=LastSubmitted&columns%5B19%5D%5Bsearchable%5D=false&columns%5B19%5D%5Borderable%5D=true&columns%5B19%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B19%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B20%5D%5Bdata%5D=IsPublished&columns%5B20%5D%5Bname%5D=IsPublished&columns%5B20%5D%5Bsearchable%5D=false&columns%5B20%5D%5Borderable%5D=true&columns%5B20%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B20%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B21%5D%5Bdata%5D=ByeReason&columns%5B21%5D%5Bname%5D=ByeReason&columns%5B21%5D%5Bsearchable%5D=true&columns%5B21%5D%5Borderable%5D=true&columns%5B21%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B21%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B22%5D%5Bdata%5D=IsFeatureMatch&columns%5B22%5D%5Bname%5D=IsFeatureMatch&columns%5B22%5D%5Bsearchable%5D=false&columns%5B22%5D%5Borderable%5D=true&columns%5B22%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B22%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B23%5D%5Bdata%5D=TimeExtensionMinutes&columns%5B23%5D%5Bname%5D=TimeExtensionMinutes&columns%5B23%5D%5Bsearchable%5D=true&columns%5B23%5D%5Borderable%5D=true&columns%5B23%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B23%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B24%5D%5Bdata%5D=EndOfRoundStaffName&columns%5B24%5D%5Bname%5D=EndOfRoundStaffName&columns%5B24%5D%5Bsearchable%5D=true&columns%5B24%5D%5Borderable%5D=true&columns%5B24%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B24%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B25%5D%5Bdata%5D=Search&columns%5B25%5D%5Bname%5D=Search&columns%5B25%5D%5Bsearchable%5D=false&columns%5B25%5D%5Borderable%5D=false&columns%5B25%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B25%5D%5Bsearch%5D%5Bregex%5D=false&order%5B0%5D%5Bcolumn%5D=1&order%5B0%5D%5Bdir%5D=asc&start=0&length=-1&search%5Bvalue%5D=&search%5Bregex%5D=false",
                "method": "POST",
                "mode": "cors"
            }).then((response) => {
                if(!response.ok){
                    console.log("ERROR Occured! Status: " + response.status);
                } else {
                    console.log(response);
                    return response.json();
                }
            }).then(async (response) => {
                console.log(response);
                const tables = [];
                const tableStatus = [];
                response.data.forEach((match) => {
                    if(match.TableNumber !== null){
                        tables.push({
                            "tableNumber":match.TableNumber,
                            "playerName1":match.Player1,
                            "playerGameId1":match.Player1Id,
                            "playerName2":match.Player2,
                            "playerGameId2":match.Player2Id,
                            "result":match.Result,
                            "tournamentId":mData.pfTourney,
                            "isAtStage":match.HasResults
                        });
                        if(match.HasResults){
                            tableStatus.push({
                                "status":"done",
                                "tableNumber":match.TableNumber,
                                "tournamentId":mData.pfTourney
                            })    
                        }
                    }
                });
                pfTablesBody = JSON.stringify(tables);
                pfTableStatusBody = JSON.stringify(tableStatus);
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
                    "body": pfTablesBody,
                    "method": "POST",
                    "mode": "cors"
                });
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
                    "body": pfTablesBody,
                    "method": "POST",
                    "mode": "cors"
                });
            });
        });    
    });
}

// Initializes userscript to work with PurpleFox. On first load of a new tournament, no PurpleFox Tournament UUID will be present.
// User is prompted for PurpleFox URL to parse UUID from. If left empty, user is prompted to skip PF integration for the remainder
// of the tournament by entering "skip", which is stored as the PF Tournament UUID instead. Finally, if the URL parsed doesn't
// contain a valid UUID, the function escapes and the user will be prompted to initialize again next page load.
function initializePurpleFox(){
    if(mData.pfTourney == null){
        let pfUrl = prompt("Please Copy/Paste the PurpleFox URL");
        if (pfUrl == "" || pfUrl == null || pfUrl == "skip"){
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
            mData.pfTourney = pfId;
            localStorage.removeItem(LSKEYS.UPDATEPF);
        } else {
            return;
        }
    }
}

function checkSkipPurpleFox(){
    return mData.pfTourney == "skip"
}

(function() {
    'use strict';
    setInterval(processTournament,30000);
})();