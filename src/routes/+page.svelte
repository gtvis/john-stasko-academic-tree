<script lang="ts">
	import { onMount } from 'svelte';
	import { createSunburstChart, type ChartData } from '$lib/chart';
	import { fetchSheetsData, prepareHierarchyData, type SheetRow } from '$lib/dataProcessor';
	import { createTooltipFunctions } from '$lib/ui';
	import { generateRandomTestData } from '$lib/utils';

	let sheetsData: SheetRow[] = [];
	let headers: string[] = [];
	let loading = true;
	let error: string | null = null;
	let chartContainer: HTMLDivElement;
	let tooltip: HTMLDivElement;
	let modalOpen = false;

	// Google Sheets configuration
	const SHEET_ID = '13CFUmKxFoCsBR5tdHfRI-3VlMOhsT2sGAhLOYxo499Y';
	const SHEET_GID = 0;

	// Function to change colors and recreate chart
	function changeColors() {
		if (chartContainer) {
			createChart();
		}
	}

	// Toggle modal
	function toggleModal() {
		modalOpen = !modalOpen;
	}

	onMount(async () => {
		await loadData();
		createChart();

		// Add mobile tooltip close functionality
		if (typeof window !== 'undefined' && window.innerWidth <= 768) {
			document.addEventListener('click', (e) => {
				const target = e.target as HTMLElement;
				if (target && target.classList.contains('tooltip')) {
					tooltip.style.display = 'none';
				}
			});
		}
	});

	async function loadData() {
		try {
			loading = true;
			error = null;
			const result = await fetchSheetsData(SHEET_ID, SHEET_GID);
			sheetsData = result.sheetsData;
			headers = result.headers;
		} catch (err) {
			console.error('Google Sheets fetch error:', err);
			error = err instanceof Error ? err.message : 'Failed to fetch Google Sheets data';
		} finally {
			loading = false;
		}
	}

	function createChart() {
		if (!chartContainer) {
			console.error('Chart container not found!');
			return;
		}

		// Use test data
		// const hierarchyData = generateRandomTestData(8);
		const hierarchyData = prepareHierarchyData(sheetsData, headers);
		const tooltipFunctions = createTooltipFunctions(tooltip);

		createSunburstChart(
			chartContainer,
			hierarchyData,
			tooltipFunctions.showTooltip,
			tooltipFunctions.updateTooltipPosition,
			tooltipFunctions.hideTooltip
		);
	}
</script>

<div class="title">
	<h1>John Stasko's Academic Tree</h1>
	<p class="description">
		This is the academic advisee tree of <a href="https://faculty.cc.gatech.edu/~john.stasko/"
			>Dr. John Stasko</a
		>,<br />creator of the Sunburst chart and
		<a href="https://ieeexplore.ieee.org/document/10373163"
			>2023 IEEE VIS <br />Lifetime Achievement Award</a
		> recipient.
	</p>
	<p class="description contact">
		The data is available <a
			href="https://docs.google.com/spreadsheets/d/13CFUmKxFoCsBR5tdHfRI-3VlMOhsT2sGAhLOYxo499Y/edit?usp=sharing"
			>here</a
		>. Contact <a href="https://fuyugt.github.io/">Yu</a> to edit.
	</p>
	<p class="description credit">
		Designed by <a href="https://aereeeee.github.io/">Aeree</a>.
	</p>
	<!-- Info button for mobile -->
	<button class="info-btn" on:click={toggleModal} title="More info">(About)</button>
</div>

<!-- Color change button -->
<button class="color-change-btn" on:click={changeColors} title="Change colors">
	<svg
		xmlns="http://www.w3.org/2000/svg"
		height="32px"
		viewBox="0 -960 960 960"
		width="32px"
		fill="currentColor"
		><path
			d="M346-140 100-386q-10-10-15-22t-5-25q0-13 5-25t15-22l230-229-106-106 62-65 400 400q10 10 14.5 22t4.5 25q0 13-4.5 25T686-386L440-140q-10 10-22 15t-25 5q-13 0-25-5t-22-15Zm47-506L179-432h428L393-646Zm399 526q-36 0-61-25.5T706-208q0-27 13.5-51t30.5-47l42-54 44 54q16 23 30 47t14 51q0 37-26 62.5T792-120Z"
		/></svg
	>
</button>

<!-- Modal -->
<div class="modal {modalOpen ? 'open' : ''}" on:click|self={() => (modalOpen = false)}>
	<div class="modal-content">
		<button class="modal-close" on:click={() => (modalOpen = false)}
			><svg
				xmlns="http://www.w3.org/2000/svg"
				height="24px"
				viewBox="0 -960 960 960"
				width="24px"
				fill="currentColor"
				><path
					d="m336-280-56-56 144-144-144-143 56-56 144 144 143-144 56 56-144 143 144 144-56 56-143-144-144 144Z"
				/></svg
			></button
		>
		<div class="modal-info">
			<p class="description">
				This is the academic advisee tree of <a href="https://faculty.cc.gatech.edu/~john.stasko/"
					>Dr. John Stasko</a
				>, creator of the Sunburst chart and
				<a href="https://ieeexplore.ieee.org/document/10373163"
					>2023 IEEE VIS Lifetime Achievement Award</a
				> recipient.
			</p>
			<p class="description contact">
				The data is available <a
					href="https://docs.google.com/spreadsheets/d/13CFUmKxFoCsBR5tdHfRI-3VlMOhsT2sGAhLOYxo499Y/edit?usp=sharing"
					>here</a
				>. Contact <a href="https://fuyugt.github.io/">Yu</a> to edit.
			</p>
			<p class="description credit">
				Designed by <a href="https://aereeeee.github.io/">Aeree</a>.
			</p>
		</div>
	</div>
</div>

{#if loading}
	<div class="loading">
		<p>Loading data...</p>
	</div>
{:else if error}
	<div class="error">
		<h2>Error Loading Data</h2>
	</div>
{:else}
	<div class="fullscreen-chart">
		<div class="chart-container" bind:this={chartContainer}></div>
		<div class="tooltip" bind:this={tooltip}></div>
	</div>
{/if}

<style>
	:global(html) {
		font-size: 18px;
		background: #fafafa;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
		font-family: 'Schibsted Grotesk', sans-serif;
		background: #fafafa;
	}
	:global(svg text) {
		font-family: 'Schibsted Grotesk', sans-serif;
		fill: #222;
	}
	.title {
		width: 100%;
		max-width: 30rem;
		position: absolute;
		top: 0;
		left: 0;
		z-index: 10;
		padding: 1.5rem 2rem;
		box-sizing: border-box;
	}
	.title h1 {
		margin: 0 0 0.75rem 0;
		font-size: 1.7rem;
		color: #7a7a7a;
		font-weight: 400;
	}
	.description {
		color: #9e9e9e;
		line-height: 1.45;
		font-size: 0.9rem;

		a {
			color: #828282;
			transition: 0.4s;
			text-decoration: none;
		}
		a:hover {
			color: #222;
		}
	}
	.credit {
		font-style: italic;
		font-size: 0.9rem;
		opacity: 0.7;
	}
	.color-change-btn {
		position: fixed;
		top: 1rem;
		right: 1rem;
		width: 2.5rem;
		height: 2.5rem;
		border: none;
		font-size: 2rem;
		cursor: pointer;
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		transform: scaleX(-1);
		background-color: transparent;
		svg {
			fill: #9e9e9e;
		}
	}

	.color-change-btn:hover {
		transform: scaleX(-1) scale(1.1);
	}

	.color-change-btn:active {
		transform: scaleX(-1) scale(1);
	}

	.info-btn {
		display: none;
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
		color: #9e9e9e;
		font-size: 0.9rem;
	}

	.modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		visibility: hidden;
		transition: all 0.3s ease;
	}

	.modal.open {
		opacity: 1;
		visibility: visible;
	}

	.modal-content {
		background: white;
		padding: 1rem 1.5rem;
		border-radius: 8px;
		width: 90vw;
		box-sizing: border-box;
		overflow-y: auto;
		position: relative;
		transform: scale(0.9);
		transition: transform 0.3s ease;
	}

	.modal.open .modal-content {
		transform: scale(1);
	}

	.modal-close {
		position: absolute;
		top: 0.1rem;
		right: 0.1rem;
		width: 2rem;
		height: 2rem;
		border: none;
		background: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #9e9e9e;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-info {
		color: #666;
		line-height: 1.5;
	}

	.modal-info a {
		color: #666;
		text-decoration: none;
		transition: color 0.2s ease;
	}

	.modal-info a:hover {
		color: #333;
	}

	.modal-info .credit {
		font-style: italic;
		font-size: 0.9rem;
	}

	/* Mobile: show info button and hide descriptions from title */
	@media (max-width: 768px) {
		.chart-container {
			margin-bottom: 3rem;
		}

		.info-btn {
			display: block;
		}
		.title h1 {
			font-size: 1.5rem;
			width: 80%;
		}
		.title .description,
		.title .contact,
		.title .credit {
			display: none;
		}
	}

	.fullscreen-chart {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #fafafa;
	}

	.chart-container {
		width: 90vmin;
		height: 90vmin;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.loading,
	.error,
	.no-data {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
		color: #9e9e9e;
	}
	.tooltip {
		position: absolute;
		display: none;
		background: white;
		padding: 0.5rem 0.75rem;
		border: 1px solid #efefef;
		border-radius: 4px;
		font-size: 0.75rem;
		z-index: 1000;
		pointer-events: none;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		line-height: 1.3;
	}

	/* Mobile: fix tooltip to bottom */
	@media (max-width: 768px) {
		.tooltip {
			position: fixed !important;
			bottom: 0 !important;
			left: 0 !important;
			right: 0 !important;
			top: auto !important;
			transform: none !important;
			width: 100%;
			box-sizing: border-box;
			border-radius: 0;
			border: none;
			max-width: none;
			box-shadow: none;
			background: transparent;
			pointer-events: auto;
			padding: 2rem;
			height: 10rem;
		}

		:global(.tooltip-name) {
			font-size: 1rem;
		}
		:global(.tooltip-label) {
			font-size: 1rem;
		}

		:global(.tooltip-value) {
			font-size: 1rem;
		}
	}

	:global(.tooltip-content) {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	:global(.tooltip-name) {
		font-size: 0.9rem;
		color: #333;
		font-weight: 500;
		line-height: 1.2;
		&.has-info {
			margin-bottom: 0.25rem;
		}
	}

	:global(.tooltip-field) {
		display: flex;
		justify-content: space-between;
		line-height: 1.3;
	}

	:global(.tooltip-label) {
		color: #9e9e9e;
		font-size: 0.8rem;
		margin-right: 0.5rem;
		white-space: nowrap;
	}

	:global(.tooltip-value) {
		color: #333;
		font-size: 0.8rem;
		white-space: nowrap;
	}

	:global(.tooltip-value.tooltip-role) {
		text-align: right;
		white-space: normal;
	}
</style>
