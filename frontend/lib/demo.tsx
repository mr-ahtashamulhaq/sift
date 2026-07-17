import { createContext, useContext, useState, useEffect } from "react";

interface DemoCtx {
  demo: boolean;
  toggle: () => void;
}

const Ctx = createContext<DemoCtx>({ demo: false, toggle: () => {} });

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    try {
      const urlDemo = typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("demo") === "true";
      const stored = localStorage.getItem("sb_demo") === "1";
      if (urlDemo) {
        localStorage.setItem("sb_demo", "1");
        setDemo(true);
      } else {
        setDemo(stored);
      }
    } catch {}
  }, []);

  function toggle() {
    setDemo(prev => {
      const next = !prev;
      try { localStorage.setItem("sb_demo", next ? "1" : "0"); } catch {}
      return next;
    });
  }

  return <Ctx.Provider value={{ demo, toggle }}>{children}</Ctx.Provider>;
}

export function useDemo() {
  return useContext(Ctx);
}
