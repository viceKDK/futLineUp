window.mountPage("page-coach", React.createElement(CoachPage, null));
window.mountPage("page-league", React.createElement(LeagueWorkspace, null));
window.mountPage("page-settings", React.createElement(SettingsPage, null));
window.__FC_READY__ = true;
document.documentElement.dataset.appReady = "true";
window.dispatchEvent(new CustomEvent("fc:ready"));
//# sourceURL=src/platform-mount.jsx
