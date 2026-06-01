# SvelteKit Adapter Configuration for AWS

## Current Configuration
The project uses `@sveltejs/adapter-auto` which automatically selects the appropriate adapter based on the deployment platform.

## For AWS Deployments

### EC2, App Runner, or Elastic Beanstalk
You may want to use `@sveltejs/adapter-node` for better control:

1. Install the adapter:
```bash
npm install -D @sveltejs/adapter-node
```

2. Update `svelte.config.js`:
```javascript
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      out: 'build',
      precompress: true,
      envPrefix: ''
    }),
    alias: {
      $server: 'src/lib/server'
    }
  }
};

export default config;
```

3. Update Dockerfile if needed (already configured for node adapter)

### For Static Deployment (S3 + CloudFront)

If you want to deploy as a static site:

1. Install the static adapter:
```bash
npm install -D @sveltejs/adapter-static
```

2. Update `svelte.config.js`:
```javascript
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: undefined,
      precompress: true,
      strict: true
    }),
    alias: {
      $server: 'src/lib/server'
    }
  }
};

export default config;
```

3. Add `+page.server.ts` files with `prerender = true`

**Note:** Static adapter requires all pages to be pre-rendered, which may not work with dynamic MongoDB queries. Consider using ISR (Incremental Static Regeneration) or stick with adapter-node for dynamic content.

## Recommended Configuration

For AWS deployments with MongoDB, **use adapter-auto** (current) or **adapter-node**. Both work well with:
- EC2 + PM2
- App Runner
- Elastic Beanstalk 
- Docker containers

The adapter-auto will automatically detect the environment and use the appropriate adapter.
