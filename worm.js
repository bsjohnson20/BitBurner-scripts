/** @param {NS} ns */
async function infodump(ns, server){
  let hack_num = ns.getServerRequiredHackingLevel(server);
  return hack_num;
}

/** @param {NS} ns */
async function hackit(ns, target){
  await ns.nuke(target);
}

/** @param {NS} ns */
async function basic_hack(ns, target){
  ns.scp("basic_hack.js", target,"home")
}

/** @param {NS} ns */
export async function main(ns) {
  let targets = ns.scan()
  for (let x = 0; x < targets.length; x++){
    let target = targets[x];
    //ns.print(targets[x])
    let secLevel = await infodump(ns, target);
    if (secLevel <= ns.getHackingLevel()){
      await hackit(ns, target);
    }
    else {
      ns.print("SKIP: ", target);
    }
    
  }
  //while (1==1){
  //  await ns.asleep(100000);
  //};
}