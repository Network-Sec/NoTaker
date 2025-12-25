// config.js (CommonJS format)

const browserPaths = {
  windows: {
    firefox: {
      profileDir: "%APPDATA%\\Mozilla\\Firefox\\Profiles\\",
      placesSqlite: "places.sqlite",
      faviconsSqlite: "favicons.sqlite",
    },
    chrome: {
      userDataDir: "%LOCALAPPDATA%\\Google\\Chrome\\User Data\\",
      profileNames: ["Default", "Guest Profile", "Profile 1", "Profile 2", "Profile 3", "Profile 5", "Profile 6", "System Profile"],
    },
  },
  wsl: {
    firefox: {
      profileDir: "~/.mozilla/firefox/",
      placesSqlite: "places.sqlite",
      faviconsSqlite: "favicons.sqlite",
    },
    chrome: {
      userDataDir: "~/.config/google-chrome/",
      profileNames: ["Default", "Guest Profile", "Profile 1", "Profile 2", "Profile 3", "Profile 5", "Profile 6", "System Profile"],
    },
  },
};

const IMPORT_INTERVAL_MINUTES = 30;

module.exports = {
  browserPaths,
  IMPORT_INTERVAL_MINUTES,
};
