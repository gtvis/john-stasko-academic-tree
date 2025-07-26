import * as d3 from 'd3';

export interface ChartData {
	name: string;
	email?: string;
	currentRole?: string;
	startYear?: string;
	endYear?: string;
	children?: ChartData[];
	value?: number;
}

export interface ChartConfig {
	width: number;
	height: number;
	radius: number;
}

export function createSunburstChart(
	container: HTMLDivElement,
	hierarchyData: ChartData,
	showTooltip?: (event: MouseEvent, d: { data: ChartData }) => void,
	updateTooltipPosition?: (event: MouseEvent) => void,
	hideTooltip?: () => void
) {
	// Clear previous chart
	d3.select(container).selectAll('*').remove();

	// Chart dimensions - responsive to viewport
	const viewportWidth = window.innerWidth;
	const viewportHeight = window.innerHeight;

	// Use the smaller dimension to prevent scrolling
	const size = Math.min(viewportWidth * 0.9, viewportHeight * 0.9);
	const width = size;
	const height = size;
	const radius = width / 12;

	// Generate random color palette
	const numberOfRandomGradientColors = 5;
	const randomGradientColors = Array.from({ length: numberOfRandomGradientColors }, () =>
		getRandomHslColor()
	);

	const color = d3.scaleOrdinal(
		d3.quantize(
			d3.piecewise(d3.interpolateRgb, randomGradientColors),
			hierarchyData.children?.length ?? 0 + 1
		)
	);

	// Compute the layout
	const hierarchy = d3
		.hierarchy(hierarchyData)
		.sum((d: any) => d.value)
		.sort((a, b) => {
			// Sort by end year (ascending), put entries without end year at the end
			const aYear = a.data.endYear;
			const bYear = b.data.endYear;

			if (aYear && bYear) {
				return parseInt(aYear) - parseInt(bYear);
			}
			if (aYear && !bYear) {
				return -1;
			}
			if (!aYear && bYear) {
				return 1;
			}
			return (b.value || 0) - (a.value || 0);
		});

	const root = d3.partition().size([2 * Math.PI, hierarchy.height + 1])(hierarchy);
	root.each((d: any) => (d.current = d));

	// Create the arc generator
	const arc = d3
		.arc<any>()
		.startAngle((d: any) => d.x0)
		.endAngle((d: any) => d.x1)
		.padAngle((d: any) => Math.min((d.x1 - d.x0) / 2, 0.007))
		.padRadius(radius * 1.5)
		.innerRadius((d: any) => d.y0 * radius)
		.outerRadius((d: any) => Math.max(d.y0 * radius, d.y1 * radius - 1));

	// Create the SVG container
	const maxRadius = radius * (hierarchy.height + 1);
	const chartDiameter = maxRadius * 2;
	const padding = 20;
	const svgSize = chartDiameter + padding;

	const svg = d3
		.select(container)
		.append('svg')
		.attr('width', '100%')
		.attr('height', '100%')
		.attr('viewBox', [-svgSize / 2, -svgSize / 2, svgSize, svgSize])
		.style('max-width', '100vw')
		.style('max-height', '100vh');

	// Append the arcs
	const path = svg
		.append('g')
		.selectAll('path')
		.data(root.descendants().slice(1))
		.join('path')
		.attr('fill', (d: any) => {
			while (d.depth > 1) d = d.parent;
			return color(d.data.name);
		})
		.attr('fill-opacity', (d: any) => {
			if (!arcVisible(d.current)) return 0;
			const baseOpacity = 0.6;
			const depthFactor = Math.max(0.3, 1 - (d.depth - 1) * 0.3);
			return baseOpacity * depthFactor;
		})
		.attr('pointer-events', (d: any) => (arcVisible(d.current) ? 'auto' : 'none'))
		.attr('d', (d: any) => arc(d.current));

	// Make them clickable if they have children
	path
		.filter((d: any) => d.children)
		.style('cursor', 'pointer')
		.on('click', (event: any, d: any) => clicked(event, d));

	// Add tooltip functionality
	if (showTooltip && updateTooltipPosition && hideTooltip) {
		if (window.innerWidth <= 768) {
			path.on('click', function (event: MouseEvent, d: any) {
				// Handle zoom if has children
				if (d.children) {
					clicked(event, d);
				}
				// Show tooltip
				showTooltip(event, d);
			});
		} else {
			path
				.on('mouseover', function (event: MouseEvent, d: any) {
					showTooltip(event, d);
				})
				.on('mousemove', function (event: MouseEvent, d: any) {
					updateTooltipPosition(event);
				})
				.on('mouseout', function () {
					hideTooltip();
				});
		}
	}

	// Add labels
	const label = svg
		.append('g')
		.attr('pointer-events', 'none')
		.attr('text-anchor', 'middle')
		.style('user-select', 'none')
		.selectAll('text')
		.data(root.descendants().slice(1))
		.join('text')
		.attr('dy', '0.35em')
		.attr('fill-opacity', (d: any) => +labelVisible(d.current))
		.attr('transform', (d: any) => labelTransform(d.current))
		.style('font-size', (d: any) => `${(d.y1 - d.y0) * radius * 0.08}px`)
		.text((d: any) => truncateText(d.data.name, d));

	// Add center circle
	const parent = svg
		.append('circle')
		.datum(root)
		.attr('r', radius)
		.attr('fill', 'none')
		.attr('pointer-events', 'all')
		.on('click', (event: any, d: any) => clicked(event, d));

	// Add center label with dynamic sizing
	const centerLabel = svg
		.append('text')
		.datum(root)
		.attr('text-anchor', 'middle')
		.style('pointer-events', 'none')
		.text((d: any) => d.data.name);

	// Calculate optimal font size for center label
	function updateCenterLabelSize(textElement: any, text: string, maxRadius: number) {
		const minFontSize = 4;
		const maxFontSize = 14;

		// Start with max font size
		let fontSize = maxFontSize;
		textElement.style('font-size', `${fontSize}px`);

		// Get text dimensions
		const textNode = textElement.node();
		if (!textNode) return;

		let bbox = textNode.getBBox();
		const maxWidth = maxRadius * 1.6; // Allow text to use 90% of diameter
		const maxHeight = maxRadius * 0.8;

		// Reduce font size until text fits, but not below minimum
		while ((bbox.width > maxWidth || bbox.height > maxHeight) && fontSize > minFontSize) {
			fontSize *= 0.9;
			textElement.style('font-size', `${fontSize}px`);
			bbox = textNode.getBBox();
		}

		if (fontSize < minFontSize) {
			fontSize = minFontSize;
			textElement.style('font-size', `${fontSize}px`);
		}

		textElement.attr('dy', fontSize / 2 + 'px'); // Adjust vertical alignment
	}

	updateCenterLabelSize(centerLabel, (root.data as ChartData).name, radius);

	// Handle zoom on click
	function clicked(event: any, p: any) {
		if (svg.selectAll('.transitioning').size() > 0) return;

		parent.datum(p.parent || root);

		const targetPositions = new Map();
		root.each((d: any) => {
			targetPositions.set(d, {
				x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
				x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
				y0: Math.max(0, d.y0 - p.depth),
				y1: Math.max(0, d.y1 - p.depth)
			});
		});

		root.each((d: any) => {
			d.target = targetPositions.get(d);
		});

		const duration = event.altKey ? 1000 : 400;
		const t = svg.transition().duration(duration).ease(d3.easeQuadInOut);

		svg.classed('transitioning', true);
		t.on('end', () => svg.classed('transitioning', false));

		centerLabel.datum(p).text(p.data.name);
		updateCenterLabelSize(centerLabel, p.data.name, radius);

		const relevantArcs = path.filter(
			(d: any) =>
				arcVisible(d.current) || arcVisible(d.target) || d.current.y0 === 0 || d.target.y0 === 0
		);

		relevantArcs
			.transition(t)
			.tween('data', (d: any) => {
				const i = d3.interpolate(d.current, d.target);
				return (t: number) => (d.current = i(t));
			})
			.attr('fill-opacity', (d: any) => {
				if (!arcVisible(d.target)) return 0;
				const baseOpacity = 0.6;
				const depthFactor = Math.max(0.3, 1 - (d.depth - 1) * 0.3);
				return baseOpacity * depthFactor;
			})
			.attr('pointer-events', (d: any) => (arcVisible(d.target) ? 'auto' : 'none'))
			.attrTween('d', (d: any) => () => arc(d.current) || '');

		path
			.filter(
				(d: any) =>
					!arcVisible(d.current) && !arcVisible(d.target) && d.current.y0 !== 0 && d.target.y0 !== 0
			)
			.attr('fill-opacity', 0)
			.attr('pointer-events', 'none');

		const relevantLabels = label.filter((d: any) => labelVisible(d.target));

		relevantLabels
			.transition(t)
			.attr('fill-opacity', (d: any) => +labelVisible(d.target))
			.attrTween('transform', (d: any) => () => labelTransform(d.current));

		label.filter((d: any) => !labelVisible(d.target)).attr('fill-opacity', 0);
	}

	function arcVisible(d: any) {
		return d.y0 >= 1 && d.x1 > d.x0;
	}

	function labelVisible(d: any) {
		return d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.02;
	}

	function labelTransform(d: any) {
		const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
		const y = ((d.y0 + d.y1) / 2) * radius;
		return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
	}

	function truncateText(text: string, d: any): string {
		const arcRadius = ((d.y0 + d.y1) / 2) * radius;
		const availableWidth = arcRadius * 1;
		const fontSize = (d.y1 - d.y0) * radius * 0.09;
		const charWidth = fontSize * 0.8;
		const maxChars = Math.floor(availableWidth / charWidth);

		if (text.length <= maxChars) {
			return text;
		}

		const truncated = text.substring(0, Math.max(1, maxChars - 3));
		return truncated + '...';
	}
}

function getRandomHslColor() {
	const h = Math.floor(Math.random() * 360);
	const s = Math.floor(Math.random() * 30) + 50;
	const l = Math.floor(Math.random() * 30) + 40;
	return `hsl(${h}, ${s}%, ${l}%)`;
}
