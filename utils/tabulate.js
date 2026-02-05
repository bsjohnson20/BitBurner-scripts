export function tabulate(ns, ts, keys = Object.keys(ts[0]||{})) {
	var columns = {};
	// Compute the lengths of all columns
	for (const key of keys) {
		var lens = ts.map(v => String(v[key]).length);
		lens.push(key.length);
		var mx = Math.max(...lens);
		columns[key] = mx + 1;
	}

	var output = "\n";
	var row = "";
	for (const key in columns)
		row = row + key.padStart(columns[key]);
	
	output += row + "\n";
	for (var t of ts) {
		row = "";
		for (const key in columns) {
			row = row + String(t[key]).padStart(columns[key]);
		}
		output += row + "\n";
	}
	ns.tprint(output);
}