"use client";

import React, { useState, useEffect } from "react";
import { useKeyboardShortcuts } from "@/lib/useKeyboardShortcuts";
import KeyboardShortcutsModal from "@/components/ui/KeyboardShortcutsModal";

export default function KeyboardShortcutsProvider() {
  const [showHelp, setShowHelp] = useState(false);
  
  useKeyboardShortcuts();

  useEffect(() => {
    const handleHelp = () => setShowHelp(true);
    window.addEventListener("scalle:help", handleHelp);
    return () => window.removeEventListener("scalle:help", handleHelp);
  }, []);

  return (
    <>
      {showHelp && <KeyboardShortcutsModal onClose={() => setShowHelp(false)} />}
    </>
  );
}
