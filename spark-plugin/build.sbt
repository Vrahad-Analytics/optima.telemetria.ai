import sbtassembly.AssemblyPlugin.autoImport._

// Base version for SNAPSHOT builds only; releases take their version from the git tag.
lazy val versionNum: String = "0.1.0"
lazy val scala212 = "2.12.20"
lazy val scala213 = "2.13.16"
lazy val supportedScalaVersions = List(scala212, scala213)

// Version and publish target are build-wide. publishTo MUST be at ThisBuild scope:
// `localStaging` resolves per-scope, and the Central Portal expects every module of
// the release staged into ONE bundle directory. Scoping it per-project would scatter
// artifacts across <module>/target/sona-staging and sonaUpload would miss them.
ThisBuild / version := {
  // A v-prefixed git tag on HEAD drives the released version: v0.2.0 publishes 0.2.0.
  // Untagged commits publish `versionNum` as a snapshot. This means the tag is the
  // single source of truth for a release - bumping versionNum alone does nothing,
  // and tagging does not silently republish a stale hardcoded number.
  git.gitCurrentTags.value.filter(_.startsWith("v")).sorted.lastOption match {
    case Some(tag) => tag.stripPrefix("v")
    case None      => versionNum + "-SNAPSHOT"
  }
}

ThisBuild / publishTo := {
  // Deliberately not isSnapshot.value: sbt-dynver (pulled in by sbt-ci-release) sets
  // that independently of the version defined above, which can desync the two.
  if ((ThisBuild / version).value.endsWith("-SNAPSHOT"))
    Some("central-snapshots" at "https://central.sonatype.com/repository/maven-snapshots/")
  else
    localStaging.value
}

lazy val optima = project
  .in(file("."))
  .aggregate(
    plugin,
    pluginspark3,
    pluginspark4,
    pluginspark4databricks,
    example_3_1_3,
    example_3_2_4,
    example_3_3_3,
    example_3_4_1,
    example_3_5_1,
    example_3_4_1_remote,
    example_4_0_1
  ).settings(
    crossScalaVersions := Nil, // Aggregate project version must be Nil, see docs: https://www.scala-sbt.org/1.x/docs/Cross-Build.html
    publish / skip := true
  )

lazy val plugin = (project in file("plugin"))
  .settings(
    name := "optima-spark-common",
    organization := "ai.telemetria",
    scalaVersion := scala212,
    crossScalaVersions := supportedScalaVersions,
    libraryDependencies += "org.apache.spark" %% "spark-core" % "3.5.1" % "provided",
    libraryDependencies += "org.apache.spark" %% "spark-sql" % "3.5.1"  % "provided",
    libraryDependencies += "org.apache.iceberg" %% "iceberg-spark-runtime-3.5" % "1.5.0" % "provided",
    libraryDependencies += "io.delta" %% "delta-spark" % "3.2.0" % "provided",
    libraryDependencies += "org.scalatest" %% "scalatest" % "3.2.17" % Test
  )

lazy val pluginspark3 = (project in file("pluginspark3"))
  .enablePlugins(AssemblyPlugin)
  .settings(
    name := "optima-spark",
    organization := "ai.telemetria",
    scalaVersion := scala212,
    crossScalaVersions := supportedScalaVersions,
    libraryDependencies += "org.apache.spark" %% "spark-core" % "3.5.1" % "provided",
    libraryDependencies += "org.apache.spark" %% "spark-sql" % "3.5.1"  % "provided",
    libraryDependencies += "org.apache.iceberg" %% "iceberg-spark-runtime-3.5" % "1.5.0" % "provided",
    libraryDependencies += "io.delta" %% "delta-spark" % "3.2.0" % "provided",
    
    // Assembly configuration to create fat JAR with common code
    assembly / assemblyJarName := s"${name.value}_${scalaBinaryVersion.value}-${version.value}.jar",
    // Exclude Scala library from assembly - Spark provides its own Scala runtime
    assembly / assemblyOption := (assembly / assemblyOption).value.withIncludeScala(false),
    assembly / assemblyMergeStrategy := {
      case PathList("META-INF", "services", xs @ _*) => MergeStrategy.concat
      case PathList("META-INF", xs @ _*) => MergeStrategy.discard
      case "application.conf" => MergeStrategy.concat
      case "reference.conf" => MergeStrategy.concat
      case _ => MergeStrategy.first
    },
    
    // Publish the assembled JAR instead of the regular JAR
    Compile / packageBin := assembly.value,
    
    // Include source from plugin directory for self-contained build
    Compile / unmanagedSourceDirectories += (plugin / Compile / sourceDirectory).value / "scala",
    
    // Include resources from plugin directory for static UI files
    Compile / unmanagedResourceDirectories += (plugin / Compile / resourceDirectory).value,
    libraryDependencies += "org.scalatest" %% "scalatest-funsuite"      % "3.2.17" % Test,
    libraryDependencies += "org.scalatest" %% "scalatest-shouldmatchers" % "3.2.17" % Test,
    libraryDependencies += "org.apache.spark" %% "spark-core" % "3.5.1" % Test,
    libraryDependencies += "org.apache.spark" %% "spark-sql"  % "3.5.1" % Test,

    // Include source and resources from plugin directory for tests
    Test / unmanagedSourceDirectories += (plugin / Compile / sourceDirectory).value / "scala",

    // Fork JVM for tests so javaOptions are applied; required for Spark on Java 9+
    Test / fork := true,
    // Run test suites sequentially — parallel suites share the SparkSession via getOrCreate()
    // and one suite stopping the session causes NPEs in concurrently-running suites
    Test / parallelExecution := false,
    Test / javaOptions ++= {
      // --add-opens is not supported on Java 8 (spec version starts with "1.")
      if (sys.props("java.specification.version").startsWith("1.")) Seq.empty
      else Seq(
        "--add-opens=java.base/java.lang=ALL-UNNAMED",
        "--add-opens=java.base/java.nio=ALL-UNNAMED",
        "--add-opens=java.base/sun.nio.ch=ALL-UNNAMED",
        "--add-opens=java.base/java.util=ALL-UNNAMED",
        "--add-opens=java.base/java.io=ALL-UNNAMED",
      )
    },
  )

lazy val pluginspark4 = (project in file("pluginspark4"))
  .enablePlugins(AssemblyPlugin)
  .settings(
    name := "optima-spark4",
    organization := "ai.telemetria",
    scalaVersion := scala213,
    crossScalaVersions := List(scala213), // Only Scala 2.13 for Spark 4.x
    libraryDependencies += "org.apache.spark" %% "spark-core" % "4.0.1" % "provided",
    libraryDependencies += "org.apache.spark" %% "spark-sql" % "4.0.1"  % "provided",
    libraryDependencies += "org.apache.iceberg" %% "iceberg-spark-runtime-3.5" % "1.5.0" % "provided",
    libraryDependencies += "io.delta" %% "delta-spark" % "3.2.0" % "provided",

    // Assembly configuration to create fat JAR with common code
    assembly / assemblyJarName := s"${name.value}_${scalaBinaryVersion.value}-${version.value}.jar",
    // Exclude Scala library from assembly - Spark provides its own Scala runtime
    assembly / assemblyOption := (assembly / assemblyOption).value.withIncludeScala(false),
    assembly / assemblyMergeStrategy := {
      case PathList("META-INF", "services", xs @ _*) => MergeStrategy.concat
      case PathList("META-INF", xs @ _*) => MergeStrategy.discard
      case "application.conf" => MergeStrategy.concat
      case "reference.conf" => MergeStrategy.concat
      case _ => MergeStrategy.first
    },
    
    // Publish the assembled JAR instead of the regular JAR
    Compile / packageBin := assembly.value,
    
    // Include source from plugin directory for self-contained build
    Compile / unmanagedSourceDirectories += (plugin / Compile / sourceDirectory).value / "scala",

    // Include resources from plugin directory for static UI files
    Compile / unmanagedResourceDirectories += (plugin / Compile / resourceDirectory).value,

    // Test dependencies — Spark 4.0.1 + scalatest. Mirrors pluginspark3 so we can run the
    // same regression suites against the Spark 4 surface (cross-version validation).
    // Requires the launching JVM to be Java 17+ since Spark 4 won't run on Java 8/11.
    libraryDependencies += "org.scalatest" %% "scalatest-funsuite"       % "3.2.17" % Test,
    libraryDependencies += "org.scalatest" %% "scalatest-shouldmatchers" % "3.2.17" % Test,
    libraryDependencies += "org.apache.spark" %% "spark-core" % "4.0.1" % Test,
    libraryDependencies += "org.apache.spark" %% "spark-sql"  % "4.0.1" % Test,

    // Share version-portable test sources with pluginspark3. Most pluginspark3 specs
    // depend on Spark-3-only internals (Dataset constructor, PythonMapInArrowExec, etc.)
    // and don't compile against Spark 4, so we explicitly include only the suites that
    // exercise version-stable surface area.
    Test / unmanagedSourceDirectories += (plugin / Compile / sourceDirectory).value / "scala",
    Test / unmanagedSources ++= {
      val pluginspark3Tests = (pluginspark3 / Test / sourceDirectory).value / "scala"
      Seq(
        pluginspark3Tests / "org" / "apache" / "spark" / "optima" / "OptimaCodegenFallbackSpec.scala"
      )
    },

    // Fork JVM for tests; Spark on Java 9+ requires the same --add-opens as pluginspark3.
    Test / fork := true,
    Test / parallelExecution := false,
    Test / javaOptions ++= {
      if (sys.props("java.specification.version").startsWith("1.")) Seq.empty
      else Seq(
        "--add-opens=java.base/java.lang=ALL-UNNAMED",
        "--add-opens=java.base/java.nio=ALL-UNNAMED",
        "--add-opens=java.base/sun.nio.ch=ALL-UNNAMED",
        "--add-opens=java.base/java.util=ALL-UNNAMED",
        "--add-opens=java.base/java.io=ALL-UNNAMED",
      )
    }
  )

lazy val pluginspark4databricks = (project in file("pluginspark4databricks"))
  .enablePlugins(AssemblyPlugin)
  .settings(
    name := "optima-spark4-databricks",
    organization := "ai.telemetria",
    scalaVersion := scala213,
    crossScalaVersions := List(scala213), // Only Scala 2.13 for Spark 4.x
    libraryDependencies += "org.apache.spark" %% "spark-core" % "4.0.1" % "provided",
    libraryDependencies += "org.apache.spark" %% "spark-sql" % "4.0.1"  % "provided",
    libraryDependencies += "org.apache.iceberg" %% "iceberg-spark-runtime-3.5" % "1.5.0" % "provided",
    libraryDependencies += "io.delta" %% "delta-spark" % "3.2.0" % "provided",

    // Source-share with pluginspark4 + plugin so we don't duplicate code.
    Compile / unmanagedSourceDirectories += (pluginspark4 / Compile / sourceDirectory).value / "scala",
    Compile / unmanagedSourceDirectories += (plugin / Compile / sourceDirectory).value / "scala",
    Compile / unmanagedResourceDirectories += (plugin / Compile / resourceDirectory).value,

    // Drop the upstream OptimaSparkUILoader so our local copy (which uses
    // Spark4DatabricksPageFactory) is the one compiled.
    Compile / unmanagedSources / excludeFilter := {
      val upstreamLoader = (pluginspark4 / Compile / sourceDirectory).value /
        "scala" / "org" / "apache" / "spark" / "optima" / "OptimaSparkUILoader.scala"
      new sbt.io.SimpleFileFilter(_.getCanonicalPath == upstreamLoader.getCanonicalPath)
    },

    assembly / assemblyJarName := s"${name.value}_${scalaBinaryVersion.value}-${version.value}.jar",
    assembly / assemblyOption := (assembly / assemblyOption).value.withIncludeScala(false),
    // Rewrite jakarta.servlet → javax.servlet in our bytecode so the artifact
    // loads on Databricks Runtime 17.3, which ships javax instead of jakarta.
    assembly / assemblyShadeRules := Seq(
      ShadeRule.rename("jakarta.servlet.**" -> "javax.servlet.@1").inAll
    ),
    assembly / assemblyMergeStrategy := {
      case PathList("META-INF", "services", xs @ _*) => MergeStrategy.concat
      case PathList("META-INF", xs @ _*) => MergeStrategy.discard
      case "application.conf" => MergeStrategy.concat
      case "reference.conf" => MergeStrategy.concat
      case _ => MergeStrategy.first
    },

    Compile / packageBin := assembly.value
  )

lazy val example_3_1_3 = (project in file("example_3_1_3"))
  .settings(
    name := "OptimaSparkExample313",
    organization := "ai.telemetria",
    crossScalaVersions := List(scala212),
    libraryDependencies += "org.apache.spark" %% "spark-core" % "3.1.3",
    libraryDependencies += "org.apache.spark" %% "spark-sql" % "3.1.3",
    publish / skip := true
  ).dependsOn(pluginspark3)

lazy val example_3_2_4 = (project in file("example_3_2_4"))
  .settings(
    name := "OptimaSparkExample324",
    organization := "ai.telemetria",
    crossScalaVersions := supportedScalaVersions,
    libraryDependencies += "org.apache.spark" %% "spark-core" % "3.2.4",
    libraryDependencies += "org.apache.spark" %% "spark-sql" % "3.2.4",
    publish / skip := true
  ).dependsOn(pluginspark3)

lazy val example_3_3_3 = (project in file("example_3_3_3"))
  .settings(
    name := "OptimaSparkExample333",
    organization := "ai.telemetria",
    crossScalaVersions := List(scala212),
    libraryDependencies += "org.apache.spark" %% "spark-core" % "3.3.3",
    libraryDependencies += "org.apache.spark" %% "spark-sql" % "3.3.3",
    libraryDependencies += "org.apache.iceberg" %% "iceberg-spark-runtime-3.3" % "1.5.0",
    libraryDependencies += "org.scala-lang.modules" %% "scala-collection-compat" % "2.11.0",
    publish / skip := true
  ).dependsOn(pluginspark3)

lazy val example_3_4_1 = (project in file("example_3_4_1"))
  .settings(
    name := "OptimaSparkExample341",
    organization := "ai.telemetria",
    crossScalaVersions := supportedScalaVersions,
    libraryDependencies += "org.apache.spark" %% "spark-core" % "3.4.1",
    libraryDependencies += "org.apache.spark" %% "spark-sql" % "3.4.1",
    libraryDependencies += "org.apache.iceberg" %% "iceberg-spark-runtime-3.4" % "1.5.0",
    publish / skip := true
  ).dependsOn(pluginspark3)

lazy val example_3_5_1 = (project in file("example_3_5_1"))
  .settings(
    name := "OptimaSparkExample351",
    organization := "ai.telemetria",
    crossScalaVersions := supportedScalaVersions,
    libraryDependencies += "org.apache.spark" %% "spark-core" % "3.5.7",
    libraryDependencies += "org.apache.spark" %% "spark-sql" % "3.5.7",
    libraryDependencies += "org.apache.spark" %% "spark-streaming" % "3.5.1",
    libraryDependencies += "org.apache.spark" %% "spark-sql-kafka-0-10" % "3.5.1",
    libraryDependencies += "io.delta" %% "delta-spark" % "3.2.0",
    libraryDependencies += "org.apache.iceberg" %% "iceberg-spark-runtime-3.5" % "1.5.0",
    libraryDependencies += "org.scala-lang.modules" %% "scala-collection-compat" % "2.11.0",
    libraryDependencies += "org.scalatest" %% "scalatest" % "3.2.17",
    libraryDependencies += "org.apache.datafusion" % "comet-spark-spark3.5_2.12" % "0.4.0",
    libraryDependencies += "com.h2database" % "h2" % "2.2.224",
    publish / skip := true
  ).dependsOn(pluginspark3)

lazy val example_3_4_1_remote = (project in file("example_3_4_1_remote"))
  .settings(
      name := "OptimaSparkExample341Remote",
      organization := "ai.telemetria",
    crossScalaVersions := supportedScalaVersions,
      libraryDependencies += "org.apache.spark" %% "spark-core" % "3.4.1",
      libraryDependencies += "org.apache.spark" %% "spark-sql" % "3.4.1",

    publish / skip := true
  ).dependsOn()

lazy val example_4_0_1 = (project in file("example_4_0_1"))
  .settings(
    name := "OptimaSparkExample401",
    organization := "ai.telemetria",
    scalaVersion := scala213,
    crossScalaVersions := List(scala213), // Only Scala 2.13 for Spark 4.x
    // there is no scala 2.12 version so we need to force 2.13 to make it compile
    libraryDependencies += "org.apache.spark" % "spark-core_2.13" % "4.0.1",
    libraryDependencies += "org.apache.spark" % "spark-sql_2.13" % "4.0.1",
    publish / skip := true
  ).dependsOn(pluginspark4)
