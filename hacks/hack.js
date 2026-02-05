/** @param {NS} ns */
export async function main(ns) {
  while (1==1){
    await ns.sleep(ns.args[1]);
    await ns.hack(ns.args[0]);};
    await ns.sleep(ns.args[2]);
}