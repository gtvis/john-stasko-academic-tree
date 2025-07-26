import adapter from '@sveltejs/adapter-static';

export default {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: undefined,
			precompress: false,
			strict: false
		}),
		prerender: {
			entries: ['*']
		},
		paths: {
			base: process.env.NODE_ENV === 'production' ? '/john-stasko-academic-tree' : ''
		}
	}
};
