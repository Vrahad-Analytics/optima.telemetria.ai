<p align="center">
<img alt="Optima logo" src="documentation/resources/logo.png" height="90">
</p>

<h2 align="center">
 Optima by Telemetria — Spark Performance Made Simple
</h2>

<div align="center">

![License](https://img.shields.io/badge/License-Apache%202.0-orange)

</div>

## What is Optima?

Optima is a modern, user-friendly enhancement for Apache Spark that simplifies performance monitoring and debugging. It adds an intuitive tab to the existing Spark Web UI, transforming a powerful but often overwhelming interface into something easy to navigate and understand.

Optima is an open-source product by [Vrahad Analytics](https://github.com/Vrahad-Analytics) (Telemetria).

## Why Optima?

- **Intuitive Design**: Optima's tab in the Spark Web UI presents complex metrics in a clear, easy-to-understand format, making Spark performance accessible to everyone.
- **Effortless Setup**: Install Optima in minutes with just a few lines of code or configuration, without making any changes to your existing Spark environment.
- **For All Skill Levels**: Whether you're a seasoned data engineer or just starting with Spark, Optima provides valuable insights that help you work more effectively.
- **No Phone-Home**: Optima contains no usage analytics or external telemetry. Nothing leaves your cluster.

## Features

- 📈 Real-time query and cluster status
- 📊 Query breakdown with performance heat map
- 📋 Application Run Summary
- ⚠️ Performance alerts and suggestions
- 👀 Identify query failures
- 🤖 Spark AI Assistant (bring your own OpenAI API key)

### Usage

After installation, you will see an "Optima" tab in the Spark Web UI. Click on it to start using Optima.

## Installation

> ⚠️ **Do not use `0.1.0`.** It was published without the embedded web UI assets and fails at
> startup with `java.lang.Exception: Could not find resource path for Web UI: io/telemetria/optima/static/ui`.
> Maven Central releases are immutable, so it cannot be withdrawn. Use `0.1.1` or later.

### Scala

Install Optima via sbt:

For Spark 3.X:
```sbt
libraryDependencies += "ai.telemetria" %% "optima-spark" % "0.1.1"
```

For Spark 4.X:
```sbt
libraryDependencies += "ai.telemetria" %% "optima-spark4" % "0.1.1"
```

Then instruct spark to load the Optima plugin:
```scala
val spark = SparkSession
    .builder()
    .config("spark.plugins", "io.telemetria.optima.SparkOptimaPlugin")
    ...
    .getOrCreate()
```

### PySpark

Add these 2 configs to your pyspark session builder:

For Spark 3.X:
```python
builder = pyspark.sql.SparkSession.builder
    ...
    .config("spark.jars.packages", "ai.telemetria:optima-spark_2.12:0.1.1") \
    .config("spark.plugins", "io.telemetria.optima.SparkOptimaPlugin") \
    ...
```

For Spark 4.X:
```python
builder = pyspark.sql.SparkSession.builder
    ...
    .config("spark.jars.packages", "ai.telemetria:optima-spark4_2.13:0.1.1") \
    .config("spark.plugins", "io.telemetria.optima.SparkOptimaPlugin") \
    ...
```

### Spark Submit

Alternatively, install Optima with **no code change** as a spark ivy package by adding these 2 lines to your spark-submit command:

```bash
spark-submit
--packages ai.telemetria:optima-spark_2.12:0.1.1 \
--conf spark.plugins=io.telemetria.optima.SparkOptimaPlugin \
...
```

For Spark 4.X:
```bash
spark-submit
--packages ai.telemetria:optima-spark4_2.13:0.1.1 \
--conf spark.plugins=io.telemetria.optima.SparkOptimaPlugin \
...
```

### Additional installation options

* There is also support for scala 2.13, if your spark cluster is using scala 2.13 change package name to ai.telemetria:optima-spark_**2.13**:0.1.1
* For observability on completed runs, install Optima in the **Spark History Server**: set `spark.history.provider=org.apache.spark.deploy.history.FsOptimaHistoryProvider` and add the Optima JAR to the history server classpath (see the `docker/` directory for a ready-made history server image).
* On **Databricks**, Optima must be installed with a cluster init script rather than as a Maven library — `spark.plugins` is read before Databricks installs cluster libraries. See [documentation/DATABRICKS.md](documentation/DATABRICKS.md) for the script, the per-runtime artifact (DBR 17.3+ needs the shaded `optima-spark4-databricks_2.13` build) and troubleshooting.

## Configuration

All configuration keys live under the `spark.optima.*` prefix. Commonly used keys:

| Key | Default | Description |
|-----|---------|-------------|
| `spark.optima.enabled` | `true` | Master switch for the plugin |
| `spark.optima.alert.disabled` | unset | Comma-separated list of alerts to suppress |
| `spark.optima.cacheObservability.enabled` | `true` | Track cached RDD/DataFrame storage |
| `spark.optima.iceberg.enabled` | `true` | Apache Iceberg observability |
| `spark.optima.iceberg.autoCatalogDiscovery` | `false` | Auto-register the Iceberg metrics reporter on Iceberg catalogs |
| `spark.optima.instrument.deltalake.enabled` | `false` | Delta Lake instrumentation |
| `spark.optima.instrument.spark.enabled` | `false` | SQL-node instrumentation (per-operator durations) |

> Migrating from DataFlint? The config prefix changed from `spark.dataflint.*` to `spark.optima.*`, the plugin class is now `io.telemetria.optima.SparkOptimaPlugin`, and the UI tab is served under `/optima`. Event logs recorded by DataFlint versions will render in the history server without Optima-specific enrichments.

## Building from source

```bash
# Build the UI and embed it into the plugin resources
cd spark-ui
npm install
npm run deploy

# Build the plugin JARs
cd ../spark-plugin
sbt pluginspark3/assembly                       # Spark 3.x (Scala 2.12)
sbt ++2.13.16 pluginspark3/assembly             # Spark 3.x (Scala 2.13)
sbt ++2.13.16 pluginspark4/assembly             # Spark 4.x
sbt ++2.13.16 pluginspark4databricks/assembly   # Spark 4.x on Databricks
```

## Publishing

Releases go to Maven Central under the `ai.telemetria` namespace via the Sonatype
Central Portal. See [documentation/PUBLISHING.md](documentation/PUBLISHING.md) for
account setup, namespace verification, GPG signing, and the release procedure.

## How it Works

Optima is installed as a plugin on the spark driver and history server.

The plugin exposes additional HTTP resources for metrics not available in the Spark UI, and a modern SPA web-app that fetches data from spark without the need to refresh the page.

## Compatibility Matrix

Optima requires spark version 3.2 and up, and supports both scala versions 2.12 or 2.13.

| Spark Platforms           | Optima Realtime     | Optima History server    |
|---------------------------|---------------------|--------------------------|
| Local                     |       ✅            |           ✅             |
| Standalone                |       ✅            |           ✅             |
| Kubernetes Spark Operator |       ✅            |           ✅             |
| EMR                       |       ✅            |           ✅             |
| Dataproc                  |       ✅            |           ✅             |
| HDInsights                |       ✅            |           ❌             |
| Databricks                |       ✅            |           ❌             |

## License and attribution

Optima is licensed under the [Apache License 2.0](LICENSE).

Optima is derived from [DataFlint OSS](https://github.com/dataflint/spark), an open-source Spark observability plugin licensed under the Apache License 2.0. See [NOTICE](NOTICE) for attribution details. Optima removes all vendor telemetry and cloud-export functionality from the original project.
