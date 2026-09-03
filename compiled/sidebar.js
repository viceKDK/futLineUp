function SidebarFooter() {
  const [profile] = window.useStore("profile", window.DEFAULT_PROFILE);
  const [matches] = window.useStore("matches", []);
  const name = profile.displayName?.trim() || "Invitado";
  const roleLabel = profile.experience === "coach" ? "Entrenador" : profile.experience === "league" ? "Liga" : "Capitán";
  const matchLabel = `${matches.length} partido${matches.length === 1 ? "" : "s"}`;
  return React.createElement("button", {
    className: "sidebar-profile-btn",
    onClick: () => window.go("settings"),
    title: "Cuenta y datos"
  }, React.createElement("div", {
    className: "avatar-me"
  }, window.initials(name)), React.createElement("div", null, React.createElement("div", {
    className: "me-name"
  }, name), React.createElement("div", {
    className: "me-sub"
  }, roleLabel, " \xB7 ", matchLabel)));
}
window.mountPage("sidebar-footer", React.createElement(SidebarFooter, null));
//# sourceURL=src/sidebar.jsx
