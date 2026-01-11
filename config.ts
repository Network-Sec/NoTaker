export interface BrowserPaths {
  windows: {
    firefox: {
      profileDir: string;
      placesSqlite: string;
      faviconsSqlite: string;
    };
    chrome: {
      userDataDir: string;
      history: string;
      bookmarks: string;
    };
  };
  wsl: {
    firefox: {
      profileDir: string;
      placesSqlite: string;
      faviconsSqlite: string;
    };
    chrome: {
      userDataDir: string;
      history: string;
      bookmarks: string;
    };
  };
}

export const browserPaths: BrowserPaths = {
  windows: {
    firefox: {
      profileDir: "%APPDATA%\\Mozilla\\Firefox\\Profiles\\", // Default profile directory, user will need to specify exact profile
      placesSqlite: "places.sqlite",
      faviconsSqlite: "favicons.sqlite",
    },
    chrome: {
      userDataDir: "%LOCALAPPDATA%\\Google\\Chrome\\User Data\\", // Default user data directory, user will need to specify exact profile
      history: "Default\\History",
      bookmarks: "Default\\Bookmarks",
    },
  },
  wsl: {
    firefox: {
      profileDir: "~/.mozilla/firefox/", // Default profile directory, user will need to specify exact profile
      placesSqlite: "places.sqlite",
      faviconsSqlite: "favicons.sqlite",
    },
    chrome: {
      userDataDir: "~/.config/google-chrome/", // Default user data directory, user will need to specify exact profile
      history: "Default/History",
      bookmarks: "Default/Bookmarks",
    },
  },
};

export const IMPORT_INTERVAL_MINUTES = 30; // Default import interval
