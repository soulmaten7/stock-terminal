import type { Metadata } from "next";
import FeedbackForm from "./FeedbackForm";

export const metadata: Metadata = {
  title: "베타 피드백",
  robots: { index: false, follow: false },
};

export default function FeedbackPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-unjong-primary">베타 피드백</h1>
      <p className="mt-2 text-sm leading-relaxed text-unjong-muted">
        솔직할수록 좋아요. 좋은 말보다{" "}
        <span className="font-medium text-unjong-primary">어색한 것·안 되는 것·이해 안 되는 것</span>이 트릴리언을 다듬는 데 제일 큰 도움이 됩니다. 2~3분이면 돼요.
      </p>
      <div className="mt-6">
        <FeedbackForm />
      </div>
    </div>
  );
}
