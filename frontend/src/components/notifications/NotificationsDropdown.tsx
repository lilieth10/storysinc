"use client";
import { useState, useRef, useEffect } from "react";
import { NotificationsBadge } from "./NotificationsBadge";
import { NotificationsList } from "./NotificationsList";

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        className="focus:outline-none"
        aria-label="Ver notificaciones"
        onClick={() => setOpen((v) => !v)}
        tabIndex={0}
      >
        <NotificationsBadge />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-96 max-w-full z-50 bg-white rounded-xl shadow-lg border border-gray-200 animate-fade-in">
          <NotificationsList />
        </div>
      )}
    </div>
  );
}
