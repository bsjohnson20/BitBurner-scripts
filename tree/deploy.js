import { scan } from "utils/getallservers.ts";

const HACK_PATH = "/hacks/hack.js";
const GROW_PATH = "/hacks/grow.js";
const WEAKEN_PATH = "/hacks/weaken.js";
const SPACER = 30;
const PORT_ID = 69;

function hackit(ns, target) {
  if (target.includes("pServer")) {
    return true
  }
  let min_ports = 1;
  //if (ns.fileExists("NUKE.exe", "home")){ min_ports+=1; ns.brutessh(target)};
  if (ns.fileExists("FTPCrack.exe", "home")) { min_ports += 1; ns.ftpcrack(target) };
  if (ns.fileExists("relaySMTP.exe", "home")) { min_ports += 1; ns.relaysmtp(target) };
  if (ns.fileExists("BruteSSH.exe", "home")) { min_ports += 1; ns.brutessh(target) };
  if (ns.fileExists("SQLInject.exe", "home")) { min_ports += 1; ns.sqlinject(target) };

  if (min_ports <= ns.getServerNumPortsRequired(target)) {
    return false // ns.tprint("Hacked: ", target)
  }
  ns.nuke(target);
  return true
}

/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");

  while (true) {

    // Hack all servers
    for (const server of scan(ns)) {
      hackit(ns, server);
    }

    const target = ns.read("/config/target.txt").trim();
    const allServers = scan(ns).filter(s => s !== "home" && ns.hasRootAccess(s));
    const targetServer = ns.getServer(target);
    const isHacking = targetServer.moneyAvailable >= (targetServer.moneyMax * 0.90);

    // 1. Get Ideal thread counts
    const ideal = getIdealThreads(ns, target, 0.5);
    let deployedCount = 0;

    for (const hostName of allServers) {
      const server = ns.getServer(hostName);
      if (server.maxRam <= 0) continue;

      // 2. Scale batch to fit host
      const batch = fitToHost(ns, hostName, ideal, isHacking);

      // 3. Deployment check (Must have at least one thread to try)
      if (batch.H > 0 || batch.G > 0 || batch.W > 0) {
        await ns.scp([HACK_PATH, GROW_PATH, WEAKEN_PATH], hostName, "home");

        const success = deploy(ns, hostName, target, batch, isHacking, deployedCount * 200);
        if (success) deployedCount++;
      }
    }

    // --- PORT DATA UPDATE ---
    const minWeakenTime = ns.getWeakenTime(target);
    const portData = {
      timestamp: Date.now(),
      weakenTime: minWeakenTime
    };
    ns.writePort(PORT_ID, JSON.stringify(portData));

    ns.print(`Cycle complete. Deployed to ${deployedCount} servers.`);

    // Wait for the full cycle duration before recalculating
    await ns.sleep(minWeakenTime + 1000);
  }
}

function getIdealThreads(ns, target, frac) {
  let H = Math.max(1, ns.hackAnalyzeThreads(target, ns.getServerMaxMoney(target) * frac));
  let G = Math.max(1, ns.growthAnalyze(target, 1 / (1 - frac)));
  let W = Math.max(1, (H * 0.002 + G * 0.004) / 0.05);
  return { H, G, W };
}

/** * Refined Scaling: Prioritizes Weaken over Grow to prevent 
 * security lock-outs on small servers.
 */
function fitToHost(ns, host, ideal, isHacking) {
  const ramMax = ns.getServerMaxRam(host);
  const ramUsed = ns.getServerUsedRam(host);
  const ramAvail = ramMax - ramUsed;

  const hRam = ns.getScriptRam(HACK_PATH);
  const gRam = ns.getScriptRam(GROW_PATH);
  const wRam = ns.getScriptRam(WEAKEN_PATH);

  // 1. Calculate the "Unit" cost
  const hCost = isHacking ? ideal.H * hRam : 0;
  const unitCost = hCost + (ideal.G * gRam) + (ideal.W * wRam);

  if (unitCost === 0 || ramAvail < wRam) return { H: 0, G: 0, W: 0 };

  // 2. Initial Scaling
  let scale = Math.min(1, ramAvail / unitCost);

  let H = isHacking ? Math.floor(ideal.H * scale) : 0;
  let G = Math.floor(ideal.G * scale);
  let W = Math.floor(ideal.W * scale);

  // 3. ENFORCEMENT: If we are growing/hacking, we MUST weaken.
  // If the server has at least (wRam + gRam), ensure W is at least 1.
  if (ramAvail >= (wRam + gRam)) {
    if (W === 0) {
      W = 1;
      // Reduce G to make room if necessary
      while ((H * hRam + G * gRam + W * wRam) > ramAvail && G > 1) {
        G--;
      }
    }
  }

  return { H, G, W };
}

function deploy(ns, host, target, threads, isHacking, delay) {
  const hTime = ns.getHackTime(target);
  const gTime = ns.getGrowTime(target);
  const wTime = ns.getWeakenTime(target);

  const hDelay = wTime - hTime - (SPACER * 2) + delay;
  const gDelay = wTime - gTime - SPACER + delay;
  const wDelay = delay;

  const makeArgs = (init) => JSON.stringify({
    target: target,
    init_sleep: Math.max(0, init),
    post_sleep: 0,
    loop: false
  });

  let success = false;
  // If any script successfully starts, we consider it a successful deployment
  if (threads.W > 0 && ns.exec(WEAKEN_PATH, host, threads.W, makeArgs(wDelay)) > 0) success = true;
  if (threads.G > 0 && ns.exec(GROW_PATH, host, threads.G, makeArgs(gDelay)) > 0) success = true;
  if (isHacking && threads.H > 0 && ns.exec(HACK_PATH, host, threads.H, makeArgs(hDelay)) > 0) success = true;

  return success;
}