import { Box, Typography } from "@mui/material";
import * as React from "react";
import { tokens } from "../../theme";

type EmptyStateProps = {
  icon: React.ElementType;
  title: string;
  description?: string;
  /** Tints the icon when the empty state is itself a healthy signal. */
  tone?: "neutral" | "positive";
  action?: React.ReactNode;
};

/**
 * A single empty state used across tabs. Replaces one-line Alert pills floating
 * in a large void: at dashboard scale an unexplained gap reads as "broken"
 * rather than "nothing to show", so say which of the two it is.
 */
export default function EmptyState({
  icon,
  title,
  description,
  tone = "neutral",
  action,
}: EmptyStateProps) {
  const Icon = icon;
  const iconColor = tone === "positive" ? tokens.success : tokens.textFaint;

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        px: 3,
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.border}`,
        }}
      >
        <Icon sx={{ fontSize: 24, color: iconColor }} />
      </Box>
      <Typography variant="h6" sx={{ color: tokens.text }}>
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          sx={{ color: tokens.textMuted, maxWidth: 420, lineHeight: 1.6 }}
        >
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Box>
  );
}
