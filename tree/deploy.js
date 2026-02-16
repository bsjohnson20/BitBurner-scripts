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

// function calcHGW(ns, server, frac) {
//   let H = ns.hackAnalyzeThreads(server.hostname, server.moneyMax * frac);
//   let G = ns.growthAnalyze(server.hostname, 1 / (1 - frac));
//   let W = (H * 0.002 + G * 0.004) / 0.05;
//   return { "h": H, "g": G, "w": W };
// }

function calcHGW(ns, server, targetFrac) {
  const secDiff = server.hackDifficulty - server.minDifficulty;

  // If security is more than 3 points above min, 
  // we go into "Recovery Mode" by slashing the hack amount.
  let effectiveFrac = secDiff > 5 ? 0.01 : targetFrac;

  let H = ns.hackAnalyzeThreads(server.hostname, server.moneyMax * effectiveFrac);
  // Ensure H is at least 0 if effectiveFrac is tiny
  H = Math.max(0, H);

  let G = ns.growthAnalyze(server.hostname, 1 / (1 - effectiveFrac));

  // Increase Weaken threads if security is high to "over-compensate"
  let securityPadding = secDiff > 5 ? 2.0 : 1.0;
  let W = ((H * 0.002 + G * 0.004) / 0.05) * securityPadding;

  return { "h": H, "g": G, "w": W };
}


/** @param {NS} ns */
async function execute(ns, server, threads, target, hacking = false, multiplier = 1) {
  const hThreads = Math.floor(threads["H"] || 0);
  const gThreads = Math.floor(threads["G"] || 0);
  const wThreads = Math.floor(threads["W"] || 0);

  // if (gThreads <= 0 || wThreads <= 0) return;

  const hackTime = ns.getHackTime(target);
  const growTime = ns.getGrowTime(target);
  const weakenTime = ns.getWeakenTime(target);

  // 20ms-50ms is the sweet spot for batch uniformity
  const spacer = 30;
  const noloop = false;
  global_delay += 200;

  await ns.scp(["/hacks/hack.js", "/hacks/grow.js", "/hacks/weaken.js"], server.hostname, "home");

  for (let i = 0; i < multiplier; i++) {
    // Each batch is offset so they land in a clean sequence
    const batchOffset = i * (spacer * 4);

    // Calculate delays relative to the Weaken landing at the end
    const hDelay = weakenTime - hackTime - (spacer * 2) + batchOffset;
    const gDelay = weakenTime - growTime - spacer + batchOffset;
    const wDelay = batchOffset;

    // Construct the mandated JSON strings
    let hackArgs = JSON.stringify({ target: target, init_sleep: hDelay + global_delay, post_sleep: 0, loop: noloop });
    let growArgs = JSON.stringify({ target: target, init_sleep: gDelay + global_delay, post_sleep: 0, loop: noloop });
    let weakenArgs = JSON.stringify({ target: target, init_sleep: wDelay + global_delay, post_sleep: 0, loop: noloop });


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
  ns.disableLog("disableLog");
  ns.disableLog("exec");
  ns.disableLog("scp");
  ns.disableLog("scan");

  let servers = scan(ns)

  global_delay = 0;

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
  let skipped = 0;
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
      const element = ns.getServer(servers[i]);
      if (element.maxRam <= 0) continue; // Skip servers with no RAM

      // 1. Start with your ideal thread counts
      let h = Math.floor(minThreads.H);
      let g = Math.floor(minThreads.G);
      let w = Math.floor(minThreads.W);

      // 2. Shrink the base ratio until it fits at least once
      // We use a while loop to reduce the threads proportionally 
      // until the total cost is <= the server's maximum RAM.
      while (calcRam(ns, h, g, w) > element.maxRam && (h > 0 || g > 1 || w > 1)) {
        if (h > 0) h--;
        if (g > 1) g--;
        if (w > 1) w--;
      }

      let ramPerUnit = calcRam(ns, h, g, w);

      // 3. Calculate how many times this (now smaller) unit fits
      let threadMult = ramPerUnit > 0 ? Math.floor(element.maxRam / ramPerUnit) : 0;

      let finalThreads = { "H": h, "G": g, "W": w };

      if (threadMult < 1 || (h < 1 && g < 1 && w < 1)) {
        skipped += 1;
        continue;
      }

      // 4. Pass the scaled threads and the multiplier to execute
      await execute(ns, element, finalThreads, target, hacking, threadMult);
    }

    const minSleep = 1000;
    let minWeakenTime = ns.getWeakenTime(target);
    // get current timestamp and weaken time then write serialised
    const timestamp = Date.now();
    const data = {
      timestamp: timestamp,
      weakenTime: minWeakenTime
    };
    ns.writePort(69, JSON.stringify(data)); // update port
    ns.printf("Skipped servers: %d", skipped);
    await ns.sleep(minSleep + minWeakenTime);
    global_delay = 0;
    skipped = 0;
  }

}
