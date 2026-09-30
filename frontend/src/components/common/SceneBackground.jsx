// Fixed, non-interactive backdrop: drifting colour orbs for the glass to refract,
// and a perspective grid floor that scrolls toward the viewer.
export default function SceneBackground() {
  return (
    <div className="scene" aria-hidden="true">
      <div className="scene-orb animate-drift" style={{ width: 520, height: 520, left: "-8%", top: "-12%", background: "radial-gradient(circle, #2dd4ff, transparent 68%)" }} />
      <div className="scene-orb animate-drift" style={{ width: 460, height: 460, right: "-6%", top: "6%", background: "radial-gradient(circle, #8b7bff, transparent 68%)", animationDelay: "-9s" }} />
      <div className="scene-orb animate-drift" style={{ width: 420, height: 420, left: "34%", bottom: "-14%", background: "radial-gradient(circle, #2ee59d, transparent 70%)", opacity: 0.32, animationDelay: "-17s" }} />
      <div className="scene-floor">
        <div className="animate-floor-scroll" />
      </div>
    </div>
  );
}
