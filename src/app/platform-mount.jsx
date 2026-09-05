window.mountPage("page-coach", <CoachPage />);
window.mountPage("page-league", <LeagueWorkspace />);
window.mountPage("page-settings", <SettingsPage />);
window.__FC_READY__ = true;
document.documentElement.dataset.appReady = "true";
window.dispatchEvent(new CustomEvent("fc:ready"));
