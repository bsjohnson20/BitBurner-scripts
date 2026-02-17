// /** @param {NS} ns */
// export async function upgradeServers(ns) {
//   ns.print("Beginning upgrade cycle.")
//   let servers = ns.getPurchasedServers();
//   let success = false;
//   while (true) {
//     for (let i = 0; i < servers.length; i++) {
//       //ns.tprint(servers[i], ns.getServerMaxRam(servers[i]));
//       let ram = ns.getServerMaxRam(servers[i]);
//       if (ns.getPurchasedServerUpgradeCost(servers[i], ram * 2) < ns.getServerMoneyAvailable("home")) {
//         ns.upgradePurchasedServer(servers[i], ram * 2);
//         let fRam = ns.formatRam(ram);
//         let fRam2 = ns.formatRam(ram * 2);
//         ns.print("Upgraded server: ", servers[i], ". Ram: ", fRam, "->", fRam2)
//         success = true
//       }
//     }
//     if (!success) { await ns.sleep(1000); }
//     else if (success) { success = false };
//   }
// }

// /** @param {NS} ns */
// export async function main(ns) {
//   ns.disableLog("sleep"); ns.disableLog("ALL");
//   let serverBase = "pServer-"
//   let sNum = 0;
//   while (1 == 1) {
//     if (ns.getPurchasedServerLimit() == ns.getPurchasedServers().length) {
//       ns.printf("Max servers reached");
//       break
//     }
//     let mymoney = ns.getServerMoneyAvailable("home");
//     for (let i = 1; i < 2 ** 21; i = i * 2) {
//       //ns.tprint(i);
//       if (mymoney < ns.getPurchasedServerCost(i) && mymoney > 2e5) {
//         //ns.tprint("Attemped", mymoney, i/2)
//         ns.purchaseServer(serverBase + sNum, i / 2);
//         ns.printf("Purchased server - ", serverBase + sNum, ". ", ns.formatRam(i / 2) + " RAM")
//         break;
//       }
//       await ns.sleep(100);
//     }
//     await ns.sleep(3000);
//   }
//   await upgradeServers(ns);
// }
/** @param {NS} ns */
async function buyServerLoop(ns) {
  let serverBase = "pServer-"
  let cheapest = ns.getPurchasedServerCost(1);
  while (true) {
    if (ns.getPurchasedServerLimit() == ns.getPurchasedServers().length) {
      break;
    }

    let mymoney = ns.getServerMoneyAvailable("home");
    if (mymoney > cheapest) {
      let sNum = ns.getPurchasedServers().length;
      ns.purchaseServer(serverBase + sNum, 1);
    }
    else {
      await ns.sleep(1000);
    }
  }

  return;
}

/** @param {NS} ns */
export async function upgradeServerLoop(ns) {
  let servers = ns.getPurchasedServers();
  let success = false;
  while (true) {
    // get lowest ram server
    let min_ram = Infinity;
    let min_server = null;
    for (let i = 0; i < servers.length; i++) {
      let ram = ns.getServerMaxRam(servers[i]);
      if (ram < min_ram) {
        min_ram = ram;
        min_server = servers[i];
      }
    }

    if (min_server && ns.getPurchasedServerUpgradeCost(min_server, min_ram * 2) < ns.getServerMoneyAvailable("home")) {
      ns.upgradePurchasedServer(min_server, min_ram * 2);
      let fRam = ns.formatRam(min_ram);
      let fRam2 = ns.formatRam(min_ram * 2);
      ns.print("Upgraded server: ", min_server, ". Ram: ", fRam, "->", fRam2)
      success = true;
    }
    else {
      success = false;
    }

    if (!success) { await ns.sleep(1000); }
  }
}

/** @param {NS} ns */
export function getServerCost(ns, ram) {
  return ns.getPurchasedServerCost(ram);
}


/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");
  await buyServerLoop(ns);
  // upgrade loop
  ns.print("Starting upgrade loop");
  await upgradeServerLoop(ns);
}