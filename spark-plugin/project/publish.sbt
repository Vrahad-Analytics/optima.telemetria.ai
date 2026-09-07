// sbt 1.11+ has built-in Sonatype Central Portal support (localStaging / sonaUpload / sonaRelease),
// so the sbt-sonatype plugin is no longer required.
addSbtPlugin("com.github.sbt" % "sbt-pgp" % "2.3.2")
addSbtPlugin("com.github.sbt" % "sbt-git" % "2.1.0")
addSbtPlugin("com.github.sbt" % "sbt-ci-release" % "1.12.1")
addSbtPlugin("com.eed3si9n" % "sbt-assembly" % "2.1.5")
