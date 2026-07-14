import type { Metadata } from "next";
import FeedbackForm from "./FeedbackForm";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "베타 피드백",
  robots: { index: false, follow: false },
};

export default async function FeedbackPage() {
  const t = await getTranslations('Feedback');
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-unjong-primary">{t('title')}</h1>
      <p className="mt-2 text-sm leading-relaxed text-unjong-muted">
        {t.rich('lead', { b: (c) => <span className="font-medium text-unjong-primary">{c}</span> })}
      </p>
      <div className="mt-6">
        <FeedbackForm />
      </div>
    </div>
  );
}
