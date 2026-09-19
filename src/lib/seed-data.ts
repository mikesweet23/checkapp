import type { Assessment, AnswerValues, AttemptResult } from "./types";

export const assessments: Assessment[] = [
  {
    id: "assessment-anxiety-001",
    slug: "anxiety-check",
    name: "Understand Your Anxious Mind",
    shortName: "Anxiety Check",
    tagline: "A clearer view of what your anxiety is trying to tell you.",
    description: "This gentle, evidence-informed check-in helps you notice the patterns behind anxious thoughts, feelings and behaviours — so you can choose your next step with more confidence.",
    status: "LIVE",
    questionCount: 8,
    completionMinutes: 3,
    completions: 186,
    conversionRate: 42,
    updatedAt: "18 Sep 2026",
    categories: [
      { id: "thoughts", name: "Thought patterns", description: "The stories and predictions your mind creates.", color: "#ef6d3f" },
      { id: "body", name: "Body & energy", description: "How anxiety shows up physically.", color: "#c98c70" },
      { id: "avoidance", name: "Avoidance", description: "The places anxiety may be narrowing your world.", color: "#8b6a74" },
      { id: "confidence", name: "Self-trust", description: "Your sense of safety and confidence to move forward.", color: "#759477" }
    ],
    questions: [
      { id: "q1", prompt: "How often do you find yourself expecting something to go wrong?", helpText: "Think about the last two weeks.", categoryId: "thoughts", options: [{ id: "q1a", label: "Almost never", score: 0 }, { id: "q1b", label: "Occasionally", score: 1 }, { id: "q1c", label: "Often", score: 2 }, { id: "q1d", label: "Almost always", score: 3 }] },
      { id: "q2", prompt: "When a worried thought arrives, how difficult is it to let it pass?", categoryId: "thoughts", options: [{ id: "q2a", label: "It passes quite easily", score: 0 }, { id: "q2b", label: "It takes some effort", score: 1 }, { id: "q2c", label: "It tends to stick around", score: 2 }, { id: "q2d", label: "It feels impossible to switch off", score: 3 }] },
      { id: "q3", prompt: "How often does anxiety affect your sleep or physical energy?", categoryId: "body", options: [{ id: "q3a", label: "Rarely", score: 0 }, { id: "q3b", label: "Every now and then", score: 1 }, { id: "q3c", label: "Several nights a week", score: 2 }, { id: "q3d", label: "Most days or nights", score: 3 }] },
      { id: "q4", prompt: "Do you notice physical sensations like a racing heart, tight chest or a churning stomach?", categoryId: "body", options: [{ id: "q4a", label: "Not really", score: 0 }, { id: "q4b", label: "Sometimes", score: 1 }, { id: "q4c", label: "Frequently", score: 2 }, { id: "q4d", label: "Very often", score: 3 }] },
      { id: "q5", prompt: "Have you been avoiding people, places or situations because they feel too uncomfortable?", categoryId: "avoidance", options: [{ id: "q5a", label: "No", score: 0 }, { id: "q5b", label: "A little", score: 1 }, { id: "q5c", label: "More than I would like", score: 2 }, { id: "q5d", label: "It is limiting my life", score: 3 }] },
      { id: "q6", prompt: "How much does anxiety influence the decisions you make?", categoryId: "avoidance", options: [{ id: "q6a", label: "Very little", score: 0 }, { id: "q6b", label: "Sometimes", score: 1 }, { id: "q6c", label: "Quite a lot", score: 2 }, { id: "q6d", label: "It often decides for me", score: 3 }] },
      { id: "q7", prompt: "When anxiety rises, how confident are you that you can handle it?", categoryId: "confidence", options: [{ id: "q7a", label: "Very confident", score: 0 }, { id: "q7b", label: "Fairly confident", score: 1 }, { id: "q7c", label: "Not very confident", score: 2 }, { id: "q7d", label: "I feel overwhelmed by it", score: 3 }] },
      { id: "q8", prompt: "How ready do you feel to understand and change your relationship with anxiety?", categoryId: "confidence", options: [{ id: "q8a", label: "I am curious and ready", score: 0 }, { id: "q8b", label: "I am open to exploring it", score: 1 }, { id: "q8c", label: "I know I need support", score: 2 }, { id: "q8d", label: "I need a clear next step", score: 3 }] }
    ],
    resultBands: [
      { id: "band-calm", minScore: 0, maxScore: 24, label: "A steadier starting point", title: "You have a useful foundation of calm", summary: "Your answers suggest anxiety is not currently dominating your day-to-day life.", body: "That does not mean every day feels easy. You seem to have some strong resources to draw on, and this is a good moment to strengthen them before pressure builds. A few simple habits can make a meaningful difference.", ctaLabel: "Explore practical tools", ctaHref: "https://absolutemind.co.uk/anxiety-treatment/", videoTitle: "Three ways to protect your calm", videoDescription: "A short introduction from Paula on making your existing resilience work harder for you." },
      { id: "band-aware", minScore: 25, maxScore: 44, label: "A mind asking for space", title: "You may be carrying more than it looks", summary: "Your answers suggest anxiety is beginning to take up more space than you would like.", body: "You are probably managing from the outside, while using a lot of internal energy to keep things moving. Understanding your personal patterns can help you stop working so hard against yourself and start feeling more in control.", ctaLabel: "See your next best step", ctaHref: "https://absolutemind.co.uk/anxiety-treatment/", videoTitle: "When coping starts to cost too much", videoDescription: "" },
      { id: "band-significant", minScore: 45, maxScore: 68, label: "A pattern worth changing", title: "Anxiety may be narrowing your world", summary: "Your responses suggest anxious patterns are affecting your thoughts, body or choices in a significant way.", body: "This is not a judgement and it is not a diagnosis. It is a useful signal that your nervous system may be spending too much time in protection mode. The right support can help you feel safer, think more clearly and get back more of the life you want.", ctaLabel: "Find out how support works", ctaHref: "https://absolutemind.co.uk/anxiety-treatment/", videoTitle: "You are not your anxious thoughts", videoDescription: "A reassuring, practical video about why anxiety feels so convincing — and what can change." },
      { id: "band-support", minScore: 69, maxScore: 100, label: "A clear invitation to support", title: "It may be time to stop facing this alone", summary: "Your answers suggest anxiety is having a strong impact on your everyday experience.", body: "You have already taken a brave first step by looking at this honestly. You do not need to wait until things become unbearable before asking for support. A calm, structured plan can help you understand what is happening and start loosening anxiety's grip.", ctaLabel: "Talk to Absolute Mind", ctaHref: "https://absolutemind.co.uk/contact/", videoTitle: "A calmer way forward", videoDescription: "Paula shares what a first conversation can look like, without pressure or judgement." }
    ]
  },
  {
    id: "assessment-confidence-002",
    slug: "self-confidence-check",
    name: "Your Self-Confidence Check-in",
    shortName: "Confidence Check",
    tagline: "See what is helping your confidence — and what is quietly holding it back.",
    description: "A short, thoughtful check-in to help you understand how self-belief is showing up in your choices, relationships and everyday life.",
    status: "DRAFT",
    questionCount: 0,
    completionMinutes: 4,
    completions: 0,
    conversionRate: 0,
    updatedAt: "12 Sep 2026",
    categories: [], questions: [], resultBands: []
  }
];

export function getAssessment(slug: string) {
  return assessments.find((assessment) => assessment.slug === slug);
}

export function calculateResult(assessment: Assessment, answers: AnswerValues): AttemptResult {
  const maxPossible = assessment.questions.reduce((sum, question) => {
    const questionMax = Math.max(...question.options.map((option) => option.score), 1);
    return sum + questionMax;
  }, 0);
  const total = assessment.questions.reduce((sum, question) => sum + (typeof answers[question.id] === "number" ? answers[question.id] as number : 0), 0);
  const overall = Math.round((total / maxPossible) * 100);
  const band = assessment.resultBands.find((candidate) => overall >= candidate.minScore && overall <= candidate.maxScore) ?? assessment.resultBands.at(-1)!;
  const categoryScores = Object.fromEntries(assessment.categories.map((category) => {
    const categoryQuestions = assessment.questions.filter((question) => question.categoryId === category.id);
    const categoryTotal = categoryQuestions.reduce((sum, question) => sum + (typeof answers[question.id] === "number" ? answers[question.id] as number : 0), 0);
    const categoryMax = categoryQuestions.reduce((sum, question) => sum + Math.max(...question.options.map((option) => option.score), 1), 0);
    return [category.id, categoryMax ? Math.round((categoryTotal / categoryMax) * 100) : 0];
  }));
  return { overall, band, categoryScores };
}
