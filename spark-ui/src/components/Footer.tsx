import GitHubIcon from "@mui/icons-material/GitHub";
import StarIcon from "@mui/icons-material/Star";
import { Box, Button, Typography } from "@mui/material";
import * as React from "react";

export default function Footer() {
    const onGitHubClick = (): void => {
        window.open("https://github.com/Vrahad-Analytics/optima.telemetria.ai", "_blank");
    };

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 2.5,
                py: 0.5,
                px: 2,
                backgroundColor: "rgba(0, 0, 0, 0.1)",
                borderTop: 1,
                borderColor: "divider",
                minHeight: "40px"
            }}
        >
            <Button
                onClick={onGitHubClick}
                color="inherit"
                size="small"
                startIcon={<StarIcon />}
                endIcon={<GitHubIcon />}
                sx={{ fontSize: "11px", textTransform: "none" }}
            >
                Give us a star at GitHub
            </Button>

            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75
                }}
            >
                <Typography variant="body2" sx={{ fontSize: "11px", fontWeight: "bold" }}>
                    Powered by
                </Typography>
                <img
                    src="./logo.png"
                    alt="Optima"
                    style={{ height: "14px", width: "auto" }}
                />
            </Box>
        </Box>
    );
}
