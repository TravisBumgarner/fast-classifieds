import { useMediaQuery } from '@mui/material'
import CssBaseline from '@mui/material/CssBaseline'
import { createTheme, responsiveFontSizes, type ThemeOptions, ThemeProvider } from '@mui/material/styles'
import { useMemo } from 'react'
import { FONT_SIZES, PALETTE, SPACING } from './consts'

export const TAB_HEIGHT = '36px' // for some reason all are needed.

// Base theme options shared between light and dark
const getThemeOptions = (isDark: boolean): ThemeOptions => {
  const colors = {
    background: isDark ? PALETTE.grayscale[900] : PALETTE.named.white,
    surface: isDark ? PALETTE.grayscale[800] : PALETTE.named.white,
    text: {
      primary: isDark ? PALETTE.grayscale[100] : PALETTE.grayscale[800],
      secondary: isDark ? PALETTE.grayscale[300] : PALETTE.grayscale[600],
      tertiary: isDark ? PALETTE.grayscale[400] : PALETTE.grayscale[700],
    },
    border: {
      light: isDark ? PALETTE.grayscale[700] : PALETTE.grayscale[200],
      medium: isDark ? PALETTE.grayscale[600] : PALETTE.grayscale[300],
      dark: isDark ? PALETTE.grayscale[500] : PALETTE.grayscale[400],
    },
    hover: {
      light: isDark ? PALETTE.grayscale[800] : PALETTE.grayscale[100],
      medium: isDark ? PALETTE.grayscale[700] : PALETTE.grayscale[50],
    },
  }

  return {
    typography: {
      h1: {
        fontSize: FONT_SIZES.HUGE.PX,
        fontWeight: 900,
      },
      h2: {
        fontSize: FONT_SIZES.LARGE.PX,
        fontWeight: 900,
      },
      h3: {
        fontSize: FONT_SIZES.MEDIUM.PX,
        fontWeight: 900,
      },
      body1: {
        fontSize: FONT_SIZES.MEDIUM.PX,
        padding: `${SPACING.TINY.PX} 0px`,
      },
      body2: {
        fontSize: FONT_SIZES.SMALL.PX,
        padding: `${SPACING.TINY.PX} 0px`,
      },
    },
    palette: {
      mode: isDark ? 'dark' : 'light',
      background: {
        default: colors.background,
        paper: colors.surface,
      },
      text: {
        primary: colors.text.primary,
        secondary: colors.text.secondary,
      },
    },
    components: {
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            overflow: 'hidden',
            height: '100%',
            padding: 0,
            margin: 0,
          },
          body: {
            padding: 0,
            margin: 0,
            overflow: 'hidden',
            height: '100%',
            backgroundColor: colors.background,
            color: colors.text.primary,
          },
          '#root': {
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            boxShadow: isDark ? `0 2px 8px rgba(0, 0, 0, 0.3)` : `0 2px 8px ${PALETTE.grayscale[200]}`,
            borderRadius: SPACING.SMALL.PX,
            backgroundColor: colors.surface,
            maxHeight: '100%',
            overflow: 'auto',
          },
        },
      },
      MuiTable: {
        styleOverrides: {
          root: {
            borderCollapse: 'separate',
            borderSpacing: 0,
            border: `1px solid ${colors.border.light}`,
            borderRadius: SPACING.SMALL.PX,
            backgroundColor: colors.surface,
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: colors.hover.medium,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderTop: `1px solid ${colors.border.light}`,
            borderBottom: '0px',
            fontSize: FONT_SIZES.SMALL.PX,
            color: colors.text.primary,
            padding: SPACING.TINY.PX,
          },
          head: {
            backgroundColor: colors.hover.medium,
            fontWeight: 600,
            color: colors.text.primary,
            borderBottom: `2px solid ${colors.border.medium}`,
            position: 'sticky',
            top: 0,
            zIndex: 10,
          },
          body: {
            color: colors.text.tertiary,
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:last-child td': {
              borderBottom: 'none',
            },
          },
        },
      },
      MuiTablePagination: {
        styleOverrides: {
          root: {
            borderTop: `1px solid ${colors.border.light}`,
            backgroundColor: colors.surface,
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: SPACING.TINY.PX,
            textTransform: 'none',
            fontWeight: 500,
          },
          outlined: {
            borderColor: colors.border.medium,
            color: colors.text.primary,
            '&:hover': {
              borderColor: PALETTE.primary[500],
              backgroundColor: isDark ? PALETTE.primary[900] : PALETTE.primary[50],
              color: PALETTE.primary[isDark ? 300 : 700],
            },
          },
          contained: {
            backgroundColor: PALETTE.primary[500],
            color: PALETTE.named.white,
            '&:hover': {
              backgroundColor: PALETTE.primary[600],
            },
            '&:disabled': {
              backgroundColor: colors.border.light,
              color: colors.text.secondary,
            },
          },
          text: {
            color: colors.text.tertiary,
            '&:hover': {
              backgroundColor: colors.hover.light,
              color: colors.text.primary,
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: colors.surface,
              '& fieldset': {
                borderColor: colors.border.medium,
              },
              '&:hover fieldset': {
                borderColor: colors.border.dark,
              },
              '&.Mui-focused fieldset': {
                borderColor: PALETTE.primary[500],
              },
            },
            '& .MuiInputLabel-root': {
              color: colors.text.secondary,
              '&.Mui-focused': {
                color: PALETTE.primary[500],
              },
            },
            '& .MuiInputBase-input': {
              color: colors.text.primary,
            },
          },
        },
      },
      MuiAutocomplete: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: colors.surface,
            },
          },
          listbox: {
            backgroundColor: colors.surface,
            '& .MuiAutocomplete-option': {
              color: colors.text.primary,
              '&:hover': {
                backgroundColor: colors.hover.light,
              },
              '&.Mui-focused': {
                backgroundColor: isDark ? PALETTE.primary[800] : PALETTE.primary[100],
              },
            },
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            color: colors.text.primary,
          },
          h1: {
            color: colors.text.primary,
          },
          h2: {
            color: colors.text.primary,
          },
          h3: {
            color: colors.text.primary,
          },
          body2: {
            color: colors.text.secondary,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: colors.text.secondary,
            '&:hover': {
              backgroundColor: colors.hover.light,
              color: colors.text.primary,
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? PALETTE.grayscale[700] : PALETTE.grayscale[800],
            color: isDark ? PALETTE.grayscale[100] : PALETTE.named.white,
            fontSize: FONT_SIZES.SMALL.PX,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: colors.surface,
            color: colors.text.primary,
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            color: PALETTE.primary[isDark ? 200 : 700],
            textDecoration: 'none',
            '&:hover': {
              color: PALETTE.primary[isDark ? 300 : 700],
              textDecoration: 'underline',
            },
            '&:visited': {
              color: PALETTE.primary[isDark ? 500 : 700],
            },
            '&:active': {
              color: PALETTE.primary[isDark ? 200 : 800],
            },
          },
        },
      },
    },
  }
}

// Create light and dark themes
const lightTheme = createTheme(getThemeOptions(false))
const darkTheme = createTheme(getThemeOptions(true))

// Apply responsive font sizes
const lightThemeWithResponsiveFonts = responsiveFontSizes(lightTheme)
const darkThemeWithResponsiveFonts = responsiveFontSizes(darkTheme)

const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')

  const theme = useMemo(
    () => (prefersDarkMode ? darkThemeWithResponsiveFonts : lightThemeWithResponsiveFonts),
    [prefersDarkMode],
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}

// Export themes for external use
export { darkThemeWithResponsiveFonts as darkTheme, lightThemeWithResponsiveFonts as lightTheme }

export default AppThemeProvider
