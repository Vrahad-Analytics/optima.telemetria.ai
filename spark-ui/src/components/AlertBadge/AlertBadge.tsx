import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";
import { Alert, AlertTitle, styled } from "@mui/material";
import { tokens } from "../../theme";
import Tooltip, { tooltipClasses, TooltipProps } from "@mui/material/Tooltip";
import * as React from "react";
import { Alert as OptimaAlert } from "../../interfaces/AppStore";

type InfoBoxProps = {
  alert?: OptimaAlert;
  margin?: string;
  placement?:
  | "top"
  | "right"
  | "bottom"
  | "left"
  | "bottom-end"
  | "bottom-start"
  | "left-end"
  | "left-start"
  | "right-end"
  | "right-start"
  | "top-end"
  | "top-start";
};

export const TransperantTooltip = styled(
  ({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} classes={{ popper: className }} />
  ),
)(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "transparent",
  },
}));

export default function AlertBadge({ alert, margin, placement }: InfoBoxProps) {
  return alert !== undefined ? (
    <TransperantTooltip
      placement={placement ?? "top"}
      title={
        <React.Fragment>
          <Alert
            severity={alert.type}
            icon={alert.type === "warning" ? <WarningIcon /> : <ErrorIcon />}
          >
            <AlertTitle>{alert.title}</AlertTitle>
            {alert.message}
            {alert.shortSuggestion !== undefined && (
              <>
                <br />
                <b>Recommended Fix:</b>
                <br />
                {alert.shortSuggestion}
              </>
            )}
          </Alert>
        </React.Fragment>
      }
    >
      {alert.type === "warning" ? (
        <WarningIcon
          sx={{
            fontSize: 17,
            color: tokens.warning,
            position: "absolute",
            top: 6,
            right: 6,
            margin: margin ?? "0px",
          }}
        ></WarningIcon>
      ) : (
        <ErrorIcon
          sx={{
            fontSize: 17,
            color: tokens.error,
            position: "absolute",
            top: 6,
            right: 6,
            margin: margin ?? "0px",
          }}
        ></ErrorIcon>
      )}
    </TransperantTooltip>
  ) : null;
}
