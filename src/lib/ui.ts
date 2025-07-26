import type { ChartData } from './chart';

export function createTooltipFunctions(tooltip: HTMLDivElement) {
	function showTooltip(event: MouseEvent, d: { data: ChartData }) {
		if (!tooltip) return;

		const data = d.data;

		// Process current role
		const formatCurrentRole = (role: string | undefined) => {
			if (!role || role === 'N/A') return null;
			return role
				.split(',')
				.map((r) => r.trim())
				.join('<br>');
		};

		// Build tooltip fields conditionally
		const emailField = data.email
			? `
			<div class="tooltip-field">
				<span class="tooltip-label">Email:</span>
				<span class="tooltip-value">${data.email}</span>
			</div>
		`
			: '';

		const roleField = formatCurrentRole(data.currentRole)
			? `
			<div class="tooltip-field">
				<span class="tooltip-label">Current Role:</span>
				<span class="tooltip-value tooltip-role">${formatCurrentRole(data.currentRole)}</span>
			</div>
		`
			: '';

		tooltip.innerHTML = `
			<div class="tooltip-content">
				<div class="tooltip-name ${data.email || data.currentRole ? 'has-info' : ''}">${data.name}</div>
				${emailField}
				${roleField}
			</div>
		`;

		tooltip.style.display = 'block';
		updateTooltipPosition(event);
	}

	function updateTooltipPosition(event: MouseEvent) {
		if (!tooltip) return;

		const tooltipRect = tooltip.getBoundingClientRect();
		const x = event.pageX + 10;
		const y = event.pageY - tooltipRect.height - 10;

		// Keep tooltip within viewport
		const maxX = window.innerWidth - tooltipRect.width - 10;

		tooltip.style.left = `${Math.min(x, maxX)}px`;
		tooltip.style.top = `${Math.max(y, 10)}px`;
	}

	function hideTooltip() {
		if (!tooltip) return;
		tooltip.style.display = 'none';
	}

	return { showTooltip, updateTooltipPosition, hideTooltip };
}
