// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import Unocss from 'unocss/astro';

// https://astro.build/config
export default defineConfig({
	site: 'https://bycosmo.github.io',
	base: '',
	integrations: [mdx(), sitemap(), Unocss({
		injectReset: true
	})],
});
