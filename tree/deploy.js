function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function gcd3(a, b, c) {
  return gcd(gcd(a, b), c);
}

function simplifyRatio(H, G, W) {
  H = Math.round(H);
  G = Math.round(G);
  W = Math.round(W);

  const d = gcd3(H, G, W);
  return [H / d, G / d, W / d];
}

/** @param {NS} ns */
function calcRatioRam(ns, totRam, target, threads){
  let ratio = ns.getServerMaxRam(target) / totRam;
  return {"H": threads["H"] * ratio, "W": threads["W"] * ratio, "G": threads["G"] * ratio}
}

/** @param {NS} ns */
function calcRam(ns, H,G,W){
  return ns.getFunctionRamCost("hack") * H + ns.getFunctionRamCost("weaken") * W + ns.getFunctionRamCost("grow") * G
}

export function calcHGW(ns, server, frac) {
  let H = ns.hackAnalyzeThreads(server.hostname, server.moneyMax * frac);
  let G = ns.growthAnalyze(server.hostname, 1/(1 - frac));
  let W = (H * 0.002 + G * 0.004) / 0.05;
  return {"h": H, "g": G, "w": W};
}
/** @param {NS} ns */
export async function main(ns) {

}