import { Box, Grid, Paper, Tooltip, Typography } from "@mui/material";
import * as React from "react";
import { Alert as OptimaAlert } from "../../interfaces/AppStore";
import { tokens } from "../../theme";
import AlertBadge from "../AlertBadge/AlertBadge";
import styles from "./InfoBox.module.css";

type InfoBoxProps = {
  title: string;
  text: string;
  /**
   * Legacy per-metric colour. Deliberately ignored for the label: colour is
   * reserved for state (alerts), so a wall of metrics reads as one system
   * rather than a rainbow. Kept in the signature so callers need no changes.
   */
  color?: string;
  icon: React.ElementType;
  tooltipContent?: JSX.Element;
  alert?: OptimaAlert;
};

export const ConditionalWrapper = ({
  condition,
  wrapper,
  children,
}: {
  condition: boolean;
  wrapper: (children: JSX.Element) => JSX.Element;
  children: JSX.Element;
}) => (condition ? wrapper(children) : children);

export default function InfoBox({
  title,
  text,
  icon,
  tooltipContent,
  alert,
}: InfoBoxProps) {
  const Icon = icon;
  const [blink, setBlink] = React.useState(false);

  React.useEffect(() => {
    setBlink(true);
    const timer = setTimeout(() => setBlink(false), 500);
    return () => clearTimeout(timer);
  }, [text]);

  // Only an active alert earns colour.
  const accent =
    alert?.type === "error"
      ? tokens.error
      : alert?.type === "warning"
        ? tokens.warning
        : undefined;

  return (
    <Grid item lg={2}>
      <Box position="relative">
        <ConditionalWrapper
          condition={tooltipContent !== undefined}
          wrapper={(children) => <Tooltip title={tooltipContent}>{children}</Tooltip>}
        >
          <Paper
            sx={{
              px: 2,
              py: 1.75,
              height: 92,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
              transition: "border-color 140ms ease, background-color 140ms ease",
              borderColor: accent ? `${accent}66` : tokens.border,
              "&:hover": {
                borderColor: accent ?? tokens.borderStrong,
                backgroundColor: tokens.surfaceRaised,
              },
              // Alert state reads as a left rail rather than a coloured label.
              ...(accent && {
                "&::before": {
                  content: '""',
                  position: "absolute",
                  insetBlock: 0,
                  left: 0,
                  width: 2,
                  backgroundColor: accent,
                },
              }),
            }}
          >
            <Box display="flex" alignItems="center" gap={0.75} minWidth={0}>
              <Icon sx={{ fontSize: 15, color: tokens.textFaint, flexShrink: 0 }} />
              <Typography variant="overline" noWrap lineHeight={1.4} title={title}>
                {title}
              </Typography>
            </Box>
            <Typography
              className={blink ? styles.blink : ""}
              noWrap
              sx={{
                fontSize: "1.5rem",
                fontWeight: 600,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                fontVariantNumeric: "tabular-nums",
                color: accent ?? tokens.text,
              }}
            >
              {text}
            </Typography>
          </Paper>
        </ConditionalWrapper>
        <AlertBadge alert={alert} />
      </Box>
    </Grid>
  );
}
