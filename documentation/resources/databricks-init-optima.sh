#!/bin/bash
#
# Cluster-scoped init script that installs Optima on a Databricks cluster.
#
# Optima cannot be installed as a Databricks Maven library: spark.plugins is read
# while the driver JVM starts, and Databricks installs cluster libraries only
# after that, so the plugin class is not on the classpath yet and the driver
# fails with ClassNotFoundException. The jar therefore has to be dropped into
# /databricks/jars and the config written into the driver defaults from here.
#
# Upload this file to a Unity Catalog volume or to /Workspace, then add it under
# Compute > your cluster > Edit > Advanced > Init scripts.
set -euo pipefail

OPTIMA_VERSION="0.1.1"

# Pick the coordinate matching your Databricks Runtime. Getting this wrong is the
# most common failure, so check Compute > cluster > Configuration for the DBR.
#
#   DBR 17.3 LTS and up    Spark 4.0, Scala 2.13   optima-spark4-databricks_2.13
#   DBR 13.3 - 16.4 LTS    Spark 3.x, Scala 2.12   optima-spark_2.12
#   DBR 16.4 LTS (Scala 2.13 variant)              optima-spark_2.13
OPTIMA_ARTIFACT="optima-spark4-databricks_2.13"

JAR="${OPTIMA_ARTIFACT}-${OPTIMA_VERSION}.jar"
URL="https://repo1.maven.org/maven2/ai/telemetria/${OPTIMA_ARTIFACT}/${OPTIMA_VERSION}/${JAR}"
DRIVER_CONF="/databricks/driver/conf/00-custom-spark-driver-defaults.conf"

mkdir -p /databricks/jars/
# --fail so a wrong coordinate fails the cluster here with an HTTP error, rather
# than silently saving Maven's 404 page as a .jar and failing later at startup.
curl --fail --silent --show-error --location \
  --output "/databricks/jars/${JAR}" "${URL}"

if [[ "${DB_IS_DRIVER:-}" == "TRUE" ]]; then
  mkdir -p /mnt/driver-daemon/jars/
  cp "/databricks/jars/${JAR}" "/mnt/driver-daemon/jars/${JAR}"

  # Appended, not overwritten: other init scripts may add their own [driver]
  # block to this file and HOCON merges them.
  cat >> "${DRIVER_CONF}" <<EOF
[driver] {
  "spark.plugins" = "io.telemetria.optima.SparkOptimaPlugin"
}
EOF
fi
