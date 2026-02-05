export function findItem(ns, s, items){
  for (let item = 0; item < items.length; item++){
    ns.tprintf("%-s: %40s" , s, items[item]);
  }
}

/** @param {NS} ns */
export function findContracts(ns, servers){
  for (let i = 0; i < servers.length; i++){
    let items = ns.ls(servers[i], "contract")
    findItem(ns, servers[i], items);
  }
}

import {scan} from "utils/getallservers.ts"
/** @param {NS} ns */
export async function main(ns) {
  let s = scan(ns);
  findContracts(ns, s); 

}