import { proposals } from "./proposals";

const STATUS_LABEL: Record<string, string> = {
  idea: "아이디어",
  ready: "착수 가능",
  "in-progress": "진행중",
  done: "완료",
};

export default function AdminInsightsPage() {
  return (
    <main className="admin">
      <header className="admin-header">
        <h1>AI 제안 — 더 나은 관리를 위한 기록</h1>
        <p>
          지금 당장 하지 않아도, 나중에 시간을 내서 한 번에 검토할 수 있도록 정리해둔 개선 아이디어입니다.
          각 항목에 왜 필요한지, 어떤 효과가 있는지, 어떻게 구현하는지를 기록해 두었습니다.
        </p>
      </header>

      <div className="admin-proposal-list">
        {proposals.map((proposal) => (
          <article key={proposal.id} className="admin-card admin-proposal">
            <div className="admin-proposal-head">
              <h2>{proposal.title}</h2>
              <div className="admin-proposal-tags">
                <span className={`admin-badge admin-proposal-status-${proposal.status}`}>{STATUS_LABEL[proposal.status]}</span>
                <span className="admin-badge">공수 {proposal.effort}</span>
                <span className="admin-badge">효과 {proposal.impact}</span>
              </div>
            </div>

            <p className="admin-proposal-summary">{proposal.summary}</p>

            <div className="admin-proposal-section">
              <h3>어떤 장점이 있나요</h3>
              <ul>
                {proposal.benefits.map((b) => <li key={b}>{b}</li>)}
              </ul>
            </div>

            <div className="admin-proposal-section">
              <h3>어떻게 동작하나요</h3>
              <p>{proposal.howItWorks}</p>
            </div>

            <div className="admin-proposal-section">
              <h3>진행 단계</h3>
              <ol>
                {proposal.steps.map((s) => <li key={s}>{s}</li>)}
              </ol>
            </div>

            {proposal.caveats && proposal.caveats.length > 0 && (
              <div className="admin-proposal-section admin-proposal-caveats">
                <h3>참고 · 주의할 점</h3>
                <ul>
                  {proposal.caveats.map((c) => <li key={c}>{c}</li>)}
                </ul>
              </div>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
