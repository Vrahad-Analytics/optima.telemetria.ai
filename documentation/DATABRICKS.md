# Running Optima on Databricks

Databricks needs a different installation route from every other platform, and the
route most people try first does not work. This page covers what to install, why,
and how to check it worked.

## Why not a cluster library

Optima is a Spark *plugin*: Spark reads `spark.plugins` and loads the class while
the driver JVM is starting. Databricks installs cluster libraries — Maven, PyPI,
uploaded jars — only *after* the driver is up, so at the moment Spark looks for
the plugin class it is not on the classpath yet:

```
java.lang.ClassNotFoundException: io.telemetria.optima.SparkOptimaPlugin not found in
com.databricks.backend.daemon.driver.ClassLoaders$LibraryClassLoader@...
```

This is a documented Databricks sequencing limitation, not something Optima can
work around, and it applies to every Spark plugin (RAPIDS hits it too). For the
same reason `spark.jars.packages` — which is what the README suggests for local
PySpark — will not get you there either.

The supported route is a **cluster-scoped init script** that puts the jar on the
driver classpath *before* Spark starts and writes `spark.plugins` into the driver
defaults.

## 1. Pick the artifact for your runtime

Check **Compute → your cluster → Configuration** for the Databricks Runtime, then:

| Databricks Runtime | Spark | Scala | Coordinate |
|---|---|---|---|
| 17.3 LTS and up | 4.0 | 2.13 | `ai.telemetria:optima-spark4-databricks_2.13:0.1.1` |
| 13.3 LTS – 16.4 LTS | 3.4 / 3.5 | 2.12 | `ai.telemetria:optima-spark_2.12:0.1.1` |
| 16.4 LTS, Scala 2.13 variant | 3.5 | 2.13 | `ai.telemetria:optima-spark_2.13:0.1.1` |

DBR 17.3+ needs the dedicated `optima-spark4-databricks` build: that runtime ships
`javax.servlet` where upstream Spark 4 ships `jakarta.servlet`, and this artifact
is the same code with the servlet package rewritten. The plain `optima-spark4`
jar will not serve its UI there.

All of these are self-contained assemblies — one jar, no transitive downloads.

> Do not use `0.1.0` on any runtime. It shipped without its web UI assets and
> fails with `Could not find resource path for Web UI`.

## 2. Add the init script

Take [`resources/databricks-init-optima.sh`](resources/databricks-init-optima.sh),
set `OPTIMA_ARTIFACT` to the coordinate from the table, and:

1. Upload it to a Unity Catalog volume (`/Volumes/<catalog>/<schema>/<volume>/`)
   or to `/Workspace`.
2. **Compute → your cluster → Edit → Advanced → Init scripts**, add the path,
   choosing source `Volume` or `Workspace`.
3. Restart the cluster.

On **standard (shared) access mode** a workspace admin must first add the script
to the init-script allowlist, or the cluster will refuse to start.

What the script does:

- downloads the jar to `/databricks/jars/` (all nodes) and `/mnt/driver-daemon/jars/`
  (driver), which is what actually gets it onto the driver classpath in time;
- appends `spark.plugins` to `/databricks/driver/conf/00-custom-spark-driver-defaults.conf`,
  the supported way to set driver-only Spark config from an init script.

Setting `spark.plugins` in the cluster's **Spark config** box instead does not
work — that box is applied to driver and executors alike and still races the
library installation.

## 3. Optional Optima settings

Unlike `spark.plugins`, the `spark.optima.*` keys are ordinary config read by the
plugin after it loads, so these *can* go in **Advanced → Spark → Spark config**:

```
spark.optima.enabled true
spark.optima.instrument.deltalake.enabled true
spark.optima.instrument.spark.enabled true
```

`spark.optima.instrument.deltalake.enabled` is worth turning on here — Databricks
tables are Delta by default, and it is off by default. Full key list is in the
[README](../README.md#configuration).

## 4. Open the UI

**Compute → your cluster → Spark UI**, then the **Optima** tab. Use *Open in new
tab* — the embedded frame is cramped.

Optima detects Databricks automatically, via
`spark.databricks.clusterUsageTags.cloudProvider`, and adjusts itself: it registers
an extra listener that records the plan-node-to-RDD mapping on every adaptive
re-plan, which the stock Spark listener does not expose, and it recognises Photon
operators in the plan. Nothing to configure for either.

## Verifying and troubleshooting

Look in the driver log (**Compute → cluster → Driver logs → log4j output**):

| What you see | Cause |
|---|---|
| No Optima tab, no Optima log lines | Init script did not run — check the cluster **Event log** for an init script failure |
| `ClassNotFoundException: io.telemetria.optima.SparkOptimaPlugin` | Jar not on the driver classpath — usually installed as a library instead of via the init script |
| Init script fails with `curl: (56) ... 404` | `OPTIMA_ARTIFACT` does not match the runtime — recheck the table above |
| `Failed to parse conf file '/databricks/driver/conf/00-custom-spark-driver-defaults.conf'` | Another init script wrote malformed HOCON into the same file |
| Tab loads but is blank | Using `0.1.0`, or `optima-spark4` instead of `optima-spark4-databricks` on DBR 17.3+ |
| `Optima is disabled via spark.optima.enabled` | `spark.optima.enabled` is set to `false` |
| `No UI detected, skipping installation` | Spark UI is disabled on the cluster (`spark.ui.enabled=false`) |

## Limitations

Realtime observability on a running cluster is supported. The **Spark History
Server** integration is not — Databricks does not expose a history server you can
install a provider into, so completed-run analysis is unavailable there.
