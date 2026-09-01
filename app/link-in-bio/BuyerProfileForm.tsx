"use client";

import { FormEvent, useState } from "react";

const BUYER_PROFILE_ENDPOINT =
  "https://iipazmwbtctblpyszspb.supabase.co/functions/v1/headless-form-submit/hli_56fbac87cf0d4c9582e452c328823154";

type ChoiceProps = {
  id: string;
  label: string;
  options: string[];
  required?: boolean;
};

function ChoiceGroup({ id, label, options, required = false }: ChoiceProps) {
  return (
    <fieldset className="buyer-choice" data-required-choice={required ? "true" : undefined}>
      <legend>
        {label} {required ? <span aria-hidden="true">*</span> : null}
      </legend>
      <div className="buyer-choice-options">
        {options.map((option) => (
          <label key={option}>
            <input type="checkbox" name={id} value={option} />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Field({
  id,
  label,
  type = "text",
  required = false,
  placeholder,
  full = false,
}: {
  id: string;
  label: string;
  type?: "text" | "email" | "tel" | "number" | "textarea";
  required?: boolean;
  placeholder?: string;
  full?: boolean;
}) {
  const className = `buyer-field${full ? " buyer-field-full" : ""}`;
  return (
    <div className={className}>
      <label htmlFor={id}>
        {label} {required ? <span aria-hidden="true">*</span> : null}
      </label>
      {type === "textarea" ? (
        <textarea id={id} name={id} rows={5} required={required} placeholder={placeholder} />
      ) : (
        <input id={id} name={id} type={type} required={required} placeholder={placeholder} />
      )}
    </div>
  );
}

export function BuyerProfileForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");

    const missingChoice = Array.from(form.querySelectorAll<HTMLElement>('[data-required-choice="true"]')).find(
      (group) => !group.querySelector('input[type="checkbox"]:checked'),
    );
    if (missingChoice) {
      missingChoice.scrollIntoView({ behavior: "smooth", block: "center" });
      setError("Please choose at least one option for every required multiple-choice question.");
      return;
    }
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const fields: Record<string, string | string[]> = {};
    for (const [key, value] of data.entries()) {
      if (typeof value !== "string") continue;
      if (fields[key] === undefined) fields[key] = value;
      else if (Array.isArray(fields[key])) (fields[key] as string[]).push(value);
      else fields[key] = [fields[key] as string, value];
    }

    // Canonical aliases ensure Vexur creates the primary contact while retaining
    // every original GHL field id for the imported workflows and submission view.
    fields.name = String(fields.gpQbvDhNE6DSPBSrDqQq || "");
    fields.phone = String(fields.iDLUdq4OLwmt19G565r8 || "");

    setSubmitting(true);
    try {
      const response = await fetch(BUYER_PROFILE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields,
          attribution: {
            pageUrl: window.location.href,
            referrer: document.referrer || null,
          },
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) {
        throw new Error(result.message || result.error || "Submission failed");
      }
      window.location.assign("/thank-you?source=buyer-profile");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not submit the form. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <section className="buyer-profile" id="buyer-profile" aria-labelledby="buyer-profile-title">
      <div className="buyer-profile-head">
        <span className="eyebrow">Buyer profile</span>
        <h2 id="buyer-profile-title">Tell us exactly what you are looking for.</h2>
        <p>
          This is the complete Baxter &amp; Mason buyer brief. It covers both buyers, finance, budget and the property
          criteria Sally needs before starting the search.
        </p>
        <p className="buyer-required-note">Fields marked * are required.</p>
      </div>

      <form className="buyer-profile-form" onSubmit={submit} noValidate>
        <input
          className="buyer-honeypot"
          type="text"
          name="vx_company_website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        <div className="buyer-form-section">
          <h3>Primary buyer</h3>
          <div className="buyer-grid">
            <Field id="gpQbvDhNE6DSPBSrDqQq" label="Client full name" required placeholder="John or Jane Doe" />
            <Field id="iDLUdq4OLwmt19G565r8" label="Mobile" type="tel" required placeholder="+61 400 123 456" />
            <Field id="email" label="Email" type="email" required placeholder="you@example.com" />
            <Field id="mbmTQtYJgmlqXQGSGy2A" label="Residential address" required placeholder="Residential address" />
          </div>
        </div>

        <div className="buyer-form-section">
          <h3>Second buyer, if applicable</h3>
          <div className="buyer-grid">
            <Field id="uvDOmAjgOszby5h3nuZT" label="Client #2 full name" placeholder="John or Jane Doe" />
            <Field id="kMWFdRLEWKpSdopYdIt8" label="Client #2 mobile" type="tel" placeholder="+61 400 123 456" />
            <Field id="0qavqhzD8Th3DcOf0SKt" label="Client #2 email" type="email" placeholder="you@example.com" />
            <Field id="TwY0iyY0QMaqJdet4bVF" label="Client #2 residential address" placeholder="Residential address" />
          </div>
        </div>

        <div className="buyer-form-section">
          <h3>Budget and purchase</h3>
          <div className="buyer-grid">
            <Field id="5ZEKzbx3MvTi0xufOWz1" label="What is your maximum budget?" required placeholder="$700,000" />
            <ChoiceGroup id="UMyCRKNT7GhqrpDTVD0v" label="Do you have finance pre-approval?" required options={["Yes", "No"]} />
            <ChoiceGroup
              id="njQVMRpSEWRpmTkep8uq"
              label="Property to be purchased"
              required
              options={[
                "Residential House",
                "Townhouse",
                "Residential Unit/Apartment",
                "Block of Flats",
                "Vacant Land",
                "Rural Property",
                "Commercial/Other",
              ]}
            />
            <ChoiceGroup
              id="SEwPiCGkPnsR4MsOp7Ro"
              label="Type of purchase"
              required
              options={[
                "Primary place of residence",
                "Direct Investment",
                "Future Primary Place of Residence",
                "Short Term Investment",
              ]}
            />
          </div>
        </div>

        <div className="buyer-form-section">
          <h3>Examples and preferred area</h3>
          <div className="buyer-grid">
            <Field id="EtyB2c8X0pSJ7Gi94Xb6_1" label="Example property #1" required placeholder="Paste a listing URL or address" />
            <Field id="EtyB2c8X0pSJ7Gi94Xb6_2" label="Example property #2" placeholder="Paste a listing URL or address" />
            <Field id="EtyB2c8X0pSJ7Gi94Xb6_3" label="Example property #3" placeholder="Paste a listing URL or address" />
            <Field
              id="HwWExLLx3B4bV0UTl2fI"
              label="Preferred regions or suburbs"
              required
              placeholder="Noosa Heads, Buderim, Maroochydore"
            />
          </div>
        </div>

        <div className="buyer-form-section">
          <h3>Property brief</h3>
          <div className="buyer-grid buyer-grid-compact">
            <Field id="tWKHxt0hAFn1MYv4KpFG" label="Bedrooms" type="number" required placeholder="4" />
            <Field id="4VLrvBQaaYe5e1oVM1Zb" label="Bathrooms" type="number" required placeholder="2" />
            <Field id="63QBmpPwQhSlxziUoim5" label="Living areas" required placeholder="Open-plan living" />
            <Field id="n830GNA9qb9Hi15fFNNn" label="Parking" required placeholder="Double garage or carport" />
            <Field id="o2n82uBGwriM9Vugo6iH" label="Land or yard size" required placeholder="500m²" />
            <Field id="ALAf15RA6HEaz3Ld349W" label="Views" placeholder="Ocean, hinterland, bushland, not essential" />
            <Field
              id="wwu73QIH7da7FyF1fAZQ"
              label="Description"
              type="textarea"
              required
              full
              placeholder="Tell us about your ideal home, must-haves and deal breakers"
            />
          </div>
        </div>

        <div className="buyer-form-section">
          <ChoiceGroup
            id="ssXuy6XxP4ligv165l62"
            label="What are you struggling with in the property purchase journey?"
            required
            options={[
              "Time Poor",
              "Don’t know where to start",
              "Missing out due to demand",
              "Unable to attend viewings",
              "The process is stressful, complex and time-consuming",
              "Find traditional selling agents unhelpful",
              "Not confident at buying at auction",
              "Not confident at negotiating",
              "Other",
            ]}
          />
          <div className="buyer-grid">
            <Field id="bGSzSGzKjabLvhQ9dxOG" label="If other, please tell us more" full />
          </div>
        </div>

        {error ? (
          <p className="buyer-form-error" role="alert">
            {error}
          </p>
        ) : null}
        <button className="btn lg buyer-submit" type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit buyer profile"} <span className="ar">→</span>
        </button>
        <p className="buyer-privacy">
          Your information is handled according to our <a href="/privacy-statement-buyers-agent-sunshine-coast">privacy policy</a>.
        </p>
      </form>
    </section>
  );
}
