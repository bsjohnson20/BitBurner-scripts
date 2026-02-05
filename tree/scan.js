
let hacked = [];
let checked = [];
let delay = 0;
/** @param {NS} ns */
function analyze(ns, target){
  // returns H W G timings
  let returned = {"hack": ns.getHackTime(target),
  "weaken": ns.getWeakenTime(target),
  "grow":ns.getGrowTime(target)};
  return returned;
}
/** @param {NS} ns */
function hackit(ns, target) {
  if (target.includes("pServer")){
    return true
  }
  let min_ports = 1;
  //if (ns.fileExists("NUKE.exe", "home")){ min_ports+=1; ns.brutessh(target)};
  if (ns.fileExists("FTPCrack.exe", "home")){ min_ports += 1; ns.ftpcrack(target)};
  if (ns.fileExists("relaySMTP.exe", "home")){ min_ports += 1; ns.relaysmtp(target)};
  if (ns.fileExists("BruteSSH.exe", "home")){ min_ports += 1; ns.brutessh(target)};
  
  if (min_ports <= ns.getServerNumPortsRequired(target)){
    return false // ns.tprint("Hacked: ", target)
  } 
  ns.nuke(target);
  return true
}
/** @param {NS} ns */
// This is the one that executes scripts on the host
async function basic_hack(ns, target, hack_target, method=''){
  ns.scp("/hacks/timed_hack.js", target, "home");
  ns.scp(['/hacks/grow.js','/hacks/weaken.js','/hacks/hack.js'], target, "home")

  // calc ram cost
  let data = JSON.stringify(analyze(ns, hack_target)) // dict object {"hack":x,"grow":y,"weaken":z}
  //await ns.sleep(10);
  while ((ns.getServerMaxRam("home") - ns.getServerUsedRam("home")) < ns.getScriptRam("/hacks/timed_hack.js", "home"))
  {
    await ns.sleep(20)
  }
  delay+=1000;
  ns.exec(
    "/hacks/timed_hack.js", // script
    "home", // host
    1, // thread
    hack_target, // arg 0
    data,
    target,
    delay,
    method=method
  ); // arg 2
}


/** @param {NS} ns */
async function scan(ns, start='home', hack_target='', method=''){
  checked+=start;
  let targets = ns.scan(start);
  for (let x = 0; x < targets.length; x++){
    if (checked.includes(targets[x]) || targets[x] == 'home'){//(targets[x] checked){
      //ns.tprint("Skipping: ", targets[x]);
      continue;
    }
    let target = targets[x];
    if (hackit(ns, target)){
      await basic_hack(ns, target, hack_target, method=method);
      ns.print("Deployed script to ", target);
      hacked.push(target);
      //await ns.sleep(1000);
    }
    await scan(ns, target, hack_target, method=method)
  }
}

/** @param {NS} ns */
export async function main(ns) {
  let method = '';
  if (ns.args.length > 1){
    method = ns.args[1] // method
  }
  else{
  }

  let hack_target =  (ns.args.length > 0) ? ns.args[0]:"";
  if (ns.args.length < 1){
    // hack_target = "neo-net";
    let file = "/config/target.txt"
    if (ns.fileExists(file)){
      hack_target = ns.read(file);
    }
  }
  // exit if cant hack target
  if (ns.getServerRequiredHackingLevel(hack_target) > ns.getHackingLevel()){
    ns.tprintf("Hacking level too low: %d/%d cur/req",
      ns.getHackingLevel(),
      ns.getServerRequiredHackingLevel(hack_target)
    ); return};


  delay = 0;
  checked = [];
  hacked = [];

  ns.tprint("Hacking ", hack_target);
  await scan(ns, "home", hack_target, method=method);
  ns.tprint("Scanned: ", checked.length, " servers. Deployed scripts to: ", hacked, ". Total hacked: ", hacked.length);
}