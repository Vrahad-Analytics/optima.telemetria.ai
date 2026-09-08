import { Box, Chip, Typography } from "@mui/material";
import { duration } from "moment";
import * as React from "react";
import NoQuery from "../components/NoQuery/NoQuery";
import SqlContainer from "../components/SqlContainer";
import StatusBar from "../components/StatusBar";
import { useAppSelector } from "../Hooks";
import { EnrichedSparkSQL } from "../interfaces/AppStore";
import { SqlStatus } from "../interfaces/SparkSQLs";
import { tokens } from "../theme";
import { humanizeTimeDiff } from "../utils/FormatUtils";

/**
 * Header above the plan. Its job is to say whether what you are looking at is
 * live or finished, because the graph itself looks identical either way and we
 * now keep finished plans on screen.
 */
const QueryHeader: React.FC<{ sql: EnrichedSparkSQL; idleTimeMs: number }> = ({
  sql,
  idleTimeMs,
}) => {
  const failed = sql.status === SqlStatus.Failed.valueOf();
  const running = sql.status === SqlStatus.Running.valueOf();
  const accent = failed ? tokens.error : running ? tokens.success : tokens.textMuted;
  const ago = humanizeTimeDiff(duration(Math.max(0, idleTimeMs)), true);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        px: 2,
        py: 1,
      }}
    >
      <Typography
        noWrap
        title={sql.description}
        sx={{ fontSize: "1.05rem", fontWeight: 600, color: tokens.text, minWidth: 0 }}
      >
        {sql.description}
      </Typography>
      <Chip
        size="small"
        label={running ? "Live" : failed ? `Failed · ${ago} ago` : `Finished · ${ago} ago`}
        sx={{
          flexShrink: 0,
          color: accent,
          borderColor: `${accent}66`,
          backgroundColor: "transparent",
          border: "1px solid",
          fontVariantNumeric: "tabular-nums",
        }}
      />
    </Box>
  );
};

export default function StatusTab() {
  const sql = useAppSelector((state) => state.spark.sql);
  const idleTimeMs = useAppSelector((state) => state.spark.status?.sqlIdleTime) ?? 0;

  const lastSql = sql?.sqls.length ? sql.sqls[sql.sqls.length - 1] : undefined;

  // Previously the plan was hidden as soon as Spark went idle, which meant the
  // graph vanished seconds after the query it describes finished - exactly when
  // someone would start reading it. The plan of the last query is kept up until
  // the next one starts, so there is time to understand it and act on it.
  if (lastSql === undefined) {
    return (
      <div style={{ display: "flex", height: "100%", flexDirection: "column" }}>
        <StatusBar />
        <div
          style={{
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <NoQuery />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100%", flexDirection: "column" }}>
      <StatusBar />
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <QueryHeader sql={lastSql} idleTimeMs={idleTimeMs} />
        <SqlContainer />
      </div>
    </div>
  );
}
