"use client";
import { useEffect } from "react";
import { useAuth } from "@/store/auth";

export function AuthInitializer() {
  const { initialize } = useAuth();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return null;
}