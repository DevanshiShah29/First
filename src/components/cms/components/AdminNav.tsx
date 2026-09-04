"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import type { Screen } from "../types";
import {
  IconHome,
  IconJar,
  IconMenu,
  IconPlus,
} from "../wp-icons";

export interface MenuItem {
  id: Screen;
  label: string;
  icon: ReactNode;
  match: boolean;
}

interface AdminBarProps {
  menuOpen: boolean;
  setMenuOpen: (fn: (v: boolean) => boolean) => void;
  newOpen: boolean;
  setNewOpen: (fn: (v: boolean) => boolean) => void;
  siteName: string;
  firstName: string;
  dirty: boolean;
  status: "idle" | "saving" | "saved" | "error";
  save: () => Promise<void>;
  logout: () => Promise<void>;
  addExperience: () => void;
  addProject: () => void;
  addMemory: () => void;
}

export function AdminBar({
  menuOpen,
  setMenuOpen,
  newOpen,
  setNewOpen,
  siteName,
  firstName,
  dirty,
  status,
  save,
  logout,
  addExperience,
  addProject,
  addMemory,
}: AdminBarProps) {
  return (
    <header className="wp-bar">
      <div className="wp-bar-left">
        <button
          type="button"
          className="wp-bar-item wp-bar-fold"
          aria-label={menuOpen ? "Close admin menu" : "Open admin menu"}
          aria-expanded={menuOpen}
          aria-controls="admin-menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <IconMenu />
        </button>
        <Link href="/" className="wp-bar-item" title="View site">
          <LogoMark className="h-5 w-5" />
          <span>{siteName}</span>
        </Link>
        <Link href="/" className="wp-bar-item">
          <IconHome className="wp-menu-icon" />
          <span>Visit Site</span>
        </Link>
        <div className={`wp-drop${newOpen ? " is-open" : ""}`}>
          <button
            type="button"
            className="wp-bar-item"
            aria-haspopup="menu"
            aria-expanded={newOpen}
            aria-controls="admin-new-menu"
            onClick={() => setNewOpen((v) => !v)}
          >
            <IconPlus />
            New
          </button>
          <div id="admin-new-menu" className="wp-drop-menu" role="menu">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setNewOpen(() => false);
                addExperience();
              }}
            >
              Experience
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setNewOpen(() => false);
                addProject();
              }}
            >
              Project
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setNewOpen(() => false);
                addMemory();
              }}
            >
              Memory
            </button>
          </div>
        </div>
      </div>
      <div className="wp-bar-right">
        <button
          type="button"
          className="wp-bar-item"
          onClick={() => void save()}
          disabled={!dirty || status === "saving"}
        >
          {status === "saving" ? "Updating…" : dirty ? "Update" : "Updated"}
        </button>
        <span className="wp-bar-item">Howdy, {firstName}</span>
        <button type="button" className="wp-bar-item" onClick={() => void logout()}>
          Log Out
        </button>
      </div>
    </header>
  );
}

export function AdminMenu({
  menu,
  go,
  setMenuOpen,
}: {
  menu: MenuItem[];
  go: (screen: Screen) => void;
  setMenuOpen: (v: boolean) => void;
}) {
  return (
    <nav id="admin-menu" className="wp-menu" aria-label="Admin">
      <ul className="wp-menu-list">
        {menu.map((item) => (
          <li key={item.id} className={item.match ? "is-current" : undefined}>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                go(item.id);
              }}
              aria-current={item.match ? "page" : undefined}
            >
              {item.icon}
              {item.label}
            </button>
          </li>
        ))}
        <li className="wp-menu-sep" />
        <li>
          <Link href="/memories" target="_blank" rel="noopener noreferrer">
            <IconJar />
            Memory Jar
            <span className="sr-only"> (opens in a new tab)</span>
          </Link>
        </li>
        <li>
          <Link href="/">
            <IconHome />
            View Site
          </Link>
        </li>
      </ul>
    </nav>
  );
}
