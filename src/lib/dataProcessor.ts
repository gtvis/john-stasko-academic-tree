import type { ChartData } from './chart';

export interface SheetRow {
	[key: string]: string;
}

export async function fetchSheetsData(
	sheetId: string,
	gid: number
): Promise<{
	sheetsData: SheetRow[];
	headers: string[];
}> {
	const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const csvText = await response.text();
	const rows = csvText.split('\n').filter((row) => row.trim());

	if (rows.length === 0) {
		return { sheetsData: [], headers: [] };
	}

	// Parse the first row as headers
	const headers = parseCSVRow(rows[0]);

	// Parse the remaining rows into objects
	const sheetsData = rows.slice(1).map((row) => {
		const cells = parseCSVRow(row);
		const rowObject: SheetRow = {};
		headers.forEach((header, index) => {
			rowObject[header] = cells[index] || '';
		});
		return rowObject;
	});

	return { sheetsData, headers };
}

export function parseCSVRow(row: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;

	for (let i = 0; i < row.length; i++) {
		const char = row[i];

		if (char === '"') {
			if (i + 1 < row.length && row[i + 1] === '"') {
				current += '"';
				i++;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (char === ',' && !inQuotes) {
			result.push(current.trim());
			current = '';
		} else {
			current += char;
		}
	}

	// Push the last segment
	result.push(current.trim());
	return result;
}

export function prepareHierarchyData(sheetsData: SheetRow[], headers: string[]): ChartData {
	// Find columns dynamically
	const nameColumn = headers.find((h) => h.toLowerCase().includes('name')) || headers[0];
	const phdColumn = headers.find((h) => h.toLowerCase().includes('phd student'));
	const emailColumn = headers.find((h) => h.toLowerCase().includes('email'));
	const roleColumn = headers.find((h) => h.toLowerCase().includes('role'));
	const startYearColumn = headers.find((h) => h.toLowerCase().includes('start'));
	const endYearColumn = headers.find((h) => h.toLowerCase().includes('completion'));

	// Create a map of all people from the data
	const personMap = new Map<string, ChartData>();

	// Create a set to track who is someone's PhD student (i.e., not root level)
	const isAdvisee = new Set<string>();

	// First pass: collect all PhD students to identify who should not be at root level
	sheetsData.forEach((row) => {
		if (phdColumn && row[phdColumn]) {
			const students = row[phdColumn]
				.split(';')
				.map((s: string) => s.trim())
				.filter((s: string) => s.length > 0);

			students.forEach((student) => isAdvisee.add(student));
		}
	});

	// Second pass: create all person objects
	sheetsData.forEach((row) => {
		if (row[nameColumn] && row[nameColumn].trim()) {
			const name = row[nameColumn].trim();
			const person: ChartData = {
				name: name,
				email: emailColumn ? row[emailColumn] : undefined,
				currentRole: roleColumn ? row[roleColumn] : undefined,
				startYear: startYearColumn ? row[startYearColumn] : undefined,
				endYear: endYearColumn ? row[endYearColumn] : undefined,
				children: []
			};
			personMap.set(name, person);
		}
	});

	// Third pass: build the hierarchy
	const root: ChartData = {
		name: 'John Stasko',
		email: 'stasko@cc.gatech.edu',
		currentRole: '',
		startYear: undefined,
		endYear: undefined,
		children: []
	};

	sheetsData.forEach((row) => {
		if (row[nameColumn] && row[nameColumn].trim()) {
			const advisorName = row[nameColumn].trim();
			const advisor = personMap.get(advisorName);

			if (advisor && phdColumn && row[phdColumn]) {
				const students = row[phdColumn]
					.split(';')
					.map((s: string) => s.trim())
					.filter((s: string) => s.length > 0);

				students.forEach((studentName) => {
					const student = personMap.get(studentName);
					if (student) {
						// If student exists in data, use their full info
						advisor.children?.push(student);
					} else {
						// If student doesn't exist in data, create minimal info
						advisor.children?.push({
							name: studentName,
							email: undefined,
							currentRole: undefined,
							startYear: undefined,
							endYear: undefined,
							value: 1
						});
					}
				});
			}
		}
	});

	// Add people who are not advisees (not in anyone's PhD student list) to root level
	sheetsData.forEach((row) => {
		if (row[nameColumn] && row[nameColumn].trim()) {
			const name = row[nameColumn].trim();
			const person = personMap.get(name);

			// Only add to root if they are not someone's advisee and not John Stasko
			if (person && !isAdvisee.has(name) && name !== 'John Stasko') {
				root.children?.push(person);
			}
		}
	});

	// Set values for leaf nodes
	function setLeafValues(node: ChartData) {
		if (!node.children || node.children.length === 0) {
			node.value = 1;
		} else {
			node.children.forEach((child) => setLeafValues(child));
		}
	}

	setLeafValues(root);
	return root;
}
