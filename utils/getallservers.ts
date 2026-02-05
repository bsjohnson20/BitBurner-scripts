export function scan(ns: NS, start: string = 'home', checked: Array<string> = []): Array<string>{
  checked.push(start);
  let targets = ns.scan(start);
  for (let x = 0; x < targets.length; x++){
    if (checked.includes(targets[x]) || targets[x] == 'home'){//(targets[x] checked){
      continue;
    }
    let target = targets[x];
    scan(ns, target, checked);
  }
  return checked;
}


export async function main(ns: NS) {
  scan(ns);
}