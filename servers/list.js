/** @param {NS} ns */
export async function main(ns) {
  for (let i = 1; i < 2**21; i*=2) {ns.tprint("Ram ",ns.formatRam(i),": ",ns.formatNumber(ns.getPurchasedServerCost(i)));}
}