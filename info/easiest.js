/** @param {NS} ns */
import {scan} from "utils/getallservers.ts"
let moneyMin = 100;

function fmtTime(sec) {
    sec = Math.floor(sec/1000);

    const h = Math.floor(sec / 3600);
    sec %= 3600;
    const m = Math.floor(sec / 60);
    const s = sec % 60;

    let out = "";
    if (h) out += h + "hr";
    if (m) out += m + "m";
    if (s || out === "") out += s + "s";

    return out;
}

function fmtTimeShort(sec) {
    sec = Math.floor(sec/1000);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);

    if (h && m) return `${h}hr${m}m`;
    if (h) return `${h}hr`;
    if (m) return `${m}m`;
    return `${sec}s`;
}

function sorting(servers, type="growth"){
  let analysis2 = []
  for (let i = 0; i < servers.length; i++){
    if (servers[i][0].moneyMax > moneyMin){
      analysis2.push(servers[i])
    }
  }
  servers = analysis2; 
  switch (type){
    case "growth":
      return servers.sort((a, b) => a[0].serverGrowth - b[0].serverGrowth);
      break;
    case "weaktime":
      return servers.sort((a, b) => a[1] - b[1]);  // weaken time
      break;
  }
}

/** @param {NS} ns */
function getAnalysis(ns, servers){
  let analysis = [];
  for (let i = 0; i < servers.length; i++){
    if (servers[i].includes("pServ")){continue};
    let hackTime = ns.getHackTime(servers[i]);
    let weakTime = ns.getWeakenTime(servers[i]);
    let growTime = ns.getGrowTime(servers[i]);
    let server = ns.getServer(servers[i]);
    analysis.push([server, weakTime]);
  }
  // let sAnalysis = analysis.sort((a, b) => a[0].serverGrowth - b[0].serverGrowth);
  return analysis
}

/** @param {NS} ns */
export async function main(ns) {
  let type = await ns.prompt("Sorting var: ", {type: "select", "choices": ['growth','weaktime']})
  moneyMin = await ns.prompt("MinMonCap: ", {type: "text"})
  if (type == ""){ns.tprint("Missing inputs"); return;}


  let servers = scan(ns, "home");
  let sAnalysis = getAnalysis(ns, servers) // unsorted
  sAnalysis = sorting(sAnalysis, type); // sorted
  for (let i = 0; i < sAnalysis.length; i++){
    const row = "%-20s %4s %3d/%d/%d %6s %4s %4s";
    let s = sAnalysis[i];
    ns.tprintf(
      row,
      s[0].hostname,
      s[0].serverGrowth,
      s[0].requiredHackingSkill,
      s[0].hackDifficulty,
      s[0].minDifficulty,
      ns.formatNumber(sAnalysis[i][0].moneyMax,0),
      s[0].hasAdminRights ? "Y" : "N",
      fmtTimeShort(s[1])
    );

    //ns.tprint(sAnalysis[i][0].hostname, ". Growth: ", sAnalysis[i][0].serverGrowth, ". HackLevel: ", sAnalysis[i][0].minDifficulty, ". MonMax: ", ns.formatNumber(sAnalysis[i][0].moneyMax));
  }
    ns.tprintf("hostname serverGrowth minDifficulty MonMax ROOT")
}