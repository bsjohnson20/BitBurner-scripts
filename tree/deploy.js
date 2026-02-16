let global_delay = 0

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
function calcRatioRam(ns, totRam, target, threads) {
  let ratio = ns.getServerMaxRam(target) / totRam;
  return { "H": threads["H"] * ratio, "W": threads["W"] * ratio, "G": threads["G"] * ratio }
}

/** @param {NS} ns */
function calcRam(ns, H, G, W) {
  return ns.getScriptRam("/hacks/hack.js") * H + ns.getScriptRam("/hacks/weaken.js") * W + ns.getScriptRam("/hacks/grow.js") * G
}

function calcHGW(ns, server, frac) {
  let H = ns.hackAnalyzeThreads(server.hostname, server.moneyMax * frac);
  let G = ns.growthAnalyze(server.hostname, 1 / (1 - frac));
  let W = (H * 0.002 + G * 0.004) / 0.05;
  return { "h": H, "g": G, "w": W };
}


/** @param {NS} ns */
async function execute(ns, server, threads, target, hacking = false, multiplier = 1) {
  const hThreads = Math.floor(threads["H"] || 0);
  const gThreads = Math.floor(threads["G"] || 0);
  const wThreads = Math.floor(threads["W"] || 0);

  if (gThreads <= 0 || wThreads <= 0) return;

  const hackTime = ns.getHackTime(target);
  const growTime = ns.getGrowTime(target);
  const weakenTime = ns.getWeakenTime(target);

  // 20ms-50ms is the sweet spot for batch uniformity
  const spacer = 30;
  const noloop = false;

  await ns.scp(["/hacks/hack.js", "/hacks/grow.js", "/hacks/weaken.js"], server.hostname, "home");

  for (let i = 0; i < multiplier; i++) {
    // Each batch is offset so they land in a clean sequence
    const batchOffset = i * (spacer * 4);

    // Calculate delays relative to the Weaken landing at the end
    const hDelay = weakenTime - hackTime - (spacer * 2) + batchOffset;
    const gDelay = weakenTime - growTime - spacer + batchOffset;
    const wDelay = batchOffset;

    // Construct the mandated JSON strings
    let hackArgs = JSON.stringify({ target: target, init_sleep: hDelay, post_sleep: 0, loop: noloop });
    let growArgs = JSON.stringify({ target: target, init_sleep: gDelay, post_sleep: 0, loop: noloop });
    let weakenArgs = JSON.stringify({ target: target, init_sleep: wDelay, post_sleep: 0, loop: noloop });

    if (hacking && hThreads > 0) {
      ns.exec("/hacks/hack.js", server.hostname, hThreads, hackArgs);
    }
    ns.exec("/hacks/grow.js", server.hostname, gThreads, growArgs);
    ns.exec("/hacks/weaken.js", server.hostname, wThreads, weakenArgs);
  }
}

import { scan } from "utils/getallservers.ts"

/** @param {NS} ns */
export async function main(ns) {
  let servers = scan(ns)

  // Calculates HGW against target server (e.g. n00dles)
  let target = ns.read("/config/target.txt");
  let targetServer = ns.getServer(target)
  let threads = calcHGW(ns, targetServer, 0.5)

  // Loop over and calc
  let minThreads = {
    "H": Math.floor(threads.h) * 2,
    "G": Math.floor(threads.g) * 2,
    "W": Math.floor(threads.w) / 2
  }
  let hacking = true;
  while (1 == 1) {
    targetServer = ns.getServer(target)
    hacking = true;
    // Check if money at max
    if (targetServer.moneyAvailable < targetServer.moneyMax) { // if less then don't hack
      hacking = false;
      ns.printf("Server %s is not at max money. Skipping hack. cur/max %s/%s", targetServer.hostname, ns.formatNumber(targetServer.moneyAvailable), ns.formatNumber(targetServer.moneyMax));
    } else {
      ns.printf("S: %s. Mon/Max %s/%s", targetServer.hostname, ns.formatNumber(targetServer.moneyAvailable), ns.formatNumber(targetServer.moneyMax));
    }

    for (let i = 0; i < servers.length; i++) {
      // ns.print("Processing server: ", servers[i])
      const element = ns.getServer(servers[i]);
      // thread multiplier
      let ram = calcRam(ns, minThreads.H, minThreads.G, minThreads.W)
      let threadMult = Math.floor(element.maxRam / ram);
      // ns.printf("Server: %s, Thread Mult: %d, Max Ram: %d, Ram per script: %d", element.hostname, threadMult, element.maxRam, ram)
      // loop over HGW and multiply
      threads = {
        "H": Math.floor(minThreads.H),
        "G": Math.floor(minThreads.G),
        "W": Math.floor(minThreads.W)
      };

      // print debugging for threads ram etc
      // ns.printf("Server: %s, Thread Mult: %d, Max Ram: %d, Ram per script: %d, Threads: H=%d, G=%d, W=%d. Init threads: H=%d G=%d, W=%d", element.hostname, threadMult, element.maxRam, ram, threads.H, threads.G, threads.W, minThreads.H, minThreads.G, minThreads.W)

      if (threads.H < 1 && threads.G < 1 && threads.W < 1) {
        // ns.printf("Zero threads: %s, HGW: %s", element.hostname, JSON.stringify(threads));
        continue;
      }
      ns.disableLog("disableLog");
      ns.disableLog("exec");
      ns.disableLog("scp");
      ns.disableLog("scan");
      await execute(ns, element, threads, target, hacking, threadMult)

    }
    const minSleep = 1000;
    let minWeakenTime = ns.getWeakenTime(target);

    await ns.sleep(minSleep + minWeakenTime);
    global_delay = 0;
  }

}
