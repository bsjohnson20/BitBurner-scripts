/** @param {NS} ns */
export async function main(ns) {
  // Disable default logs to keep the console clean
  // ns.disableLog('ALL');

  // Parse arguments. If no args are provided, we prevent a crash.
  if (ns.args.length === 0) {
    ns.tprint("ERROR: No arguments provided. Expected JSON string.");
    return;
  }

  const args = JSON.parse(ns.args[0]);
  const { init_sleep, target, post_sleep, loop } = args;

  // Use a do-while loop instead of recursion to save memory and prevent stack overflows
  do {
    // Initial delay (crucial for batch timing)
    if (init_sleep > 0) {
      await ns.sleep(init_sleep);
    }

    // ns.print(`Growing target: ${target}`);
    await ns.grow(target);

    // Post-action delay
    if (post_sleep > 0) {
      await ns.sleep(post_sleep);
    }

  } while (loop);
}