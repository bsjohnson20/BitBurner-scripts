export function calcHGW(ns, server, frac) {
  let H = ns.hackAnalyzeThreads(server.hostname, server.moneyMax * frac);
  let G = ns.growthAnalyze(server.hostname, 1/(1 - frac));
  let W = (H * 0.002 + G * 0.004) / 0.05;
  return {"h": H, "g": G, "w": W};
}

/** @param {NS} ns */
export async function main(ns) {
  let s = ns.args[0] // server
  let server = ns.getServer(s);

  // info
  // ratios
  ns.tprint(server.moneyMax, "/", server.moneyAvailable);
  //let gThreads = ns.growthAnalyze(s, 2);
  //let minMoney = Math.min(server.moneyAvailable, server.moneyMax / 2);
  //let hThreads = ns.hackAnalyzeThreads(s, minMoney);
  //let wThreads = ns.wea
  let data = calcHGW(ns, server, 0.5);
  ns.tprintf(
    "hThreads %(h)s gThreads %(g)s wThreads %(w)s", data)
}