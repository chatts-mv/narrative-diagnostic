/**
 * NarrativePlayback — Unwrapped-style 5-card stepper for friction results.
 * Card 0: Hero Stat, Card 1: Friction Profile, Card 2: Time Split,
 * Card 3: Peak Friction, Card 4: Closer.
 */
import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";

const BAR_COLORS = ["#4A5FF7", "#F59E0B", "#818CF8", "#F87171"];
const CARD_BGS = ["#F5F3FF", "#EEF2FF", "#FFFBEB", "#FEF2F2", "#F0FDF4"];

function ProgressDots({ current, total }) {
  return (
    <div style={{
      display: "flex",
      gap: 6,
      justifyContent: "center",
      padding: "20px 0 12px",
    }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`uw-dot ${i === current ? "uw-dot-active" : ""}`}
        />
      ))}
    </div>
  );
}

function CardWrapper({ bg, children, animKey }) {
  return (
    <div
      key={animKey}
      style={{
        background: bg,
        borderRadius: 20,
        padding: "40px 28px",
        minHeight: 400,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
}

function Eyebrow({ children, animClass }) {
  return (
    <div
      className={animClass}
      style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "1.5px",
        color: "#9CA3AF",
        marginBottom: 20,
      }}
    >
      {children}
    </div>
  );
}

// ── Card 0: Hero Stat ──
function HeroStatCard({ results }) {
  const hoursPerYear = (results.estimatedWeeklyHoursLost || 10) * 52;
  const daysPerYear = Math.round(hoursPerYear / 8);

  return (
    <CardWrapper bg={CARD_BGS[0]} animKey="hero">
      <Eyebrow animClass="uw-card-fi uw-card-fi-1">Your Real Week</Eyebrow>
      <div
        className="uw-card-fi uw-card-fi-2"
        style={{
          fontSize: 72,
          fontWeight: 800,
          color: "#4A5FF7",
          lineHeight: 1,
          fontFamily: "'Google Sans', sans-serif",
        }}
      >
        {daysPerYear}
      </div>
      <div
        className="uw-card-fi uw-card-fi-3"
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: "#374151",
          marginTop: 4,
        }}
      >
        working days
      </div>
      <div
        className="uw-card-fi uw-card-fi-4"
        style={{
          fontSize: 15,
          color: "#6B7280",
          marginTop: 8,
          maxWidth: 300,
        }}
      >
        lost to friction in the last 12 months
      </div>
      {results.heroContext && (
        <div
          className="uw-card-fi uw-card-fi-5"
          style={{
            fontSize: 13,
            color: "#9CA3AF",
            fontStyle: "italic",
            marginTop: 20,
            maxWidth: 340,
            lineHeight: 1.5,
          }}
        >
          {results.heroContext}
        </div>
      )}
    </CardWrapper>
  );
}

// ── Card 1: Friction Profile ──
function FrictionProfileCard({ results }) {
  const arch = results.frictionArchetype || {
    name: "The Friction Fighter",
    description: "Your work pattern shows significant time lost to process overhead.",
    tags: ["Process gaps", "Communication", "Tool switching"],
  };

  return (
    <CardWrapper bg={CARD_BGS[1]} animKey="profile">
      <Eyebrow animClass="uw-card-fi uw-card-fi-1">Your Friction Profile</Eyebrow>

      {/* Icon badge */}
      <div
        className="uw-card-fi uw-card-fi-2"
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #4A5FF7, #7B61FF)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
          fontSize: 28,
          color: "#fff",
        }}
      >
        ⚡
      </div>

      {/* Archetype name */}
      <div
        className="uw-card-fi uw-card-fi-3"
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: "#1A1A1A",
          fontFamily: "'Google Sans', sans-serif",
          marginBottom: 12,
        }}
      >
        {arch.name}
      </div>

      {/* Description */}
      <p
        className="uw-card-fi uw-card-fi-4"
        style={{
          fontSize: 14,
          color: "#6B7280",
          lineHeight: 1.6,
          maxWidth: 380,
          margin: "0 0 20px",
        }}
      >
        {arch.description}
      </p>

      {/* Tags */}
      <div
        className="uw-card-fi uw-card-fi-5"
        style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}
      >
        {(arch.tags || []).map((tag, i) => (
          <span key={i} className="uw-tag">{tag}</span>
        ))}
      </div>
    </CardWrapper>
  );
}

// ── Card 2: Time Split ──
function TimeSplitCard({ results }) {
  const breakdown = results.frictionBreakdown || [
    { category: "Communication", percentage: 40 },
    { category: "Process gaps", percentage: 30 },
    { category: "Rework", percentage: 20 },
    { category: "Other", percentage: 10 },
  ];
  const topCategory = breakdown[0];

  return (
    <CardWrapper bg={CARD_BGS[2]} animKey="time">
      <Eyebrow animClass="uw-card-fi uw-card-fi-1">Where Your Time Goes</Eyebrow>

      {topCategory && (
        <div
          className="uw-card-fi uw-card-fi-2"
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#374151",
            marginBottom: 28,
            maxWidth: 380,
            lineHeight: 1.4,
          }}
        >
          Most of your friction lives in{" "}
          <span style={{ color: "#4A5FF7" }}>{topCategory.category.toLowerCase()}</span>
        </div>
      )}

      {/* Horizontal bar chart */}
      <div
        className="uw-card-fi uw-card-fi-3"
        style={{ width: "100%", maxWidth: 420 }}
      >
        {breakdown.map((item, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 4,
              fontSize: 13,
              fontWeight: 500,
              color: "#374151",
            }}>
              <span>{item.category}</span>
              <span style={{ fontWeight: 700, color: BAR_COLORS[i] || "#6B7280" }}>
                {item.percentage}%
              </span>
            </div>
            <div style={{
              width: "100%",
              height: 28,
              background: "#F3F4F6",
              borderRadius: 6,
              overflow: "hidden",
            }}>
              <div
                className="uw-bar"
                style={{
                  width: `${item.percentage}%`,
                  background: BAR_COLORS[i] || "#6B7280",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        className="uw-card-fi uw-card-fi-4"
        style={{
          fontSize: 11,
          color: "#9CA3AF",
          marginTop: 16,
          fontStyle: "italic",
        }}
      >
        Based on your diagnostic responses
      </div>
    </CardWrapper>
  );
}

// ── Card 3: Peak Friction ──
function PeakFrictionCard({ results }) {
  const peak = results.peakFriction || {
    area: "Collaboration overhead",
    stat: "+50%",
    statLabel: "more time lost vs. solo work",
    comparison: "Your friction in this area is notably above average.",
  };

  return (
    <CardWrapper bg={CARD_BGS[3]} animKey="peak">
      <Eyebrow animClass="uw-card-fi uw-card-fi-1">Your Friction Peaks In</Eyebrow>

      <div
        className="uw-card-fi uw-card-fi-2"
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#1A1A1A",
          marginBottom: 20,
          fontFamily: "'Google Sans', sans-serif",
        }}
      >
        {peak.area}
      </div>

      {/* Big stat */}
      <div
        className="uw-card-fi uw-card-fi-3"
        style={{
          fontSize: 56,
          fontWeight: 800,
          color: "#DC2626",
          lineHeight: 1,
          fontFamily: "'Google Sans', sans-serif",
        }}
      >
        {peak.stat}
      </div>
      <div
        className="uw-card-fi uw-card-fi-4"
        style={{
          fontSize: 14,
          color: "#6B7280",
          marginTop: 8,
          maxWidth: 300,
        }}
      >
        {peak.statLabel}
      </div>

      {/* Comparison box */}
      {peak.comparison && (
        <div
          className="uw-card-fi uw-card-fi-5"
          style={{
            marginTop: 24,
            padding: "14px 20px",
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #FECACA",
            fontSize: 13,
            color: "#6B7280",
            lineHeight: 1.5,
            maxWidth: 360,
          }}
        >
          {peak.comparison}
        </div>
      )}
    </CardWrapper>
  );
}

// ── Card 4: Closer ──
function CloserCard({ results, onReset, onReview }) {
  const daysPerYear = Math.round((results.estimatedWeeklyHoursLost || 10) * 52 / 8);
  const topBreakdown = results.frictionBreakdown?.[0];
  const archName = results.frictionArchetype?.name || "Friction Aware";

  return (
    <CardWrapper bg={CARD_BGS[4]} animKey="closer">
      {/* Badge */}
      <div
        className="uw-card-fi uw-card-fi-1"
        style={{
          display: "inline-block",
          padding: "6px 16px",
          background: "rgba(74, 95, 247, 0.08)",
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 600,
          color: "#4A5FF7",
          marginBottom: 20,
        }}
      >
        Friction aware · 2026
      </div>

      {/* Closing statement */}
      <div
        className="uw-card-fi uw-card-fi-2"
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: "#1A1A1A",
          lineHeight: 1.4,
          maxWidth: 400,
          marginBottom: 28,
          fontFamily: "'Google Sans', sans-serif",
        }}
      >
        {results.closingStatement || "You've taken the first step toward reclaiming your time. That's where real change begins."}
      </div>

      {/* Summary stat grid */}
      <div
        className="uw-card-fi uw-card-fi-3"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          width: "100%",
          maxWidth: 400,
          marginBottom: 28,
        }}
      >
        <div style={{
          background: "#fff",
          borderRadius: 12,
          padding: "14px 10px",
          border: "1px solid #E5E7EB",
        }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#4A5FF7" }}>{daysPerYear}</div>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>days lost/yr</div>
        </div>
        <div style={{
          background: "#fff",
          borderRadius: 12,
          padding: "14px 10px",
          border: "1px solid #E5E7EB",
        }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#F59E0B" }}>
            {topBreakdown ? `${topBreakdown.percentage}%` : "—"}
          </div>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
            {topBreakdown ? topBreakdown.category.split(" ")[0].toLowerCase() : "top area"}
          </div>
        </div>
        <div style={{
          background: "#fff",
          borderRadius: 12,
          padding: "14px 10px",
          border: "1px solid #E5E7EB",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#7C3AED", lineHeight: 1.3 }}>
            {archName.replace("The ", "")}
          </div>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>archetype</div>
        </div>
      </div>

      {/* Top recommendation */}
      {results.topRecommendation && (
        <div
          className="uw-card-fi uw-card-fi-4"
          style={{
            padding: "14px 20px",
            background: "linear-gradient(135deg, #4A5FF7, #7B61FF)",
            borderRadius: 12,
            color: "#fff",
            fontSize: 13,
            lineHeight: 1.5,
            maxWidth: 400,
            width: "100%",
            marginBottom: 28,
          }}
        >
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "1px",
            opacity: 0.7,
            marginBottom: 6,
          }}>
            Top Recommendation
          </div>
          {results.topRecommendation}
        </div>
      )}

      {/* Action buttons */}
      <div
        className="uw-card-fi uw-card-fi-5"
        style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}
      >
        <button
          onClick={onReview}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#fff",
            border: "1.5px solid #4A5FF7",
            borderRadius: 12,
            padding: "10px 20px",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "'Google Sans', sans-serif",
            color: "#4A5FF7",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          ↺ Review cards
        </button>
        <button
          onClick={onReset}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#fff",
            border: "1.5px solid #E5E7EB",
            borderRadius: 12,
            padding: "10px 20px",
            fontSize: 13,
            fontWeight: 500,
            fontFamily: "'Google Sans', sans-serif",
            color: "#6B7280",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <RefreshCw size={14} />
          Run another diagnostic
        </button>
      </div>
    </CardWrapper>
  );
}

// ── Main Playback Component ──
export default function NarrativePlayback({ results, onReset }) {
  const [currentCard, setCurrentCard] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const totalCards = 5;

  if (!results) return null;

  const goTo = useCallback((idx) => {
    const clamped = Math.max(0, Math.min(totalCards - 1, idx));
    setCurrentCard(clamped);
    setAnimKey(k => k + 1);
  }, []);

  const goNext = useCallback(() => goTo(currentCard + 1), [currentCard, goTo]);
  const goPrev = useCallback(() => goTo(currentCard - 1), [currentCard, goTo]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev]);

  const renderCard = () => {
    switch (currentCard) {
      case 0: return <HeroStatCard results={results} />;
      case 1: return <FrictionProfileCard results={results} />;
      case 2: return <TimeSplitCard results={results} />;
      case 3: return <PeakFrictionCard results={results} />;
      case 4: return <CloserCard results={results} onReset={onReset} onReview={() => goTo(0)} />;
      default: return null;
    }
  };

  return (
    <div className="narrative-results-enter" style={{ maxWidth: 640, margin: "0 auto" }}>
      {/* Progress dots */}
      <ProgressDots current={currentCard} total={totalCards} />

      {/* Top nav bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
        padding: "0 4px",
      }}>
        {/* Back arrow */}
        {currentCard > 0 ? (
          <button className="uw-back" onClick={goPrev} aria-label="Previous card">
            ←
          </button>
        ) : (
          <div style={{ width: 36 }} />
        )}

        {/* Card counter */}
        <div style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#9CA3AF",
          fontFamily: "'Google Sans', sans-serif",
        }}>
          {currentCard + 1} / {totalCards}
        </div>

        {/* Spacer to balance layout */}
        <div style={{ width: 36 }} />
      </div>

      {/* Card content */}
      <div key={animKey}>
        {renderCard()}
      </div>

      {/* Forward arrow (hidden on last card) */}
      {currentCard < totalCards - 1 && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
          <button className="uw-nav-arrow" onClick={goNext} aria-label="Next card">
            →
          </button>
        </div>
      )}
    </div>
  );
}
