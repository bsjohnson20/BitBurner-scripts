/** @param {NS} ns */
async function run(ns, process_args) {
  await ns.sleep(process_args.init_sleep);
  await ns.hack(process_args.target);
  await ns.sleep(process_args.post_sleep);
  if (process_args.loop == true) {
    await run(ns, process_args);
  }
}

/** @param {NS} ns */
export async function main(ns) {
  let process_args = JSON.parse(ns.args[0]); // dict {init_sleep, target, post_sleep, loop}
  await run(ns, process_args);
}