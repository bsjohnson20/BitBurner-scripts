/** @param {NS} ns */
function hackit(ns, target){
  ns.brutessh(target);
  ns.nuke(target);
}

/** @param {NS} ns */
function basic_hack(ns, target){
  ns.scp("basic_hack.js", target,"home");

  // calc ram cost
  let ram = ns.getScriptRam("basic_hack.js");
  let tRam = ns.getServerMaxRam(target);
  let count = Math.floor(tRam / ram);
  if (count == 0){
    count = 1;
  }
  ns.exec("basic_hack.js", target, count, target);
}

let checked = [];

/** @param {NS} ns */
async function scan(ns, start='home'){
  let targets = ns.scan(start);
  checked.push(start);
  //ns.tprint(targets);
  for (let x = 0; x < targets.length; x++){
    if (checked.includes(targets[x]) || targets[x] == 'home'){//(targets[x] checked){
      continue;
    }
    let target = targets[x];
    ns.tprint(target)
    ns.killall(target);
    // ns.printf("Now scanning: ", target)
    //ns.print(target);
    scan(ns, target);
    // ns.print("Scanned: ", target);
  }
}


export async function main(ns) {
  checked = [];
  await scan(ns);
}