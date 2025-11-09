import { MakerDMG } from '@electron-forge/maker-dmg'
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives'
import { VitePlugin } from '@electron-forge/plugin-vite'
import type { ForgeConfig } from '@electron-forge/shared-types'

// import { FusesPlugin } from "@electron-forge/plugin-fuses";
// import { FuseV1Options, FuseVersion } from "@electron/fuses";

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    //"You have set packagerConfig.ignore, the Electron Forge Vite plugin normally sets this automatically."
    // This is expected. Error can be ignored.
    // https://github.com/electron/forge/issues/3738#issuecomment-2692534953
    ignore: [],
    icon: './src/assets/icon',
    extraResource: ['./drizzle'],
    osxSign: {},
    osxNotarize: {
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    },
  },

  rebuildConfig: {},
  makers: [
    // new MakerSquirrel({}),
    new MakerDMG({}),
    // new MakerZIP({}, ['darwin']),
    // new MakerRpm({}),
    // new MakerDeb({}),
  ],
  plugins: [
    ...(process.env.NODE_ENV === 'production'
      ? [new AutoUnpackNativesPlugin({})]
      : []),
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
