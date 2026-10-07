import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { env } from '../config/env';

const DESKTOP_VERSION = '0.1.0';

export const getDownloads = asyncHandler(async (_req: Request, res: Response) => {
  const base = env.DOWNLOAD_BASE_URL.replace(/\/$/, '');
  const version = env.DESKTOP_AGENT_VERSION || DESKTOP_VERSION;

  const platforms = {
    windows: {
      name: 'Windows',
      file: 'chronos-agent-setup.exe',
      url: env.DOWNLOAD_URL_WINDOWS || `${base}/chronos-agent-setup.exe`,
      version: '10 or later',
      arch: '64-bit',
      size: '~8 MB',
    },
    macos: {
      name: 'macOS',
      file: 'chronos-agent.dmg',
      url: env.DOWNLOAD_URL_MACOS || `${base}/chronos-agent.dmg`,
      version: '12 Monterey+',
      arch: 'Apple Silicon & Intel',
      size: '~9 MB',
    },
    linux: {
      name: 'Linux',
      file: 'chronos-agent.AppImage',
      url: env.DOWNLOAD_URL_LINUX || `${base}/chronos-agent.AppImage`,
      version: 'Ubuntu 20.04+',
      arch: 'AppImage',
      size: '~9 MB',
    },
  };

  res.json({
    success: true,
    data: {
      version,
      platforms,
      mobile: {
        ios: {
          name: 'iOS',
          url: env.MOBILE_IOS_URL || '',
          note: 'Install via TestFlight or App Store when published',
        },
        android: {
          name: 'Android',
          url: env.MOBILE_ANDROID_URL || '',
          note: 'APK or Play Store when published',
        },
      },
    },
  });
});
