/** @param {NS} ns */
export async function main(ns) {
    let server = ns.getServer("home");
    let threads = Math.floor((server.maxRam - server.ramUsed) / ns.getScriptRam("/hacks/weaken.js", "home"));
    ns.exec("/hacks/weaken.js", "home", threads, JSON.stringify({ target: ns.args[0], init_sleep: 0, post_sleep: 0, loop: true }));
}
