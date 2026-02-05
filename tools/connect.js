/** @param {NS} ns */
let checked = [];
let hacked = [];
let final = []
function scan(ns, start='home', hack_target='', method='', connection_str=''){
  checked+=start;
  connection_str+=start+'/';
  let targets = ns.scan(start);
  for (let x = 0; x < targets.length; x++){
    if (checked.includes(targets[x]) || targets[x] == 'home'){//(targets[x] checked){
      //ns.tprint("Skipping: ", targets[x]);
      continue;
    }
    let target = targets[x];
    hacked.push(target);
    final.push(connection_str+target);
      //await ns.sleep(1000);
    scan(ns, target, hack_target, method=method, connection_str=connection_str)
  }
  return final;
}


/** @param {NS} ns */
export async function main(ns) {
  final = [];
  hacked = [];
  checked = [];
  let target = ns.args[0];
  let arr = scan(ns);
  for (let i = 0; i<arr.length;i++){
    let s = arr[i].split("/")

    if (s[s.length - 1] == target){
      ns.tprint(arr[i]);
      return
    }
    
  }
}