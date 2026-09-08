import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LaunchIcon from "@mui/icons-material/Launch";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  Paper,
  Typography,
} from "@mui/material";
import { Stack } from "@mui/system";
import React, { FC, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../Hooks";
import EmptyState from "../components/EmptyState/EmptyState";
import { tokens } from "../theme";

interface GroupedAlerts {
  [alertName: string]: {
    title: string;
    alerts: any[];
    errorCount: number;
    warningCount: number;
  };
}

export const AlertsTab: FC<{}> = (): JSX.Element => {
  const alerts = useAppSelector((state) => state.spark.alerts);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  // Group alerts by name
  const groupedAlerts = useMemo(() => {
    if (!alerts?.alerts) return {};

    const grouped: GroupedAlerts = {};

    alerts.alerts.forEach((alert) => {
      if (!grouped[alert.name]) {
        grouped[alert.name] = {
          title: alert.title,
          alerts: [],
          errorCount: 0,
          warningCount: 0,
        };
      }

      grouped[alert.name].alerts.push(alert);
      if (alert.type === "error") {
        grouped[alert.name].errorCount++;
      } else {
        grouped[alert.name].warningCount++;
      }
    });

    return grouped;
  }, [alerts]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  const handleGoToAlert = (alert: any) => {
    if (alert.source.type === "sql") {
      // Navigate to summary with sqlId and nodeId
      navigate(`/summary?sqlid=${alert.source.sqlId}&nodeids=${alert.source.sqlNodeId}`);
    } else if (alert.source.type === "stage") {
      // Navigate to summary with sqlId and stageId for stage-based alerts
      navigate(`/summary?sqlid=${alert.source.sqlId}&stageId=${alert.source.stageId}`);
    } else {
      // Navigate to resources for status alerts
      navigate("/resources");
    }
  };

  const totalErrors = alerts?.alerts.filter(
    (alert) => alert.type === "error",
  ).length;
  const totalWarnings = alerts?.alerts.filter(
    (alert) => alert.type === "warning",
  ).length;

  if (alerts?.alerts.length === 0) {
    return (
      <EmptyState
        icon={CheckCircleOutlineIcon}
        tone="positive"
        title="No alerts"
        description="Optima found nothing worth flagging in this run. Alerts appear here when it detects skew, spill, idle cores, memory pressure or failing tasks."
      />
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Summary header: compact counts. A zero count should not command a
          full-width coloured banner, so severity is carried by a small dot and
          the numeral rather than a background wash. */}
      <Box sx={{ px: 2, pt: 2, pb: 1, display: "flex", gap: 1.5 }}>
        {[
          { label: "Errors", value: totalErrors ?? 0, color: tokens.error },
          { label: "Warnings", value: totalWarnings ?? 0, color: tokens.warning },
        ].map(({ label, value, color }) => (
          <Paper
            key={label}
            sx={{
              px: 2,
              py: 1.25,
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              minWidth: 148,
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                flexShrink: 0,
                backgroundColor: value > 0 ? color : tokens.textFaint,
              }}
            />
            <Typography variant="overline" sx={{ lineHeight: 1 }}>
              {label}
            </Typography>
            <Typography
              sx={{
                ml: "auto",
                fontSize: "1.125rem",
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                color: value > 0 ? color : tokens.textMuted,
              }}
            >
              {value}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Alert Groups Section */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          padding: 2,
        }}
      >
        <Stack spacing={2}>
          {Object.entries(groupedAlerts).map(([alertName, groupData]) => {
            const isExpanded = expandedGroups.has(alertName);
            const totalCount = groupData.errorCount + groupData.warningCount;

            return (
              <Paper
                key={alertName}
                elevation={2}
                sx={{
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                {/* Group Header */}
                <Box
                  onClick={() => toggleGroup(alertName)}
                  sx={{
                    cursor: "pointer",
                    padding: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "background.paper",
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {groupData.errorCount > 0 ? (
                      <ErrorOutlineIcon color="error" sx={{ fontSize: 28 }} />
                    ) : (
                      <WarningAmberIcon color="warning" sx={{ fontSize: 28 }} />
                    )}
                    <Box>
                      <Typography variant="h6" fontWeight="600">
                        {groupData.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontStyle: "italic" }}
                      >
                        {alertName}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    {groupData.errorCount > 0 && (
                      <Chip
                        size="small"
                        label={`${groupData.errorCount} error${groupData.errorCount !== 1 ? "s" : ""
                          }`}
                        color="error"
                        variant="outlined"
                      />
                    )}
                    {groupData.warningCount > 0 && (
                      <Chip
                        size="small"
                        label={`${groupData.warningCount} warning${groupData.warningCount !== 1 ? "s" : ""
                          }`}
                        color="warning"
                        variant="outlined"
                      />
                    )}
                    {isExpanded ? (
                      <ExpandLessIcon sx={{ fontSize: 28 }} />
                    ) : (
                      <ExpandMoreIcon sx={{ fontSize: 28 }} />
                    )}
                  </Box>
                </Box>

                {/* Expanded Alert Details */}
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <Divider />
                  <Box sx={{ padding: 2, backgroundColor: "background.default" }}>
                    <Stack spacing={2}>
                      {groupData.alerts.map((alert) => (
                        <Alert
                          key={alert.id}
                          severity={alert.type}
                          sx={{
                            "& .MuiAlert-message": {
                              width: "100%",
                            },
                          }}
                        >
                          <AlertTitle sx={{ fontWeight: "600" }}>
                            {alert.title}
                          </AlertTitle>
                          <Typography
                            variant="body2"
                            sx={{
                              whiteSpace: "pre-wrap",
                              mb: 1,
                            }}
                          >
                            {alert.message}
                          </Typography>
                          <Divider sx={{ my: 1 }} />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              fontStyle: "italic",
                              mb: 1,
                            }}
                          >
                            📍 {alert.location}
                          </Typography>
                          <Box
                            sx={{
                              backgroundColor: "action.hover",
                              padding: 1.5,
                              borderRadius: 1,
                              borderLeft: "3px solid",
                              borderColor:
                                alert.type === "error"
                                  ? "error.main"
                                  : "warning.main",
                              mb: 1.5,
                            }}
                          >
                            <Typography
                              variant="body2"
                              fontWeight="600"
                              gutterBottom
                            >
                              💡 Suggestions:
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {alert.suggestion}
                            </Typography>
                          </Box>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<LaunchIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGoToAlert(alert);
                            }}
                            sx={{
                              textTransform: "none",
                              fontWeight: "600",
                            }}
                          >
                            Go to Alert
                          </Button>
                        </Alert>
                      ))}
                    </Stack>
                  </Box>
                </Collapse>
              </Paper>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
};
