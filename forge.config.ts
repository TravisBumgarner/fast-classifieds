import { MakerDeb } from '@electron-forge/maker-deb'
import { MakerDMG } from '@electron-forge/maker-dmg'
import { MakerRpm } from '@electron-forge/maker-rpm'
import { MakerSquirrel } from '@electron-forge/maker-squirrel'
import { MakerZIP } from '@electron-forge/maker-zip'
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives'
import { VitePlugin } from '@electron-forge/plugin-vite'
import type { ForgeConfig } from '@electron-forge/shared-types'
import { z } from 'zod'

const safeConfig = z.object({
  APPLE_ID: z.email(),
  APPLE_PASSWORD: z.string().min(1),
  APPLE_TEAM_ID: z.string().min(1),
  GITHUB_TOKEN: z.string().min(1),
})

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    //"You have set packagerConfig.ignore, the Electron Forge Vite plugin normally sets this automatically."
    // This is expected. Error can be ignored.
    // https://github.com/electron/forge/issues/3738#issuecomment-2692534953
    ignore: [],
    icon: './src/assets/icon',
    extraResource: ['./drizzle'],
    osxSign:
      process.env.SHOULD_APPLE_SIGN === '1'
        ? {
            optionsForFile: () => {
              return {
                hardenedRuntime: true,
                entitlements: 'entitlements.plist',
              }
            },
          }
        : undefined,
  },

  rebuildConfig: {},
  makers: [
    // Will only build for os X on when run on os X.
    new MakerSquirrel({}),
    new MakerDMG({}),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  plugins: [
    ...(process.env.SHOULD_APPLE_SIGN === '1' ? [new AutoUnpackNativesPlugin({})] : []),
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/main/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    // Commented out temporarily due to plugin conflict with VitePlugin
    // new FusesPlugin({
    //   version: FuseVersion.V1,
    //   [FuseV1Options.RunAsNode]: false,
    //   [FuseV1Options.EnableCookieEncryption]: true,
    //   [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    //   [FuseV1Options.EnableNodeCliInspectArguments]: false,
    //   [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
    //   [FuseV1Options.OnlyLoadAppFromAsar]: true,
    // }),
  ],
  hooks: {
    postPackage: async (_forgeConfig, options: { outputPaths: string[]; platform: string; arch: string }) => {
      if (options.platform === 'darwin' && process.env.SHOULD_APPLE_SIGN === '1') {
        const { notarize } = await import('@electron/notarize')
        const appPath = `${options.outputPaths[0]}/Fast Classifieds.app`

        const safeConfigParsed = safeConfig.parse({
          APPLE_ID: process.env.APPLE_ID,
          APPLE_PASSWORD: process.env.APPLE_PASSWORD,
          APPLE_TEAM_ID: process.env.APPLE_TEAM_ID,
          GITHUB_TOKEN: process.env.GITHUB_TOKEN,
        })

        await notarize({
          appPath,
          appleId: safeConfigParsed.APPLE_ID,
          appleIdPassword: safeConfigParsed.APPLE_PASSWORD,
          teamId: safeConfigParsed.APPLE_TEAM_ID,
        })
      }
    },
  },
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: { owner: 'travisbumgarner', name: 'fast-classifieds' },
        prerelease: false,
        draft: true,
      },
    },
  ],
}

export default config
