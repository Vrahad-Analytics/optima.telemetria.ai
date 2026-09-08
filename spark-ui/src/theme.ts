import { alpha, createTheme } from "@mui/material/styles";

/**
 * Optima design tokens.
 *
 * Dark-first, tuned for long observability sessions: a near-black slate ground,
 * one confident accent, and hairline borders instead of heavy elevation shadows
 * so dense tables stay legible.
 */
export const tokens = {
  // Surfaces, darkest to lightest
  bg: "#0F1419",
  surface: "#171D26",
  surfaceRaised: "#1C242F",
  surfaceHover: "#212B38",
  border: "#232B36",
  borderStrong: "#2E3845",

  // Text
  text: "#E6EDF3",
  textMuted: "#8B98A5",
  textFaint: "#5C6873",

  // Accent + state
  accent: "#3B82F6",
  accentHover: "#60A5FA",
  accentQuiet: "#1E3A5F",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#38BDF8",
} as const;

/** Numerics should never shift width as values tick. */
export const monoFontStack =
  '"SFMono-Regular", "JetBrains Mono", Menlo, Consolas, "Liberation Mono", monospace';

const uiFontStack = [
  "Inter",
  "-apple-system",
  "BlinkMacSystemFont",
  '"Segoe UI"',
  "Roboto",
  '"Helvetica Neue"',
  "Arial",
  "sans-serif",
].join(",");

const theme = createTheme({
  palette: {
    mode: "dark",
    background: { default: tokens.bg, paper: tokens.surface },
    primary: { main: tokens.accent, light: tokens.accentHover, dark: "#2563EB" },
    secondary: { main: "#14B8A6" },
    success: { main: tokens.success },
    warning: { main: tokens.warning },
    error: { main: tokens.error },
    info: { main: tokens.info },
    text: {
      primary: tokens.text,
      secondary: tokens.textMuted,
      disabled: tokens.textFaint,
    },
    divider: tokens.border,
  },

  shape: { borderRadius: 8 },

  typography: {
    fontFamily: uiFontStack,
    // Tightened headings: this is a dashboard, not a marketing page.
    h1: { fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.02em" },
    h2: { fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.02em" },
    h3: { fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.01em" },
    h4: { fontSize: "1.125rem", fontWeight: 600, letterSpacing: "-0.01em" },
    h5: { fontSize: "1rem", fontWeight: 600 },
    h6: { fontSize: "0.9375rem", fontWeight: 600 },
    subtitle1: { fontSize: "0.875rem", fontWeight: 500 },
    subtitle2: { fontSize: "0.8125rem", fontWeight: 500, color: tokens.textMuted },
    body1: { fontSize: "0.875rem" },
    body2: { fontSize: "0.8125rem" },
    caption: { fontSize: "0.75rem", color: tokens.textMuted },
    button: { textTransform: "none", fontWeight: 500 },
    // Section labels above cards and table groups.
    overline: {
      fontSize: "0.6875rem",
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: tokens.textMuted,
    },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "*, *::before, *::after": { boxSizing: "border-box" },
        body: {
          backgroundColor: tokens.bg,
          color: tokens.text,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          scrollbarColor: `${tokens.borderStrong} transparent`,
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            backgroundColor: "transparent",
            width: "10px",
            height: "10px",
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 8,
            backgroundColor: tokens.borderStrong,
            border: "2px solid transparent",
            backgroundClip: "content-box",
          },
          "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover":
            { backgroundColor: "#3D4A5A" },
          "&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner": {
            backgroundColor: "transparent",
          },
        },
        // Numeric cells line up column-wise.
        ".tabular": {
          fontFamily: monoFontStack,
          fontVariantNumeric: "tabular-nums",
        },
      },
    },

    // Flat surfaces with hairline borders read better than stacked shadows.
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.border}`,
        },
        outlined: { borderColor: tokens.border },
      },
    },

    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.border}`,
          borderRadius: 10,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: { padding: 16, "&:last-child": { paddingBottom: 16 } },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: tokens.surface,
          borderRight: `1px solid ${tokens.border}`,
          backgroundImage: "none",
        },
      },
    },

    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: tokens.surface,
          borderBottom: `1px solid ${tokens.border}`,
          backgroundImage: "none",
        },
      },
    },

    // Selected nav item gets an accent rail rather than a filled block.
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          marginInline: 8,
          paddingBlock: 8,
          color: tokens.textMuted,
          "& .MuiListItemIcon-root": { color: "inherit" },
          "&:hover": { backgroundColor: tokens.surfaceHover, color: tokens.text },
          "&.Mui-selected": {
            backgroundColor: alpha(tokens.accent, 0.14),
            color: tokens.text,
            "& .MuiListItemIcon-root": { color: tokens.accent },
            "&:hover": { backgroundColor: alpha(tokens.accent, 0.2) },
          },
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: { fontSize: "0.875rem", fontWeight: 500 },
      },
    },

    MuiDivider: { styleOverrides: { root: { borderColor: tokens.border } } },

    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${tokens.border}`,
          fontSize: "0.8125rem",
          padding: "10px 14px",
        },
        head: {
          backgroundColor: tokens.surfaceRaised,
          color: tokens.textMuted,
          fontWeight: 600,
          fontSize: "0.6875rem",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": { backgroundColor: tokens.surfaceHover },
          "&:last-child td": { borderBottom: 0 },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500, fontSize: "0.75rem", height: 22 },
        outlined: { borderColor: tokens.borderStrong },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, paddingInline: 14 },
        outlined: {
          borderColor: tokens.borderStrong,
          color: tokens.text,
          "&:hover": {
            borderColor: tokens.accent,
            backgroundColor: alpha(tokens.accent, 0.08),
          },
        },
        text: { color: tokens.textMuted, "&:hover": { color: tokens.text } },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          color: tokens.textMuted,
          borderRadius: 8,
          "&:hover": { color: tokens.text, backgroundColor: tokens.surfaceHover },
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 40, borderBottom: `1px solid ${tokens.border}` },
        indicator: { height: 2, borderRadius: 2 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 40,
          fontSize: "0.8125rem",
          fontWeight: 500,
          color: tokens.textMuted,
          "&.Mui-selected": { color: tokens.text },
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: tokens.surfaceRaised,
          border: `1px solid ${tokens.borderStrong}`,
          color: tokens.text,
          fontSize: "0.75rem",
          borderRadius: 6,
          padding: "6px 10px",
        },
        arrow: { color: tokens.surfaceRaised },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: { border: `1px solid ${tokens.border}`, borderRadius: 8 },
        standardError: { backgroundColor: alpha(tokens.error, 0.12) },
        standardWarning: { backgroundColor: alpha(tokens.warning, 0.12) },
        standardSuccess: { backgroundColor: alpha(tokens.success, 0.12) },
        standardInfo: { backgroundColor: alpha(tokens.info, 0.12) },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: { height: 6, borderRadius: 3, backgroundColor: tokens.border },
        bar: { borderRadius: 3 },
      },
    },

    MuiAccordion: {
      defaultProps: { elevation: 0, disableGutters: true },
      styleOverrides: {
        root: {
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.border}`,
          borderRadius: 10,
          "&:before": { display: "none" },
          "&.Mui-expanded": { margin: 0 },
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.borderStrong}`,
          borderRadius: 12,
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.bg,
          "& fieldset": { borderColor: tokens.border },
          "&:hover fieldset": { borderColor: tokens.borderStrong },
        },
        input: { fontSize: "0.875rem" },
      },
    },

    MuiLink: {
      styleOverrides: {
        root: {
          color: tokens.accent,
          textDecorationColor: alpha(tokens.accent, 0.4),
          "&:hover": { color: tokens.accentHover },
        },
      },
    },
  },
});

export default theme;
