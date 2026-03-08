# Self-Hosted GitHub Actions Runner for Auto-Deploy

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Auto-deploy metra to k3s on push to main, using a self-hosted GitHub Actions runner on the same Mac that runs the cluster.

**Architecture:** A GitHub Actions runner runs as a macOS launchd service. On push to main (filtered to relevant paths), a workflow runs `npm ci && npm run build` in `web/`, builds the container image with `colima nerdctl`, and does a `kubectl rollout restart`. The runner needs Colima, nerdctl, and kubectl on PATH, plus a valid KUBECONFIG.

**Tech Stack:** GitHub Actions, colima/nerdctl, kubectl, launchd

---

### Task 1: Install and register the GitHub Actions runner

**Step 1: Create a directory for the runner**

```bash
mkdir -p ~/actions-runner && cd ~/actions-runner
```

**Step 2: Download the runner**

Go to https://github.com/tamosz/metra/settings/actions/runners/new and follow the download instructions for macOS ARM64. It will look like:

```bash
curl -o actions-runner-osx-arm64-2.322.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.322.0/actions-runner-osx-arm64-2.322.0.tar.gz
tar xzf actions-runner-osx-arm64-2.322.0.tar.gz
```

(Use whatever version the settings page shows.)

**Step 3: Configure the runner**

```bash
./config.sh --url https://github.com/tamosz/metra --token <TOKEN_FROM_SETTINGS_PAGE>
```

Use defaults. Name it something like `colima-k3s`.

**Step 4: Install as a launchd service**

```bash
./svc.sh install
./svc.sh start
./svc.sh status
```

Expected: service is running.

**Step 5: Verify runner appears in GitHub**

Go to https://github.com/tamosz/metra/settings/actions/runners — the runner should show as "Idle".

---

### Task 2: Configure runner environment

The launchd service runs with a minimal environment. It won't have Homebrew, colima, kubectl, etc. on PATH by default.

**Step 1: Find binary paths**

```bash
which colima kubectl node npm
```

Note the full paths (likely `/opt/homebrew/bin/` for all of them).

**Step 2: Create a `.env` file for the runner**

Create `~/actions-runner/.env`:

```
PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin
KUBECONFIG=/Users/tome/.kube/config
```

The runner loads this file automatically on startup.

**Step 3: Restart the runner service**

```bash
cd ~/actions-runner
./svc.sh stop
./svc.sh start
```

**Step 4: Verify environment with a test workflow**

Create `.github/workflows/test-runner.yml`:

```yaml
name: Test Runner
on: workflow_dispatch

jobs:
  test:
    runs-on: self-hosted
    steps:
      - run: |
          echo "PATH: $PATH"
          which colima kubectl node npm
          colima status --profile k3s
          kubectl get pods -n tomeblog
```

Trigger it from the Actions tab. Expected: all commands succeed and show the metra pod.

**Step 5: Delete the test workflow after verifying**

```bash
rm .github/workflows/test-runner.yml
git add -A .github/ && git commit -m "remove test runner workflow"
```

---

### Task 3: Create the deploy workflow

**Step 1: Create the workflow file**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Metra

on:
  push:
    branches: [main]
    paths:
      - 'web/**'
      - 'src/**'
      - 'data/**'
      - 'packages/**'

jobs:
  deploy:
    runs-on: self-hosted
    defaults:
      run:
        working-directory: web
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Build container image
        run: colima nerdctl --profile k3s -- --namespace k8s.io build -t tomeblog/metra:latest .

      - name: Deploy
        run: |
          kubectl rollout restart deployment/metra -n tomeblog
          kubectl rollout status deployment/metra -n tomeblog --timeout=120s

      - name: Verify
        run: |
          sleep 5
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://metra.tomeblog.svc.cluster.local:80/metra/)
          if [ "$STATUS" != "200" ]; then
            echo "Health check failed: HTTP $STATUS"
            exit 1
          fi
```

**Step 2: Commit and push**

```bash
git add .github/workflows/deploy.yml
git commit -m "add auto-deploy workflow for metra"
git push
```

**Step 3: Test by pushing a trivial change to main**

Make a small change (e.g., whitespace in a data file), push to main, and verify the workflow runs and deploys successfully in the Actions tab.

---

### Task 4: Add deploy status badge (optional)

**Step 1: Add badge to README or CLAUDE.md**

Not required, but useful for at-a-glance status:

```markdown
![Deploy](https://github.com/tamosz/metra/actions/workflows/deploy.yml/badge.svg)
```

---

## Notes

- **Colima must be running** for deploys to work. If the Mac reboots, Colima needs to be started manually (or set up as a login item).
- **Concurrent deploys**: GitHub Actions serializes jobs on the same runner by default, so concurrent pushes won't collide.
- **The verify step** curls from the runner machine. If the runner can't reach the k8s service DNS, change it to `kubectl exec` or `curl localhost:<nodeport>`.
- **Security**: the runner has full access to kubectl and the cluster. This is fine for a personal project with a private repo. For public repos, self-hosted runners are a security risk (untrusted PRs can run arbitrary code).
