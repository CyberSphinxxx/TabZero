"use client";

import { useEffect } from "react";

/**
 * This callback page is no longer needed — Classroom auth now goes through
 * Firebase signInWithPopup, which handles the OAuth redirect internally.
 *
 * This page exists so existing bookmarks / redirect URIs don't 404.
 */
export default function ClassroomCallbackFallback() {
  useEffect(() => {
    window.location.href = "/";
  }, []);

  return null;
}
