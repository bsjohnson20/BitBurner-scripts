function hackit(ns, target) {
    if (target.includes("pServer")) {
        return true
    }
    let min_ports = 1;
    //if (ns.fileExists("NUKE.exe", "home")){ min_ports+=1; ns.brutessh(target)};
    if (ns.fileExists("FTPCrack.exe", "home")) { min_ports += 1; ns.ftpcrack(target) };
    if (ns.fileExists("relaySMTP.exe", "home")) { min_ports += 1; ns.relaysmtp(target) };
    if (ns.fileExists("BruteSSH.exe", "home")) { min_ports += 1; ns.brutessh(target) };
    if (ns.fileExists("SQLInject.exe", "home")) { min_ports += 1; ns.sqlinject(target) };

    if (min_ports <= ns.getServerNumPortsRequired(target)) {
        return false // ns.tprint("Hacked: ", target)
    }
    ns.nuke(target);
    return true
}

/** @param {NS} ns */
export async function main(ns) {
    let serverList = ns.scan('home');

    for (let host of serverList) {
        let ping = ns.scan(host);

        for (let pingedHost of ping) {
            if (serverList.includes(pingedHost) === false) {
                hackit(ns, pingedHost);
                serverList.push(pingedHost);
            }
        }
    }

    await ns.write('server_list.txt', JSON.stringify(serverList), 'w')
    ns.tprint("Mapped all servers");
}