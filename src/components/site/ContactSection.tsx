"use client";

// External dependencies
import { useState, type FormEvent } from "react";

// Application services & types
import type { PublicSiteContent } from "@/content/types";
import { sendContactMessage } from "@/lib/contact-client";
import { resumeDownloadProps } from "@/lib/resume";

// UI components
import { ContactScene } from "@/components/ContactScene";
import { Fade } from "@/components/Fade";
import { SocialRound } from "./SocialRound";

// Icons
import { IconDownload, IconGitHub, IconLinkedIn, IconMail } from "@/components/icons";

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-line bg-inset px-4 py-3 text-sm text-foreground transition focus-visible:border-brand/60";

/**
 * Renders the contact form, scene, and social links.
 * @example <ContactSection site={site} />
 */
export function ContactSection({ site }: { site: PublicSiteContent }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [formError, setFormError] = useState("");
  const resume = resumeDownloadProps(site.resume, site.name);

  /**
   * Submits the contact form via the API client.
   * @example onSubmit(event) // status "sent" | "error"
   */
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    setFormError("");
    const result = await sendContactMessage({
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      message: String(data.get("message") ?? ""),
      company: String(data.get("company") ?? ""),
    });
    if (!result.ok) {
      setStatus("error");
      setFormError(result.error || "Could not send your message. Please email me directly.");
      return;
    }
    form.reset();
    setStatus("sent");
  }

  return (
    <section id="contact" tabIndex={-1} aria-labelledby="contact-heading" className="py-16 sm:py-24">
      <div className="section-shell">
        <Fade y={28} duration={0.65}>
          <div className="card-surface contact-grid rounded-2xl p-6 sm:p-8">
            <div>
              <h2 id="contact-heading" className="text-3xl font-semibold text-foreground sm:text-4xl">
                Let&apos;s Work Together
              </h2>
              <p className="mt-3 text-muted">{site.contactLine}</p>
              <form
                className="relative mt-8 space-y-4"
                action="/api/contact"
                method="post"
                onSubmit={onSubmit}
              >
                <div className="sr-only" aria-hidden="true">
                  <label htmlFor="contact-company">Company</label>
                  <input
                    id="contact-company"
                    type="text"
                    name="company"
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label htmlFor="contact-name" className="text-sm font-medium text-foreground">
                    Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    name="name"
                    required
                    maxLength={100}
                    autoComplete="name"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    required
                    maxLength={254}
                    autoComplete="email"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="text-sm font-medium text-foreground">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={5}
                    required
                    maxLength={4000}
                    className={`${fieldClass} resize-none`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="btn-primary inline-flex items-center rounded-lg px-5 py-3 text-sm font-semibold text-foreground hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {status === "sending" ? "Sending…" : "Send Message"}
                </button>
                <p
                  role={status === "error" ? "alert" : "status"}
                  aria-live={status === "error" ? "assertive" : "polite"}
                  className={`text-sm ${status === "error" ? "text-red-500" : "text-muted"}`}
                >
                  {status === "sent"
                    ? "Thanks — your message is on its way."
                    : status === "error"
                      ? formError
                      : ""}
                </p>
              </form>
            </div>
            <div className="flex min-h-96 flex-col overflow-hidden rounded-xl border border-line bg-inset">
              <ContactScene />
              <div className="flex flex-1 flex-col justify-end p-6 pt-1">
                <p className="kicker text-muted-soft">Contact</p>
                <a
                  href={`mailto:${site.email}`}
                  className="mt-4 block text-foreground transition hover:text-accent-text"
                >
                  {site.email}
                </a>
                <div className="mt-6 flex items-center gap-3">
                  <SocialRound href={site.linkedin} label="LinkedIn profile">
                    <IconLinkedIn />
                  </SocialRound>
                  <SocialRound href={site.github} label="GitHub profile">
                    <IconGitHub />
                  </SocialRound>
                  <SocialRound href={`mailto:${site.email}`} label="Email contact">
                    <IconMail />
                  </SocialRound>
                </div>
                {resume ? (
                  <a
                    href={resume.href}
                    download={resume.download}
                    target={resume.target}
                    rel={resume.rel}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-chip px-5 py-3 text-sm font-semibold text-foreground transition hover:border-brand/40 hover:text-accent-text"
                  >
                    Resume
                    <IconDownload />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </Fade>
      </div>
    </section>
  );
}
