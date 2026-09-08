import QueryStatsIcon from "@mui/icons-material/QueryStats";
import React from "react";
import EmptyState from "../EmptyState/EmptyState";

const NoQuery = () => (
  <EmptyState
    icon={QueryStatsIcon}
    title="No query running"
    description="Optima is connected and listening. Run a Spark SQL query or DataFrame action and its execution plan will appear here in real time."
  />
);

export default NoQuery;
