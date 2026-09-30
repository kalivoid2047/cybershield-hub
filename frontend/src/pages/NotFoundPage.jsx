import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import Button from "../components/common/Button.jsx";
import SceneBackground from "../components/common/SceneBackground.jsx";
import Shield3D from "../components/three/Shield3D.jsx";
import usePageTitle from "../hooks/usePageTitle.js";

export default function NotFoundPage() {
  usePageTitle("Page not found");
  return (
    <main id="main-content" className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <SceneBackground />
      <section className="glass-panel relative z-10 w-full max-w-md rounded-3xl p-8 text-center">
        <div className="flex justify-center">
          <Shield3D size={170} />
        </div>
        <Compass className="mx-auto h-6 w-6 text-cyanx" aria-hidden="true" />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-cyanx">Error 404</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">The page you are looking for does not exist, or you may not have access to it.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button as={Link} to="/">
            Go to dashboard
          </Button>
          <Button variant="secondary" onClick={() => window.history.back()}>
            Go back
          </Button>
        </div>
      </section>
    </main>
  );
}
