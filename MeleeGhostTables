// ==UserScript==
// @name         Melee Ghost Table Support
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  Highlight tables with 0 or 99 minute time extensions.
// @author       Andrew Goulart <andrew@goulart.tech>
// @website      https://github.com/cf-goulart/Userscripts/
// @updateURL    https://raw.githubusercontent.com/cf-goulart/Userscripts/main/melee-ghosts.js
// @downloadURL  https://raw.githubusercontent.com/cf-goulart/Userscripts/main/melee-ghosts.js
// @match        https://mtgmelee.com/Tournament/Control/*
// @match        https://melee.gg/Tournament/Control/*
// @match        https://sk.mtgmelee.com/Tournament/Control/*
// @match        https://sk.melee.gg/Tournament/Control/*
// ==/UserScript==

function addGhostStyles() {
  $("<style type='text/css'> tr.ghost{ border-color:goldenrod; border-style: double; border-width: medium; font-weight:bold; } table.dataTable{ border-collapse:collapse !important; }</style>").appendTo("body");
}

function classifyGhosts() {
  $(".ghost").removeClass("ghost");
  $(".TimeExtensionMinutes-column button").on("click",classifyGhosts);
  $("td.TimeExtensionMinutes-column").each(function(index, elem){
    let extVal = elem.childNodes[0].childNodes[0].value;
    if( extVal !== "" && (extVal==0 || extVal==99)) {
      $(elem.parentElement).addClass("ghost");
    }
  });
}

$().ready(function (){
    'use strict';
    addGhostStyles();
    classifyGhosts();
    $("#tournament-player-pairings-table_wrapper").on("draw.dt",classifyGhosts);
});
