# Contributing

## Pre-requisites

### Git hooks

Set up git hooks by running the following:

```sh
git config core.hooksPath .githooks
```

Now all commits will run the deno `pre-commit` task.

## Development

We have provided a series of deno tasks for development:

- Format: `deno task fmt`
- Lint: `deno task lint`
- Test: `deno task test`
- Check coverage in browser: `deno task report`
