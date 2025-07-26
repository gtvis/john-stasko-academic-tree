import type { ChartData } from './chart';

// Generate random test data with multiple levels using new ChartData structure
export function generateRandomTestData(treeDepth: number = 7): ChartData {
	const names = [
		'Alice Johnson',
		'Bob Smith',
		'Carol Davis',
		'David Wilson',
		'Emma Brown',
		'Frank Miller',
		'Grace Lee',
		'Henry Garcia',
		'Iris Martinez',
		'Jack Anderson',
		'Kate Thompson',
		'Liam White',
		'Maya Jackson',
		'Noah Harris',
		'Olivia Clark',
		'Paul Lewis',
		'Quinn Robinson',
		'Ruby Walker',
		'Sam Hall',
		'Tina Young',
		'Uma King',
		'Victor Wright',
		'Wendy Lopez',
		'Xavier Hill',
		'Yara Green',
		'Zoe Adams',
		'Aaron Baker',
		'Bella Nelson',
		'Carter Murphy',
		'Diana Rivera',
		'Ethan Cooper',
		'Fiona Reed',
		'Gabriel Cook',
		'Hannah Morgan',
		'Ian Bailey',
		'Julia Ward',
		'Kevin Torres',
		'Luna Peterson',
		'Mason Gray',
		'Nora Ramirez',
		'Oscar James',
		'Penny Watson',
		'Quincy Brooks',
		'Rose Kelly',
		'Sean Sanders',
		'Tara Price',
		'Ulysses Bennett',
		'Vera Wood',
		'Wade Barnes',
		'Xenia Ross'
	];

	function createRandomNode(name: string, depth: number, maxDepth: number): ChartData {
		const currentYear = new Date().getFullYear();
		const startYear = currentYear - Math.floor(Math.random() * 20) - depth;
		const endYearValue = depth > 3 ? startYear + Math.floor(Math.random() * 8) + 2 : undefined;

		const roles = [
			'Professor',
			'Associate Professor',
			'Assistant Professor',
			'Research Scientist',
			'Senior Engineer',
			'Data Scientist',
			'Tech Lead'
		];
		const domains = ['@gatech.edu', '@mit.edu', '@stanford.edu', '@berkeley.edu', '@cmu.edu'];

		const node: ChartData = {
			name,
			email: `${name.toLowerCase().replace(' ', '.')}${domains[Math.floor(Math.random() * domains.length)]}`,
			currentRole: roles[Math.floor(Math.random() * roles.length)],
			startYear: startYear.toString(),
			endYear: endYearValue?.toString(),
			children: []
		};

		if (depth < maxDepth) {
			const numChildren = Math.floor(Math.random() * 4) + 1; // 1-4 children
			
			for (let i = 0; i < numChildren; i++) {
				const childName = names[Math.floor(Math.random() * names.length)];
				const child = createRandomNode(childName, depth + 1, maxDepth);
				node.children?.push(child);
			}
		} else {
			node.value = 1; // Leaf nodes
		}

		return node;
	}

	// Create root with deep structure
	const root: ChartData = {
		name: 'John Stasko',
		email: 'stasko@cc.gatech.edu',
		currentRole: 'Professor & Director of Information Interfaces Lab',
		startYear: '1989',
		endYear: undefined,
		children: []
	};

	// Create 5-8 main branches with full depth
	const numMainBranches = Math.floor(Math.random() * 4) + 5;
	for (let i = 0; i < numMainBranches; i++) {
		const branchName = names[Math.floor(Math.random() * names.length)];
		const branch = createRandomNode(branchName, 1, treeDepth);
		root.children?.push(branch);
	}

	return root;
}

// export const gradientColors = [
// 	'#99A5E0',
// 	'#E16B99',
// 	'#FCF765',
// 	'#8F7D73',
// 	'#E2A35A',
// 	'#7B8974',
// 	'#89c1dc',
// 	'#80BBDA',
// 	'#5d88c0',
// 	'#d2c1c0',
// 	'#BACC68',
// 	'#c49496',
// 	'#7c7db0'
// ];

export const gradientColors = [
	'#DEDDD9',
	'#FFE873',
	'#B3B5C5',
	'#C2B9CA',
	'#C3D5C9',
	// '#6C5369',
	'#BEB9B3',
	'#E26C42',
	// '#B9512F',
	// '#E1DECB',
	'#8EAAB8',
	// '#4A6077',
	'#DEDDD9'
];
