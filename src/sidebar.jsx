// Pie del sidebar — nombre y stats reales en vez de datos fijos
function SidebarFooter() {
  const [profile] = window.useStore('profile', window.DEFAULT_PROFILE);
  const [matches] = window.useStore('matches', []);
  const name = profile.displayName?.trim() || 'Invitado';
  const roleLabel = profile.experience === 'coach' ? 'Entrenador' : profile.experience === 'league' ? 'Liga' : 'Capitán';
  const matchLabel = `${matches.length} partido${matches.length === 1 ? '' : 's'}`;
  return (
    <>
      <div className="avatar-me">{window.initials(name)}</div>
      <div>
        <div className="me-name">{name}</div>
        <div className="me-sub">{roleLabel} · {matchLabel}</div>
      </div>
    </>
  );
}
ReactDOM.createRoot(document.getElementById("sidebar-footer")).render(<SidebarFooter />);
