/**
 * roleChips.js — Role and seniority-aware conversation starter chips.
 * Used for the initial prompt and as fallbacks when the AI is unavailable.
 */

const SENIOR_LEVELS = ["Senior", "Lead", "Manager", "Director+"];

// Chips indexed by role keyword, then seniority tier (senior | default)
const CHIPS = {
  design: {
    default: [
      { label: "Feedback loops", expandedText: "Getting clear, actionable feedback on my designs is a struggle — it often comes late, from too many people, and sometimes contradicts itself." },
      { label: "Review back-and-forth", expandedText: "Design reviews drag on across multiple rounds because stakeholders review async over days and always seem to have new input late in the process." },
      { label: "Context switching", expandedText: "I'm constantly pulled between different projects and Figma files, making it really hard to stay in deep design thinking for any stretch of time." },
    ],
    senior: [
      { label: "Design system debt", expandedText: "Keeping the design system in sync with what product teams actually need is a constant uphill battle that keeps landing on my plate." },
      { label: "Cross-squad alignment", expandedText: "Getting design decisions aligned across multiple product squads takes up far more of my week than the actual design work itself." },
      { label: "Strategy vs craft", expandedText: "I struggle to carve out time for hands-on design work when so much of my week is consumed by reviews, planning meetings, and stakeholder management." },
    ],
  },
  product: {
    default: [
      { label: "Unclear requirements", expandedText: "I frequently start a feature only to discover the requirements weren't fully thought through, leading to rework and scope changes mid-sprint." },
      { label: "Stakeholder updates", expandedText: "A big chunk of my week goes to preparing and delivering status updates for different stakeholder groups who each want different levels of detail." },
      { label: "Data access", expandedText: "I frequently have to pull my own metrics because our analytics setup doesn't surface what I need quickly enough to make confident product decisions." },
    ],
    senior: [
      { label: "Roadmap trade-offs", expandedText: "Constantly balancing competing priorities from different stakeholders while keeping the team focused on what actually moves the needle is exhausting." },
      { label: "Strategy vs delivery", expandedText: "I struggle to find time for strategic product thinking when so much of my week gets consumed by delivery questions, escalations, and team dependencies." },
      { label: "Alignment overhead", expandedText: "Getting engineering, design, and leadership genuinely aligned on direction requires an enormous amount of meeting time and async follow-up to stick." },
    ],
  },
  engineer: {
    default: [
      { label: "Review wait times", expandedText: "PRs sit in the queue for days before getting reviewed, and then often require several rounds of back-and-forth comments before they can be merged." },
      { label: "Meeting overhead", expandedText: "I lose a lot of deep coding time to meetings that could easily have been an async message or a quick Slack thread instead." },
      { label: "Unclear tickets", expandedText: "I frequently start building something only to discover the requirements weren't thought through, and I end up blocked waiting for clarification." },
    ],
    senior: [
      { label: "Tech debt pressure", expandedText: "I spend a lot of energy advocating for time to address tech debt while trying to keep pace with feature delivery pressure from the product side." },
      { label: "Unblocking others", expandedText: "A significant chunk of my week goes to unblocking other engineers and answering questions rather than doing complex technical work myself." },
      { label: "Architecture buy-in", expandedText: "Getting the team aligned on architectural decisions is slow — disagreements surface late in the process and often derail progress at critical moments." },
    ],
  },
  develop: {
    default: [
      { label: "Review wait times", expandedText: "PRs sit in the queue for days before getting reviewed, and then often require several rounds of back-and-forth comments before they can be merged." },
      { label: "Meeting overhead", expandedText: "I lose a lot of deep coding time to meetings that could easily have been an async message or a quick Slack thread instead." },
      { label: "Unclear tickets", expandedText: "I frequently start building something only to discover the requirements weren't thought through, and I end up blocked waiting for clarification." },
    ],
    senior: [
      { label: "Tech debt pressure", expandedText: "I spend a lot of energy advocating for time to address tech debt while trying to keep pace with feature delivery pressure from the product side." },
      { label: "Unblocking others", expandedText: "A significant chunk of my week goes to unblocking other engineers and answering questions rather than doing complex technical work myself." },
      { label: "Architecture buy-in", expandedText: "Getting the team aligned on architectural decisions is slow — disagreements surface late in the process and often derail progress at critical moments." },
    ],
  },
  data: {
    default: [
      { label: "Ad-hoc requests", expandedText: "I spend a lot of time fielding one-off data requests from different teams instead of being able to focus on planned analysis work." },
      { label: "Manual reporting", expandedText: "I waste hours every week manually pulling, formatting, and distributing reports that should really be automated or available as a self-serve dashboard." },
      { label: "Data quality issues", expandedText: "A lot of my time goes into cleaning and validating data before I can even begin the actual analysis — it slows down every piece of work." },
    ],
    senior: [
      { label: "Self-serve gap", expandedText: "Too few teams can find answers themselves, so nearly every business question gets routed to me even when the underlying data is already there." },
      { label: "Data infra gaps", expandedText: "Our data stack has significant gaps that make it hard to scale analysis work, and I end up spending time building workarounds instead of producing insight." },
      { label: "Stakeholder expectations", expandedText: "Senior stakeholders expect instant data answers, but the reality is that getting clean, reliable insight takes real time and often more context than they provide." },
    ],
  },
  sales: {
    default: [
      { label: "CRM hygiene", expandedText: "I spend too much time manually logging calls and updating the CRM after meetings instead of focusing my energy on the next prospect or follow-up." },
      { label: "Meeting prep time", expandedText: "Researching accounts and preparing for calls takes a disproportionate chunk of my time, especially when the meeting is short or doesn't progress." },
      { label: "Pipeline reporting", expandedText: "Putting together pipeline updates for my manager eats into real selling time, and the data is often stale or incomplete by the time I submit it." },
    ],
    senior: [
      { label: "Forecast accuracy", expandedText: "Getting an accurate view of the team's pipeline requires too much manual reconciliation of CRM data — reps update inconsistently and the picture is always murky." },
      { label: "Onboarding new reps", expandedText: "Getting new reps up to speed takes a significant chunk of my time each quarter, and our existing onboarding materials are inconsistent and quickly out of date." },
      { label: "Cross-function friction", expandedText: "Coordinating between sales, marketing, and CS on deal support and escalations creates a lot of back-and-forth that slows down deals at critical moments." },
    ],
  },
  market: {
    default: [
      { label: "Content approvals", expandedText: "Getting content through the approval chain takes far too long, with multiple stakeholders adding rounds of last-minute review that push deadlines." },
      { label: "Campaign reporting", expandedText: "I spend too much time pulling metrics from different platforms to compile campaign performance reports that should really be automated or consolidated." },
      { label: "Ad-hoc asset requests", expandedText: "I'm constantly handling requests for assets and copy from other teams, which fragments my focus and makes it hard to make progress on planned campaign work." },
    ],
    senior: [
      { label: "Attribution disputes", expandedText: "Agreeing on how to attribute pipeline and revenue impact across channels takes a lot of time and creates recurring tension with the sales team and leadership." },
      { label: "Messaging consistency", expandedText: "Keeping product, sales, and customer-facing messaging consistent is a constant challenge, especially as positioning evolves faster than content can be updated." },
      { label: "Agency overhead", expandedText: "Managing external agencies and freelancers eats up a surprising amount of my week with briefing, review cycles, feedback loops, and quality control." },
    ],
  },

  // ── Healthcare / medical ────────────────────────────────────────────
  doctor: {
    default: [
      { label: "Patient admin", expandedText: "A huge chunk of my day goes into notes, referral letters, and forms rather than actually seeing and treating patients." },
      { label: "System switching", expandedText: "I jump between multiple clinical systems, each with different logins and interfaces, just to get a complete picture of one patient." },
      { label: "Appointment pressure", expandedText: "Appointments are so short that I often can't properly address everything a patient needs, which leads to more follow-ups and repeat visits." },
    ],
    senior: [
      { label: "Clinical vs admin split", expandedText: "I spend too much of my time on administrative and management tasks when I should be focused on clinical work and patient outcomes." },
      { label: "Staff coordination", expandedText: "Coordinating rotas, covering absences, and managing the team takes up time that could be better spent on patient care or service improvement." },
      { label: "Compliance overhead", expandedText: "Keeping up with regulatory requirements, audits, and governance documentation feels like a second job on top of actual clinical practice." },
    ],
  },
  nurse: {
    default: [
      { label: "Documentation burden", expandedText: "I spend so much time writing up notes and filling in forms that it cuts directly into the time I have with patients." },
      { label: "Handover gaps", expandedText: "Shift handovers are often rushed or incomplete, which means I start each shift piecing together what happened and what still needs doing." },
      { label: "Supply chasing", expandedText: "Tracking down supplies, medications, or equipment that should be readily available wastes a surprising amount of time every shift." },
    ],
    senior: [
      { label: "Staff coverage", expandedText: "Managing rotas and covering gaps when people are off sick or on leave takes up a lot of my time and creates constant juggling." },
      { label: "Training vs doing", expandedText: "I'm expected to mentor and train junior staff while carrying a full patient load myself, which means something always suffers." },
      { label: "Escalation bottleneck", expandedText: "Everything seems to get escalated to me — patient concerns, family queries, team issues — and there's rarely enough time to deal with it all properly." },
    ],
  },
  // Catch-all for medical/health/clinical/GP/receptionist/pharmacy/therapist
  recept: {
    default: [
      { label: "Phone overload", expandedText: "The phones ring constantly and it's hard to give callers proper attention while also dealing with patients who are standing right in front of me." },
      { label: "Booking juggling", expandedText: "Managing appointment slots, cancellations, and urgent fit-ins is a constant puzzle — the system is always overbooked and patients get frustrated." },
      { label: "Repetitive queries", expandedText: "I answer the same questions over and over — prescription status, appointment availability, referral progress — that could easily be handled differently." },
    ],
    senior: [
      { label: "Staff scheduling", expandedText: "Managing cover for the front desk and coordinating with clinical staff on scheduling takes up a lot of time that could go towards improving the service." },
      { label: "System limitations", expandedText: "Our booking and records systems don't talk to each other well, which means a lot of manual copying, checking, and workaround processes." },
      { label: "Patient complaints", expandedText: "Handling patient frustrations about wait times and availability is draining, especially when the root cause is a system problem I can't fix." },
    ],
  },
  clinic: {
    default: [
      { label: "Patient admin", expandedText: "A huge chunk of my day goes into notes, referral letters, and forms rather than the clinical work I'm trained to do." },
      { label: "System switching", expandedText: "I jump between multiple clinical systems, each with different logins and interfaces, just to get a complete picture of one patient." },
      { label: "Scheduling friction", expandedText: "The booking system doesn't reflect reality — double-bookings, no-shows, and urgent fit-ins mean the schedule is never what it's supposed to be." },
    ],
    senior: [
      { label: "Clinical vs admin split", expandedText: "I spend too much of my time on administrative and management tasks when I should be focused on clinical work and patient outcomes." },
      { label: "Compliance overhead", expandedText: "Keeping up with regulatory requirements, audits, and governance documentation feels like a second job on top of actual clinical practice." },
      { label: "Staff coordination", expandedText: "Coordinating rotas, covering absences, and managing the team takes up time that could be better spent on patient care or service improvement." },
    ],
  },
  medic: {
    default: [
      { label: "Patient admin", expandedText: "A huge chunk of my day goes into notes, referral letters, and forms rather than actually seeing and treating patients." },
      { label: "System switching", expandedText: "I jump between multiple clinical systems, each with different logins and interfaces, just to get a complete picture of one patient." },
      { label: "Scheduling friction", expandedText: "The booking system doesn't reflect reality — double-bookings, no-shows, and urgent fit-ins mean the schedule is never what it's supposed to be." },
    ],
    senior: [
      { label: "Clinical vs admin split", expandedText: "I spend too much of my time on administrative and management tasks when I should be focused on clinical work and patient outcomes." },
      { label: "Compliance overhead", expandedText: "Keeping up with regulatory requirements, audits, and governance documentation feels like a second job on top of actual clinical practice." },
      { label: "Staff coordination", expandedText: "Coordinating rotas, covering absences, and managing the team takes up time that could be better spent on patient care or service improvement." },
    ],
  },
  pharma: {
    default: [
      { label: "Prescription chasing", expandedText: "A lot of my time goes into chasing missing prescriptions, clarifying dosages with surgeries, and handling queries that should have been resolved upstream." },
      { label: "Stock management", expandedText: "Keeping stock levels right is a constant balancing act — shortages cause patient delays, and overstock ties up budget and shelf space." },
      { label: "Repetitive queries", expandedText: "I answer the same medication questions repeatedly throughout the day, which takes time away from more complex dispensing and clinical work." },
    ],
    senior: [
      { label: "Regulatory burden", expandedText: "Staying on top of changing regulations, controlled drug audits, and compliance documentation takes up a significant amount of my management time." },
      { label: "Staff training", expandedText: "Training and supervising the team while maintaining my own clinical responsibilities means something always gets squeezed." },
      { label: "System limitations", expandedText: "Our dispensing and stock systems don't integrate well, creating manual workarounds that waste time and introduce errors." },
    ],
  },
  health: {
    default: [
      { label: "Patient admin", expandedText: "A significant portion of my day goes into documentation, forms, and admin rather than direct patient interaction or clinical work." },
      { label: "System workarounds", expandedText: "The systems I use don't work together smoothly, so I spend a lot of time on manual workarounds just to do basic tasks." },
      { label: "Scheduling issues", expandedText: "Managing appointments, cancellations, and urgent cases is a constant juggling act that creates stress and inefficiency throughout the day." },
    ],
    senior: [
      { label: "Clinical vs admin split", expandedText: "I spend too much of my time on administrative and management tasks when I should be focused on clinical work and patient outcomes." },
      { label: "Compliance overhead", expandedText: "Keeping up with regulatory requirements, audits, and governance documentation feels like a second job on top of actual clinical practice." },
      { label: "Staff coordination", expandedText: "Coordinating rotas, covering absences, and managing the team takes up time that could be better spent on patient care or service improvement." },
    ],
  },
  therap: {
    default: [
      { label: "Session notes", expandedText: "Writing up detailed session notes after each appointment takes almost as long as the sessions themselves and eats into my day." },
      { label: "Scheduling gaps", expandedText: "Managing cancellations, no-shows, and waitlists is a constant effort that leaves unpredictable gaps and wasted slots in my schedule." },
      { label: "Referral admin", expandedText: "Processing referrals, writing reports for other services, and communicating with GPs involves a lot of repetitive admin that slows everything down." },
    ],
    senior: [
      { label: "Caseload management", expandedText: "Balancing my own clinical caseload with supervising other therapists and contributing to service development is a constant tension." },
      { label: "Waiting list pressure", expandedText: "The pressure to reduce waiting lists while maintaining quality of care creates impossible trade-offs that fall on me to navigate." },
      { label: "Outcome reporting", expandedText: "Compiling outcome data and service reports for commissioners takes significant time away from actual clinical work and service improvement." },
    ],
  },

  // ── Admin / operations / support ────────────────────────────────────
  admin: {
    default: [
      { label: "Inbox overload", expandedText: "My inbox fills up so fast with requests, queries, and CCs that it's hard to prioritise what actually needs my attention right now." },
      { label: "Manual data entry", expandedText: "I spend a lot of time copying information between systems because they don't talk to each other, which feels like a waste." },
      { label: "Chasing responses", expandedText: "A big part of my day involves following up with people who haven't replied to things — approvals, information requests, confirmations." },
    ],
    senior: [
      { label: "Process gaps", expandedText: "There are a lot of informal processes that only work because I know the workarounds — if I'm not there, things tend to fall through the cracks." },
      { label: "System limitations", expandedText: "Our admin systems are outdated or disconnected, and I spend more time working around their limitations than actually being productive." },
      { label: "Team coordination", expandedText: "Keeping the admin team aligned and covering all the bases requires a lot of ad-hoc coordination that isn't really captured in any system." },
    ],
  },
  operat: {
    default: [
      { label: "Process bottlenecks", expandedText: "There are recurring bottlenecks in our workflows where things get stuck waiting for someone else, and I end up chasing to keep things moving." },
      { label: "Manual tracking", expandedText: "A lot of operational tracking is still done in spreadsheets or manually, which makes it hard to get an accurate real-time picture of where things stand." },
      { label: "Cross-team handoffs", expandedText: "Handoffs between teams are messy — information gets lost, context is missing, and I end up filling in the gaps to keep things on track." },
    ],
    senior: [
      { label: "Visibility gaps", expandedText: "Getting a clear, up-to-date view of operational performance requires pulling data from too many places and reconciling it manually." },
      { label: "Scaling processes", expandedText: "Processes that worked when we were smaller are now breaking under load, and finding time to fix them while keeping things running is a constant tension." },
      { label: "Vendor management", expandedText: "Managing suppliers and external partners takes up more time than it should, with a lot of chasing, negotiating, and issue resolution." },
    ],
  },
  support: {
    default: [
      { label: "Ticket volume", expandedText: "The sheer volume of incoming tickets makes it hard to give each one the attention it deserves, and the backlog keeps growing." },
      { label: "Repetitive issues", expandedText: "I keep answering the same types of questions over and over — things that could be solved with better documentation or self-service options." },
      { label: "Tool switching", expandedText: "I jump between the ticketing system, knowledge base, chat, and internal tools constantly, which breaks my flow and slows resolution times." },
    ],
    senior: [
      { label: "Escalation load", expandedText: "Too many tickets get escalated to me that could have been resolved at first contact with better training or documentation." },
      { label: "Knowledge gaps", expandedText: "Our knowledge base is incomplete and outdated, which means the team spends time reinventing answers instead of resolving quickly." },
      { label: "Reporting overhead", expandedText: "Pulling together support metrics and SLA reports for leadership takes time away from actually improving the service." },
    ],
  },

  // ── HR / people / recruitment ───────────────────────────────────────
  hr: {
    default: [
      { label: "Policy queries", expandedText: "I spend a lot of time answering the same HR policy questions repeatedly — things that should be easy for people to find themselves." },
      { label: "Manual processes", expandedText: "Too many HR processes still involve manual forms, emails, and spreadsheets when they could be streamlined or automated." },
      { label: "Onboarding admin", expandedText: "Getting new starters set up involves coordinating across multiple systems and teams, and things often slip through the cracks." },
    ],
    senior: [
      { label: "Compliance tracking", expandedText: "Keeping on top of employment law changes, policy updates, and audit requirements is a significant ongoing time commitment." },
      { label: "People data silos", expandedText: "Employee data is spread across too many systems, making it hard to get a complete picture for reporting or decision-making." },
      { label: "Change management", expandedText: "Rolling out new policies or processes requires a lot of communication, training, and follow-up that always takes longer than expected." },
    ],
  },
  recruit: {
    default: [
      { label: "CV screening", expandedText: "I spend a huge amount of time reviewing CVs and applications, most of which aren't a good fit, to find the handful worth progressing." },
      { label: "Scheduling interviews", expandedText: "Coordinating interview schedules between candidates and hiring managers is a constant logistical puzzle that eats up my day." },
      { label: "Candidate chasing", expandedText: "Following up with candidates who haven't responded, or chasing hiring managers for feedback, takes up more time than the actual recruiting." },
    ],
    senior: [
      { label: "Hiring manager alignment", expandedText: "Getting hiring managers to agree on what they actually need in a role, and then sticking to it throughout the process, is a recurring challenge." },
      { label: "Pipeline visibility", expandedText: "Getting a clear view of where every candidate stands across all open roles requires too much manual checking and spreadsheet updating." },
      { label: "Offer negotiations", expandedText: "The back-and-forth on offers between candidates, hiring managers, and compensation takes a lot of time and often introduces delays." },
    ],
  },

  // ── Finance / accounting ────────────────────────────────────────────
  financ: {
    default: [
      { label: "Manual reconciliation", expandedText: "I spend a lot of time manually reconciling data across different systems because nothing integrates properly or syncs automatically." },
      { label: "Month-end crunch", expandedText: "The month-end close process is always rushed and stressful, with too many manual steps and last-minute adjustments." },
      { label: "Expense chasing", expandedText: "Chasing people to submit expenses, receipts, and approvals on time takes up a disproportionate amount of my week." },
    ],
    senior: [
      { label: "Reporting demands", expandedText: "Different stakeholders want financial data cut in different ways, and producing all these reports manually from disconnected sources is hugely time-consuming." },
      { label: "Forecast accuracy", expandedText: "Keeping forecasts accurate when the underlying data keeps changing and business assumptions shift constantly is an ongoing battle." },
      { label: "Audit preparation", expandedText: "Preparing for audits requires pulling together documentation from multiple sources, which is stressful and takes weeks of concentrated effort." },
    ],
  },
  account: {
    default: [
      { label: "Manual reconciliation", expandedText: "I spend a lot of time manually reconciling data across different systems because nothing integrates properly or syncs automatically." },
      { label: "Invoice processing", expandedText: "Processing invoices involves too many manual steps — data entry, matching, approval chasing — that could be much more streamlined." },
      { label: "Expense chasing", expandedText: "Chasing people to submit expenses, receipts, and approvals on time takes up a disproportionate amount of my week." },
    ],
    senior: [
      { label: "Reporting demands", expandedText: "Different stakeholders want financial data cut in different ways, and producing all these reports manually from disconnected sources is hugely time-consuming." },
      { label: "Compliance tracking", expandedText: "Keeping up with changing regulatory and reporting requirements adds a significant layer of work on top of day-to-day accounting." },
      { label: "System fragmentation", expandedText: "Our financial systems don't integrate well, so getting a single source of truth requires a lot of manual effort and cross-referencing." },
    ],
  },

  // ── Teaching / education ────────────────────────────────────────────
  teach: {
    default: [
      { label: "Lesson planning", expandedText: "Creating and adapting lesson plans takes up a huge amount of my evenings and weekends on top of actual teaching time." },
      { label: "Marking load", expandedText: "The volume of marking and written feedback I need to give is overwhelming and consistently spills over into my personal time." },
      { label: "Admin paperwork", expandedText: "There's a constant stream of forms, reports, and data entry that takes time away from preparing good lessons and supporting students." },
    ],
    senior: [
      { label: "Curriculum oversight", expandedText: "Managing curriculum consistency and quality across my department while maintaining my own teaching load is a constant balancing act." },
      { label: "Staff development", expandedText: "Supporting and developing other teachers takes significant time for observations, feedback, and mentoring on top of my own responsibilities." },
      { label: "Data reporting", expandedText: "Collating and analysing student performance data for leadership and regulators is time-consuming and the requirements keep changing." },
    ],
  },

  // ── Legal ───────────────────────────────────────────────────────────
  legal: {
    default: [
      { label: "Document review", expandedText: "Reviewing and redlining contracts takes up a huge portion of my week, often with tight turnaround expectations and limited context." },
      { label: "Version confusion", expandedText: "Tracking which version of a contract is current, who's made what changes, and where we are in the approval chain is unnecessarily messy." },
      { label: "Ad-hoc advice requests", expandedText: "I get pulled into ad-hoc legal questions from across the business that fragment my day and make it hard to focus on substantive work." },
    ],
    senior: [
      { label: "Risk prioritisation", expandedText: "Everything gets flagged as urgent and high-risk, making it hard to prioritise the legal issues that actually matter most to the business." },
      { label: "Cross-team coordination", expandedText: "Coordinating legal input across deals, compliance, and operations involves a lot of meetings and follow-up that slows everything down." },
      { label: "Compliance monitoring", expandedText: "Keeping track of evolving regulations and ensuring the business stays compliant is an ongoing effort that competes with day-to-day legal work." },
    ],
  },

  // ── Default (truly universal) ───────────────────────────────────────
  default: {
    default: [
      { label: "Repetitive tasks", expandedText: "I spend a lot of my week on repetitive tasks that follow the same pattern every time — it feels like time that could be better spent." },
      { label: "Chasing people", expandedText: "A big part of my day involves following up with people for information, approvals, or responses that I need to keep things moving." },
      { label: "System juggling", expandedText: "I constantly switch between different tools and systems throughout the day, which breaks my focus and makes simple tasks take longer." },
    ],
    senior: [
      { label: "Admin vs real work", expandedText: "Too much of my week gets taken up by admin, reporting, and coordination when I should be focused on the work that actually matters." },
      { label: "Chasing decisions", expandedText: "A lot of my time goes into chasing decisions and approvals from others, which creates delays and makes it hard to keep projects moving." },
      { label: "Information scattered", expandedText: "The information I need to do my job is spread across too many places — emails, documents, systems — and finding the right thing takes far too long." },
    ],
  },
};

/**
 * Returns 3 role and seniority-aware chips for the initial prompt.
 * @param {string} jobTitle - Free-text job title entered by the user
 * @param {string} seniority - One of: "Junior", "Mid-level", "Senior", "Lead", "Manager", "Director+"
 */
export function getRoleAwareChips(jobTitle, seniority) {
  const lower = (jobTitle || "").toLowerCase();
  const roleKey = Object.keys(CHIPS).find(k => k !== "default" && lower.includes(k)) || "default";
  const tier = SENIOR_LEVELS.includes(seniority) ? "senior" : "default";
  return CHIPS[roleKey][tier] || CHIPS[roleKey].default || CHIPS.default.default;
}

/**
 * Returns generic follow-up chips for use when the AI is unavailable mid-conversation.
 * These are intentionally different from the initial starters to avoid repetition.
 */
export function getFollowUpChips() {
  return [
    { label: "Another friction", expandedText: "There's another area of my work where I regularly lose time or energy that I haven't mentioned yet." },
    { label: "Knock-on effects", expandedText: "The friction I described has knock-on effects — it creates delays, frustration, or extra work for me and the people I work with." },
    { label: "Workarounds I use", expandedText: "I've developed workarounds to deal with some of these problems, but they're not sustainable and they add their own overhead." },
  ];
}
