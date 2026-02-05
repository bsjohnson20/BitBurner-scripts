/** @param {NS} ns */
let x = ""
/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");
  x='';
  let target = ns.args[0];
  if (ns.args.length == 0){
    let file = "/config/target.txt";
    target = ns.read(file);
  }
  while (1==1){
    let y = "Money: " + ns.formatNumber(ns.getServerMoneyAvailable(target)) +
      "/" +
      ns.formatNumber(ns.getServerMaxMoney(target)) +
      ". Security(cur/min): " + ns.formatNumber(ns.getServerSecurityLevel(target)) + "/"+ ns.getServerMinSecurityLevel(target);
    if (y!=x){x=y; ns.print(y);};
    await ns.sleep(100);
  }
}