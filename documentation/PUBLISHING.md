# Publishing to Maven Central

This project is built with **sbt**, not Maven. There is no `pom.xml` — the POM that
lands on Maven Central is generated from [`spark-plugin/build.sbt`](../spark-plugin/build.sbt)
and [`spark-plugin/sonatype.sbt`](../spark-plugin/sonatype.sbt). Tutorials that tell
you to edit a `pom.xml` do not apply here; the concepts map one-to-one, only the file
format differs.

Publishing goes through the **Sonatype Central Portal** (`central.sonatype.com`). The
old OSSRH endpoint (`oss.sonatype.org`) was sunset on 2025-06-30 — ignore any guide
that still points there.

Coordinates published by this repo:

| Artifact | Coordinate |
|---|---|
| Shared code | `ai.telemetria:optima-spark-common_2.12` / `_2.13` |
| Spark 3.x plugin | `ai.telemetria:optima-spark_2.12` / `_2.13` |
| Spark 4.x plugin | `ai.telemetria:optima-spark4_2.13` |
| Databricks variant | `ai.telemetria:optima-spark4-databricks_2.13` |

> The Maven **groupId** is `ai.telemetria`. The **Scala package** is still
> `io.telemetria.optima` (e.g. `spark.plugins=io.telemetria.optima.SparkOptimaPlugin`).
> These are independent namespaces and do not need to match.

---

## One-time setup

You need four things before the first publish: an account, a verified namespace,
a user token, and a GPG key.

### 1. Create a Central Portal account

Sign up at <https://central.sonatype.com>. Signing in with GitHub is fine.

### 2. Verify the `ai.telemetria` namespace

`ai.telemetria` is the reverse of the domain `telemetria.ai`, so Sonatype requires
proof that you control that domain.

1. In the Portal, go to **Namespaces → Add Namespace** and enter `ai.telemetria`.
2. The Portal shows a verification code, e.g. `abc123xyz`.
3. Add it as a **TXT record** on `telemetria.ai` in your DNS provider:

   ```
   Type:  TXT
   Name:  @          (i.e. telemetria.ai itself, not a subdomain)
   Value: abc123xyz  (the exact code the Portal gave you)
   ```

4. Wait for DNS to propagate, then check it resolves:

   ```bash
   dig +short TXT telemetria.ai
   ```

5. Back in the Portal, click **Verify Namespace**.

Verification is permanent — you only do this once, and you can remove the TXT record
afterwards if you like.

**Then enable SNAPSHOT publishing on the namespace.** This is a separate opt-in and is
easy to miss: on the same namespaces page, open the dropdown next to `ai.telemetria`
and choose **Enable SNAPSHOTs**, then confirm. Without it, snapshot uploads fail with
`403 Forbidden` even though your token is valid.

### 3. Generate a Sonatype user token

> **This is NOT a GitHub token.** A GitHub personal access token (`ghp_...`) will not
> authenticate against Maven Central — it belongs to a completely unrelated system and
> will fail with a 401. The Sonatype token is generated on Sonatype's own site, and it
> is also not your Sonatype account password.

1. Go directly to <https://central.sonatype.com/usertoken> (logged in).
2. Click **Generate User Token**, give it a display name and expiry.
3. You get a pair of random strings — a username and a password. They are shown
   **once** and cannot be retrieved after the modal closes. Save them immediately.

Store them locally at `~/.sbt/sonatype_central_credentials`:

```
host=central.sonatype.com
user=<the username half>
password=<the password half>
```

```bash
chmod 600 ~/.sbt/sonatype_central_credentials
```

That file is **not** picked up on its own — it must be referenced from your global
sbt config at `~/.sbt/1.0/credentials.sbt`:

```scala
credentials += Credentials(Path.userHome / ".sbt" / "sonatype_central_credentials")
```

(Already created on this machine.) Alternatively, export `SONATYPE_USERNAME` and
`SONATYPE_PASSWORD` — sbt 1.11+ reads those out of the box. CI uses the env-var form.

### 4. GPG signing key — already done

Maven Central rejects unsigned artifacts. A key has already been generated for this
project and published to both keyservers:

| | |
|---|---|
| Key ID | `748EA39CE46F9378` |
| Fingerprint | `5B19 F9C7 EE3D 6AE2 A7E4  8B1E 748E A39C E46F 9378` |
| Identity | `Vrahad Analytics <ardb40@gmail.com>` |
| Type | RSA 4096, no expiry |
| Published to | `keyserver.ubuntu.com`, `keys.openpgp.org` |

Local files (outside the repo — never commit these):

- `~/optima-signing-key-BACKUP.asc` — armoured private key backup
- `~/optima-PGP_SECRET.txt` — base64 of the same, for the `PGP_SECRET` CI secret

The passphrase is not stored on disk. Put it in your password manager; you need it for
the `PGP_PASSPHRASE` CI secret and for local signing.

To sign locally, export the passphrase before running sbt:

```bash
export PGP_PASSPHRASE='<the passphrase>'
```

Verify the key is publicly resolvable:

```bash
curl -s "https://keyserver.ubuntu.com/pks/lookup?op=index&search=ardb40%40gmail.com"
```

If you ever need to generate a replacement key:

```bash
gpg --full-generate-key                      # RSA 4096, no expiry
gpg --list-secret-keys --keyid-format LONG   # get the long key id
gpg --keyserver keyserver.ubuntu.com --send-keys <LONG_KEY_ID>
```

---

## Publishing from your laptop

### Build the web UI first - always

The plugin embeds a React UI as jar resources. Those assets are **generated build
output and are gitignored**, so a fresh checkout does not have them. A jar built
without them publishes perfectly cleanly and then fails for every consumer at
`SparkContext` init:

```
java.lang.Exception: Could not find resource path for Web UI: io/telemetria/optima/static/ui
```

This is exactly how `0.1.0` shipped broken, and Maven Central releases are immutable.

```bash
cd spark-ui
npm ci
npm run deploy      # writes into spark-plugin/plugin/src/main/resources/...
cd ../spark-plugin
```

The build refuses to publish without them - `checkUiAssets` is wired into `publish`,
`publishLocal` and `publishSigned` - but build the UI deliberately rather than relying
on the guard to catch you. CI does this automatically in `.github/workflows/release.yml`.

Sanity-check any jar before releasing it:

```bash
unzip -l <jar> | grep -c io/telemetria/optima/static/ui   # must be 8, not 0
```

### Then publish

All commands run from the `spark-plugin/` directory.

**Always do a snapshot first.** Snapshots are not permanent and let you verify the
whole pipeline without burning a version number.

```bash
cd spark-plugin

# Version is derived from git tags: with no v* tag on HEAD you get 0.1.0-SNAPSHOT
sbt +publishSigned
```

That uploads to the Central snapshots repo. Confirm it appears at
<https://central.sonatype.com/repository/maven-snapshots/ai/telemetria/>.

For a real release:

The git tag is the single source of truth for the released version: tagging `v0.2.0`
publishes `0.2.0`. You do not edit a version number in `build.sbt`.

```bash
# 0. Wipe stale staging - it is NOT cleaned between releases and a leftover
#    older version would be bundled into your upload
rm -rf target/sona-staging

# 1. Tag the commit you want to release
git tag v0.1.1
git push origin v0.1.1

# 3. Build, sign, and stage all cross-built artifacts
cd spark-plugin
sbt +publishSigned

# 4. Upload the staged bundle and release it
sbt sonaRelease
```

Use `sbt sonaUpload` instead of `sonaRelease` if you want to inspect the bundle in
the Portal UI and click Publish manually — safer for a first release.

After releasing, the artifacts take roughly 10–30 minutes to appear on
<https://repo1.maven.org/maven2/ai/telemetria/> and a few hours to show in search.

**Releases are permanent.** A version number on Maven Central can never be
overwritten or deleted. If you get it wrong, you publish a new version.

---

## Publishing from GitHub Actions

[`.github/workflows/release.yml`](../.github/workflows/release.yml) does this
automatically via `sbt-ci-release`:

- push to `main` → publishes a `-SNAPSHOT`
- push a `v*` tag → publishes a signed release to Maven Central

Add these four repository secrets under **Settings → Secrets and variables → Actions**:

| Secret | Value |
|---|---|
| `SONATYPE_USERNAME` | username half of the user token from step 3 |
| `SONATYPE_PASSWORD` | password half of the user token from step 3 |
| `PGP_SECRET` | output of `gpg --armor --export-secret-keys <LONG_KEY_ID> \| base64` |
| `PGP_PASSPHRASE` | the passphrase you set on the GPG key |

On macOS, `base64` wraps lines by default; produce a single line with:

```bash
gpg --armor --export-secret-keys <LONG_KEY_ID> | base64 | tr -d '\n' | pbcopy
```

Then release with:

```bash
git tag v0.1.0
git push origin v0.1.0
```

---

## Troubleshooting

**"401 Unauthorized"** — the token is wrong, or you used your account password
instead of the generated user token. Regenerate the token.

**"403 Forbidden" on a `-SNAPSHOT` upload** — SNAPSHOT publishing is not enabled on
the namespace. Portal → Namespaces → dropdown next to `ai.telemetria` → **Enable
SNAPSHOTs**. A valid token still gets 403 without this.

**"403 Forbidden" on a release** — `ai.telemetria` is not verified, or the
`organization` in `build.sbt` does not match the verified namespace exactly.

**"401 Unauthorized"** — sbt is not sending credentials at all. Check that
`~/.sbt/1.0/credentials.sbt` exists and references the credentials file (see step 3);
creating `~/.sbt/sonatype_central_credentials` alone is not enough.

**"Missing signature" / validation failed** — you ran `publish` instead of
`publishSigned`, or GPG could not find the key. Check `gpg --list-secret-keys`.

**"gpg: signing failed: Inappropriate ioctl for device"** — GPG cannot prompt for the
passphrase. Run `export GPG_TTY=$(tty)` first.

**Validation complains about missing javadoc/sources** — sbt publishes these by
default; make sure you are not running with `publishArtifact := false` anywhere.

**Version published as `0.1.0-SNAPSHOT` when you wanted a release** — the git tag
must start with `v` and must be on the exact commit you are building. Check with
`git describe --tags`.
