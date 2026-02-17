
function calcAverage(servers, ns) {
    let totalRam = 0;
    for (const server of servers) {
        totalRam += ns.getServerMaxRam(server);
    }
    return totalRam / servers.length;
}

function calcStddev(servers, ns) {
    const avg = calcAverage(servers, ns);
    let sum = 0;
    for (const server of servers) {
        const ram = ns.getServerMaxRam(server);
        sum += Math.pow(ram - avg, 2);
    }
    return Math.sqrt(sum / servers.length);
}

function analytics(ns, servers) {
    let totalRam = 0;
    let totalMoney = 0;
    for (const server of servers) {
        totalRam += ns.getServerMaxRam(server);
        totalMoney += ns.getPurchasedServerCost(ns.getServerMaxRam(server));
    }

    // min ram
    let minRam = Infinity;
    let maxRam = 0;
    for (const server of servers) {
        const ram = ns.getServerMaxRam(server);
        if (ram < minRam) minRam = ram;
        if (ram > maxRam) maxRam = ram;
    }


    return { ram: totalRam, money: totalMoney, minRam: minRam, maxRam: maxRam, avgRam: calcAverage(servers, ns), stddevRam: calcStddev(servers, ns) };
}

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    let pServers = ns.getPurchasedServers();

    const analyticsResult = analytics(ns, pServers);
    ns.tprintf("pServers: %d GB RAM, %s money, %d minRam, %d maxRam, %d avgRam, %d stddevRam", analyticsResult.ram, ns.formatNumber(analyticsResult.money), analyticsResult.minRam, analyticsResult.maxRam, analyticsResult.avgRam, analyticsResult.stddevRam);
}