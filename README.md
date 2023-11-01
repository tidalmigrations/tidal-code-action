# Tidal Tools GitHub Action

Continually monitor your application's cloud readiness

## Requirements

The action requires that you provide the login credentials for your Tidal Accelerator workspace. We recommend creating a `service user` specifically for using this action.

## Usage

To use this action, you need to provide the following inputs:

### Inputs

- `tidal-email` (required): The email for the Tidal Accelerator service user.

- `tidal-password` (required): The password for the Tidal Accelerator service user.

- `tidal-url` (required): The workspace URL for your Tidal Accelerator Account, for example, `https://workspace.tidal.cloud`.

- `app-id` (required): The ID of the application that is being this action is analyzing

### Example Workflow

Here is an example workflow that uses this GitHub Action:

```yaml
name: Tidal Accelerator Workflow

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - uses: tidalmigrations/tidal-code-action@v1
      with:
        tidal-email: ${{ secrets.TIDAL_EMAIL }}
        tidal-password: ${{ secrets.TIDAL_PASSWORD }}
        tidal-url: https://workspace.tidal.cloud
        app-id: 1
```

Make sure to store your sensitive information (like `TIDAL_EMAIL`, `TIDAL_PASSWORD`) as [secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions) in your repository settings to keep them secure.

## License

This GitHub Action is licensed under the [MIT License](./LICENSE)

Feel free to contribute, report issues, or request new features on [GitHub](https://github.com/tidalmigrations/tidal-code-action).
