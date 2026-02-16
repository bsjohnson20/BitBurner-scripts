function timeFormat(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}
let cachedData = { timestamp: Date.now(), weakenTime: 0 };

/** @param {NS} ns **/
export async function main(ns) {
    const args = ns.flags([["help", false]]);
    if (args.help) {
        ns.tprint("This script will enhance your HUD (Heads up Display) with custom statistics.");
        ns.tprint(`Usage: run ${ns.getScriptName()}`);
        ns.tprint("Example:");
        ns.tprint(`> run ${ns.getScriptName()}`);
        return;
    }

    const doc = document; // This is expensive! (25GB RAM) Perhaps there's a way around it? ;)
    const hook0 = doc.getElementById('overview-extra-hook-0');
    const hook1 = doc.getElementById('overview-extra-hook-1');
    while (true) {
        try {
            const headers = []
            const values = [];
            // Add script income per second
            headers.push("Target");
            values.push(ns.read("/config/target.txt"));
            headers.push("💲/Max");
            const target = ns.read("/config/target.txt");
            values.push(`${ns.formatNumber(ns.getServerMoneyAvailable(target))}/${ns.formatNumber(ns.getServerMaxMoney(target))}`);

            // security
            headers.push("🔐 (Cur/Min)");
            const targetServer = ns.getServer(target);
            values.push(`${ns.formatNumber(targetServer.hackDifficulty)}/${ns.formatNumber(targetServer.minDifficulty)}`);

            // read next weaken from 69 port and update remaining
            let portData = ns.readPort(69);
            let now = Date.now();

            // 2. Only update if the port actually has data
            if (portData !== "NULL PORT" && portData !== "") {
                try {
                    cachedData = JSON.parse(portData);
                } catch (err) {
                    // If parse fails, we just keep using cachedData as-is
                }
            }

            // 3. Calculate remaining based on the last known good data
            let remaining = Math.max(0, cachedData.timestamp + cachedData.weakenTime - now);

            // UI Logic
            headers.push("wTime");
            values.push(timeFormat(remaining));


            // Now drop it into the placeholder elements
            hook0.innerText = headers.join(" \n");
            hook1.innerText = values.join("\n");
        } catch (err) { // This might come in handy later
            ns.print("ERROR: Update Skipped: " + String(err));
        }
        await ns.sleep(1000);
    }
}