import type { Assessment } from "./types";

/** Category colours taken from the origami mark in the Absolute Mind logo. */
export const brandCategoryColours = ["#3d8bd9", "#1f9e8a", "#8cb43c", "#e37024", "#d9473b"];

export const defaultSignOff = {
  name: "Paula",
  message: "Thank you for taking the time to do this check-in. However your result looks today, noticing these patterns is a real first step. If you would like to talk it through, I would be glad to hear from you.",
};

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
    completions: 0,
    conversionRate: 0,
    updatedAt: "18 Sep 2026",
    signOff: defaultSignOff,
    categories: [
      { id: "thoughts", name: "Thought patterns", description: "The stories and predictions your mind creates.", color: "#3d8bd9", insights: {
        low: "Your thinking seems to stay fairly flexible. Worried thoughts may visit, but they do not appear to be running the show.",
        medium: "Your mind may be doing a fair amount of 'what if' thinking. That is your brain trying to protect you — but it can be tiring when the predictions keep coming.",
        high: "Your answers suggest anxious predictions are loud and hard to switch off. When the mind is working this hard to keep you safe, it can feel as though the worst is always just around the corner.",
      } },
      { id: "body", name: "Body & energy", description: "How anxiety shows up physically.", color: "#1f9e8a", insights: {
        low: "Your body seems to be getting a reasonable amount of rest from anxiety, which is a real resource to protect.",
        medium: "Anxiety seems to be showing up in your body some of the time — in sleep, energy or physical sensations. These are signs of a nervous system that is working hard.",
        high: "Your body may be carrying a lot of anxiety right now, through sleep, energy or physical sensations. Those sensations are uncomfortable but understandable, and they can settle as your nervous system learns it is safe.",
      } },
      { id: "avoidance", name: "Avoidance", description: "The places anxiety may be narrowing your world.", color: "#8cb43c", insights: {
        low: "Anxiety does not appear to be stopping you from doing the things that matter to you.",
        medium: "There may be a few places, people or decisions that anxiety is quietly steering you away from. Avoidance brings short-term relief, but over time it can make the world feel smaller.",
        high: "Anxiety seems to be making a lot of your choices for you at the moment. That is very common, and it is also one of the most changeable patterns — small, supported steps can widen your world again.",
      } },
      { id: "confidence", name: "Self-trust", description: "Your sense of safety and confidence to move forward.", color: "#e37024", insights: {
        low: "You seem to have a good sense that you can cope when anxiety rises. That self-trust is a strong foundation to build on.",
        medium: "Your confidence in handling anxiety may come and go. You have coped before, even if it has not always felt that way at the time.",
        high: "Anxiety may be leaving you feeling unsure you can handle it. That is not a flaw — it is often what happens after a long time of coping alone, and confidence can be rebuilt.",
      } },
    ],
    questions: [
      { id: "q1", prompt: "How often do you find yourself expecting something to go wrong?", helpText: "Think about the last two weeks.", categoryId: "thoughts", options: [{ id: "q1a", label: "Almost never", score: 0 }, { id: "q1b", label: "Occasionally", score: 1 }, { id: "q1c", label: "Often", score: 2, insight: "You said you often expect something to go wrong. An anxious mind scans ahead for danger so that you are never caught off guard." }, { id: "q1d", label: "Almost always", score: 3, insight: "You said you almost always expect something to go wrong. Living on high alert like that is exhausting, and it makes sense that you would want some relief." }] },
      { id: "q2", prompt: "When a worried thought arrives, how difficult is it to let it pass?", categoryId: "thoughts", options: [{ id: "q2a", label: "It passes quite easily", score: 0 }, { id: "q2b", label: "It takes some effort", score: 1 }, { id: "q2c", label: "It tends to stick around", score: 2, insight: "You told us worried thoughts tend to stick around. Thoughts often become 'sticky' when we argue with them or try hard to push them away." }, { id: "q2d", label: "It feels impossible to switch off", score: 3, insight: "You told us worry can feel impossible to switch off. That is a sign of how hard your mind is working, not a sign that something is wrong with you." }] },
      { id: "q3", prompt: "How often does anxiety affect your sleep or physical energy?", categoryId: "body", options: [{ id: "q3a", label: "Rarely", score: 0 }, { id: "q3b", label: "Every now and then", score: 1 }, { id: "q3c", label: "Several nights a week", score: 2, insight: "Anxiety is affecting your sleep or energy several nights a week. Poor rest and anxiety tend to feed each other, so improving one often helps the other." }, { id: "q3d", label: "Most days or nights", score: 3, insight: "Anxiety is affecting your sleep or energy most days. Being tired makes everything feel harder, so be gentle with yourself about what you can manage right now." }] },
      { id: "q4", prompt: "Do you notice physical sensations like a racing heart, tight chest or a churning stomach?", categoryId: "body", options: [{ id: "q4a", label: "Not really", score: 0 }, { id: "q4b", label: "Sometimes", score: 1 }, { id: "q4c", label: "Frequently", score: 2, insight: "You frequently notice physical sensations such as a racing heart or churning stomach. These are your body's alarm system switching on, and they can be calmed." }, { id: "q4d", label: "Very often", score: 3, insight: "You very often notice strong physical sensations. They can feel frightening, but they are your body's protective response — and it can learn to stand down." }] },
      { id: "q5", prompt: "Have you been avoiding people, places or situations because they feel too uncomfortable?", categoryId: "avoidance", options: [{ id: "q5a", label: "No", score: 0 }, { id: "q5b", label: "A little", score: 1 }, { id: "q5c", label: "More than I would like", score: 2, insight: "You are avoiding some things more than you would like. Noticing that gap between what you do and what you want is often where change begins." }, { id: "q5d", label: "It is limiting my life", score: 3, insight: "You said avoidance is limiting your life. That takes honesty to admit, and it is something that can genuinely change with the right support." }] },
      { id: "q6", prompt: "How much does anxiety influence the decisions you make?", categoryId: "avoidance", options: [{ id: "q6a", label: "Very little", score: 0 }, { id: "q6b", label: "Sometimes", score: 1 }, { id: "q6c", label: "Quite a lot", score: 2, insight: "Anxiety is influencing quite a lot of your decisions. It can help to notice which choices feel like yours and which feel like anxiety's." }, { id: "q6d", label: "It often decides for me", score: 3, insight: "You feel anxiety often decides for you. Getting your choices back, one at a time, is a very achievable goal." }] },
      { id: "q7", prompt: "When anxiety rises, how confident are you that you can handle it?", categoryId: "confidence", options: [{ id: "q7a", label: "Very confident", score: 0 }, { id: "q7b", label: "Fairly confident", score: 1 }, { id: "q7c", label: "Not very confident", score: 2, insight: "You are not very confident you can handle anxiety when it rises. Having a few reliable tools can make those moments feel far more manageable." }, { id: "q7d", label: "I feel overwhelmed by it", score: 3, insight: "You told us anxiety can feel overwhelming. You do not have to find your way through that on your own." }] },
      { id: "q8", prompt: "How ready do you feel to understand and change your relationship with anxiety?", categoryId: "confidence", options: [{ id: "q8a", label: "I am curious and ready", score: 0 }, { id: "q8b", label: "I am open to exploring it", score: 1 }, { id: "q8c", label: "I know I need support", score: 2, insight: "You said you know you need support. Recognising that is a strength, and it is often the moment things start to move." }, { id: "q8d", label: "I need a clear next step", score: 3, insight: "You said you need a clear next step. Your result below includes one, and Paula is happy to talk through what it could look like for you." }] }
    ],
    resultBands: [
      { id: "band-calm", minScore: 0, maxScore: 24, label: "A steadier starting point", title: "You have a useful foundation of calm", summary: "Your answers suggest anxiety is not currently dominating your day-to-day life.", body: "That does not mean every day feels easy. You seem to have some strong resources to draw on, and this is a good moment to strengthen them before pressure builds. A few simple habits can make a meaningful difference.", ctaLabel: "Explore practical tools", ctaHref: "https://absolutemind.co.uk/anxiety-treatment/", videoTitle: "Three ways to protect your calm", videoDescription: "A short introduction from Paula on making your existing resilience work harder for you.", needsSupport: false },
      { id: "band-aware", minScore: 25, maxScore: 44, label: "A mind asking for space", title: "You may be carrying more than it looks", summary: "Your answers suggest anxiety is beginning to take up more space than you would like.", body: "You are probably managing from the outside, while using a lot of internal energy to keep things moving. Understanding your personal patterns can help you stop working so hard against yourself and start feeling more in control.", ctaLabel: "See your next best step", ctaHref: "https://absolutemind.co.uk/anxiety-treatment/", videoTitle: "When coping starts to cost too much", videoDescription: "Why 'just about managing' takes so much energy — and what can make it lighter.", needsSupport: false },
      { id: "band-significant", minScore: 45, maxScore: 68, label: "A pattern worth changing", title: "Anxiety may be narrowing your world", summary: "Your responses suggest anxious patterns are affecting your thoughts, body or choices in a significant way.", body: "This is not a judgement and it is not a diagnosis. It is a useful signal that your nervous system may be spending too much time in protection mode. The right support can help you feel safer, think more clearly and get back more of the life you want.", ctaLabel: "Find out how support works", ctaHref: "https://absolutemind.co.uk/anxiety-treatment/", videoTitle: "You are not your anxious thoughts", videoDescription: "A reassuring, practical look at why anxiety feels so convincing — and what can change.", needsSupport: false },
      { id: "band-support", minScore: 69, maxScore: 100, label: "A clear invitation to support", title: "It may be time to stop facing this alone", summary: "Your answers suggest anxiety is having a strong impact on your everyday experience.", body: "You have already taken a brave first step by looking at this honestly. You do not need to wait until things become unbearable before asking for support. A calm, structured plan can help you understand what is happening and start loosening anxiety's grip.", ctaLabel: "Talk to Absolute Mind", ctaHref: "https://absolutemind.co.uk/contact/", videoTitle: "A calmer way forward", videoDescription: "What a first conversation with Paula can look like, without pressure or judgement.", needsSupport: true }
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
    signOff: defaultSignOff,
    categories: [], questions: [], resultBands: []
  }
];

export function getAssessment(slug: string) {
  return assessments.find((assessment) => assessment.slug === slug);
}
