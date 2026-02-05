let floor = Math.floor;

/** @param {NS} ns */
function calcRam(ns, script) {
  return ns.getScriptRam(script, "home");
}

/** @param {NS} ns */
export async function main(ns) {
  let target = ns.args[0];
  let timingDict = ns.args[1];
  if (timingDict == "skip") { timingDict = { "weaken": 0, "hack": 0, "grow": 0 } }
  else
    timingDict = JSON.parse(ns.args[1]);
  let host = ns.args[2];
  let sDelay = ns.args[3];
  let method = ns.args[4];
  //await ns.sleep(sDelay); // wait to offset scripts

  let longest = timingDict['weaken'];

  let hDelay1 = 400 // greater delay to start earlier
  let gDelay1 = 200 // runs 2nd
  // Weaken -> runs 3rd

  let hackDelay = longest - timingDict['hack'] - hDelay1;
  let growDelay = longest - timingDict['grow'] - gDelay1;


  // Offset full script starting by static delay 
  hackDelay += sDelay;
  growDelay += sDelay;
  let weakenDelay = sDelay;

  // To align timing to prevent drift // Still got drift from very slight changes in timings due to sec level - Cycle method will resolve this
  let hackOffsetDelay = hDelay1;
  let growOffsetDelay = gDelay1;

  // calculate threads for each
  // ratios
  let hRatio = 0.1;
  let wRatio = 0.3;
  let gRatio = 1;

  if (method == "weaken") {
    hRatio = 0;
    wRatio = 1;
    gRatio = 0.2;
  } else if (method == "grow") {
    hRatio = 0.01;
    wRatio = 0.2
    gRatio = 1
  }

  let shareTotal = hRatio + wRatio + gRatio;

  // RAM CALC
  let bDir = "/hacks/";

  let hRam = calcRam(ns, bDir + "hack.js");
  let gRam = calcRam(ns, bDir + "grow.js");
  let wRam = calcRam(ns, bDir + "weaken.js");

  let tRam = ns.getServerMaxRam(host);

  // Final ratio calc
  let sRam = tRam / shareTotal;
  let gThreads = floor((sRam * gRatio) / gRam); if (gThreads == 0) { gThreads = 1 };
  let wThreads = floor((sRam * wRatio) / wRam); if (wThreads == 0) { wThreads = 1 };
  let hThreads = floor((sRam * hRatio) / hRam); if (hThreads == 0) { hThreads = 1 };

  if (method == "weaken") { hThreads = 0 };
  if (method == "grow") { hThreads = 0 };


  try {
    ns.exec("/hacks/hack.js", host, hThreads, target, hackDelay, hackOffsetDelay);
  }
  catch (e) { };
  try {
    ns.exec("/hacks/grow.js", host, gThreads, target, growDelay, growOffsetDelay);
  }
  catch (e) { };
  try {
    ns.exec("/hacks/weaken.js", host, wThreads, target, weakenDelay);
  }
  catch (e) { }
}