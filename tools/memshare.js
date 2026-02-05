import {scan} from "utils/getallservers.ts"
/** @param {NS} ns */
export async function main(ns) {
  let servers = scan(ns);
  let ram = 0;
  for (let i = 0; i < servers.length; i++){
    if (servers[i] == "home"){continue};
    ns.scp("hacks/mem.js", servers[i], "home");

    let threads = Math.floor((ns.getServerMaxRam(servers[i])) / ns.getScriptRam("hacks/mem.js"));
    if (threads == 0){continue};
    ram+= ns.getScriptRam("hacks/mem.js") * threads;
    ns.exec("hacks/mem.js", servers[i], threads);
  }
  ns.tprintf("Deployed %s of memshare", ns.formatRam(ram));
}