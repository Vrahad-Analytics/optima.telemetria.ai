// POM metadata required by Maven Central (Sonatype Central Portal).
// The publishing mechanism itself is sbt's built-in Central Portal support
// (see `publishTo` in build.sbt); no sbt-sonatype plugin settings are needed.

ThisBuild / publishMavenStyle := true

// Declares how version numbers should be compared for binary-compatibility checks.
ThisBuild / versionScheme := Some("early-semver")

ThisBuild / licenses := Seq("APL2" -> url("http://www.apache.org/licenses/LICENSE-2.0.txt"))

ThisBuild / description := "Optima by Telemetria - open source performance monitoring for Apache Spark"

ThisBuild / homepage := Some(url("https://github.com/Vrahad-Analytics/optima.telemetria.ai"))

ThisBuild / scmInfo := Some(
  ScmInfo(
    url("https://github.com/Vrahad-Analytics/optima.telemetria.ai"),
    "scm:git@github.com:Vrahad-Analytics/optima.telemetria.ai.git"
  )
)

ThisBuild / developers := List(
  Developer(
    id = "vrahad-analytics",
    name = "Vrahad Analytics",
    email = "ardb40@gmail.com",
    url = url("https://github.com/Vrahad-Analytics")
  )
)
