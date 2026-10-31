import { STYLES } from "./styles.js";
import { QuestionnaireAnswers, StyleCode, StyleScoreResult, QuestionOption } from "./types.js";

export const QUESTION_1_OPTIONS: Record<string, QuestionOption> = {
  talking_head: {
    id: "talking_head",
    label: "Me talking to camera",
    points: { M: 3, K: 1 },
  },
  screen_recording: {
    id: "screen_recording",
    label: "A screen recording of software",
    points: { W: 3, K: 1, T: 1 },
  },
  data_numbers: {
    id: "data_numbers",
    label: "Numbers, charts, a spreadsheet",
    points: { D: 3, T: 1 },
  },
  ideas_words: {
    id: "ideas_words",
    label: "Just ideas and words (no footage)",
    points: { K: 2, T: 2, C: 1, P: 1 },
  },
  story_character: {
    id: "story_character",
    label: "A story or situation with a character",
    points: { P: 3, C: 1 },
  },
};

export const QUESTION_2_OPTIONS: Record<string, QuestionOption> = {
  hyped: {
    id: "hyped",
    label: "Get hyped and take action (buy, join, follow)",
    points: { K: 3, T: 1 },
  },
  understand: {
    id: "understand",
    label: "Understand how something works",
    points: { T: 2, C: 2, D: 1 },
  },
  task_click_by_click: {
    id: "task_click_by_click",
    label: "Be able to do the task themselves, click by click",
    points: { W: 3 },
  },
  trust_evidence: {
    id: "trust_evidence",
    label: "Trust a conclusion because of the evidence",
    points: { D: 3, M: 1 },
  },
  relate_smile: {
    id: "relate_smile",
    label: "Relate and smile",
    points: { P: 3, C: 1 },
  },
  trust_personally: {
    id: "trust_personally",
    label: "Trust me personally",
    points: { M: 3, C: 1 },
  },
};

export const QUESTION_3_OPTIONS: Record<string, QuestionOption> = {
  loud: {
    id: "loud",
    label: "Loud, fast, bold",
    points: { K: 3 },
  },
  calm: {
    id: "calm",
    label: "Calm, polished, professional",
    points: { T: 2, W: 2, D: 2, M: 1 },
  },
  warm: {
    id: "warm",
    label: "Warm, personal, editorial",
    points: { M: 3, D: 1 },
  },
  teacher: {
    id: "teacher",
    label: "Teacher-like, handmade",
    points: { C: 3 },
  },
  playful: {
    id: "playful",
    label: "Playful, friendly",
    points: { P: 3 },
  },
};

export const QUESTION_4_OPTIONS: Record<string, QuestionOption> = {
  under_60: {
    id: "under_60",
    label: "Under 60 seconds, vertical (Shorts, Reels, TikTok)",
    points: { K: 2, P: 1, T: 1 },
  },
  one_to_three_min: {
    id: "one_to_three_min",
    label: "1 to 3 minutes",
    points: { T: 1, D: 1, K: 1, P: 1, M: 1 },
  },
  three_to_ten_min: {
    id: "three_to_ten_min",
    label: "3 to 10 minutes (YouTube, course, tutorial)",
    points: { W: 2, C: 2, M: 2, D: 1 },
  },
};

export const QUESTION_5_OPTIONS: Record<string, QuestionOption> = {
  creators: {
    id: "creators",
    label: "Creators, freelancers, small business owners",
    points: { K: 2, T: 1 },
  },
  software_users: {
    id: "software_users",
    label: "Software users or customers",
    points: { W: 2, T: 2 },
  },
  students: {
    id: "students",
    label: "Students and learners",
    points: { C: 2, P: 1, T: 1 },
  },
  executives: {
    id: "executives",
    label: "Executives, analysts, press",
    points: { D: 2, T: 1 },
  },
  general_public: {
    id: "general_public",
    label: "General public, kids, families",
    points: { P: 2, C: 1 },
  },
  own_followers: {
    id: "own_followers",
    label: "My own followers who already know me",
    points: { M: 2, K: 1 },
  },
};

export const SAFE_HYBRIDS: Record<string, string> = {
  "K+M": "Open with 5 seconds of Kinetic Type for the hook, then the Warm Canvas edit.",
  "M+K": "Open with 5 seconds of Kinetic Type for the hook, then the Warm Canvas edit.",
  "T+D": "Clean Tech layout with one Data Story chart as the proof beat.",
  "D+T": "Data Story format with Clean Tech cards explaining the context.",
  "W+T": "Walkthrough for the clicks, Clean Tech diagram to explain what happens behind the scenes.",
  "T+W": "Clean Tech explainer featuring a tilted Walkthrough screen recording for the product demo.",
  "C+P": "Keep chalk drawing, add one small character reaction beat for humour.",
  "P+C": "Pop Info character narrative with a quick chalk-drawn whiteboard explanation.",
  "K+W": "Kinetic Type title and result, with a tilted screen recording in the middle.",
  "W+K": "Walkthrough tutorial opened with bold kinetic type headlines.",
  "K+T": "Kinetic Type hook with Clean Tech feature summary cards.",
  "T+K": "Clean Tech presentation with high-impact Kinetic Type title cards.",
};

export function scoreStyles(answers: QuestionnaireAnswers): StyleScoreResult {
  const scores: Record<StyleCode, number> = {
    K: 0,
    C: 0,
    T: 0,
    W: 0,
    D: 0,
    M: 0,
    P: 0,
  };

  const add = (points?: Partial<Record<StyleCode, number>>) => {
    if (!points) return;
    for (const [code, pts] of Object.entries(points)) {
      scores[code as StyleCode] += pts || 0;
    }
  };

  if (answers.q1 && QUESTION_1_OPTIONS[answers.q1]) {
    add(QUESTION_1_OPTIONS[answers.q1].points);
  }
  if (answers.q2 && QUESTION_2_OPTIONS[answers.q2]) {
    add(QUESTION_2_OPTIONS[answers.q2].points);
  }
  if (answers.q3 && QUESTION_3_OPTIONS[answers.q3]) {
    add(QUESTION_3_OPTIONS[answers.q3].points);
  }
  if (answers.q4 && QUESTION_4_OPTIONS[answers.q4]) {
    add(QUESTION_4_OPTIONS[answers.q4].points);
  }
  if (answers.q5 && QUESTION_5_OPTIONS[answers.q5]) {
    add(QUESTION_5_OPTIONS[answers.q5].points);
  }

  // Hard elimination rules (Q6 from the guide)
  const eliminated: Partial<Record<StyleCode, string>> = {};

  if (answers.hasFootageOfUser === false) {
    eliminated.M = "No footage of yourself: Warm Canvas requires talking-head footage.";
  }
  if (answers.hasAppOrScreen === false) {
    eliminated.W = "No app or screen to show: Software Walkthrough needs a screen or app flow.";
  }
  if (answers.hasDataOrNumbers === false) {
    eliminated.D = "No data or numbers: Data Story requires verified figures and a source.";
  }
  if (answers.targetDurationSeconds !== undefined && answers.targetDurationSeconds < 15) {
    eliminated.C = "Under 15 seconds: Chalk Talk is designed for slower continuous lessons.";
  }

  const allCodes: StyleCode[] = ["K", "C", "T", "W", "D", "M", "P"];

  const ranked = allCodes
    .map((code) => {
      const isEliminated = Boolean(eliminated[code]);
      const style = STYLES[code];
      return {
        code,
        style,
        score: scores[code],
        eliminated: isEliminated,
        eliminationReason: eliminated[code],
        reason: `${style.name} (${scores[code]} pts): ${style.tagline}`,
        avoidWarning: style.avoidWhen,
      };
    })
    .sort((a, b) => {
      if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
      return b.score - a.score;
    });

  const available = ranked.filter((r) => !r.eliminated);
  const primaryItem = available[0] || ranked[0];
  const runnerUpItem = available[1] || ranked[1];

  let isTie = false;
  let hybridSuggestion: string | undefined;
  let recommendationNote = "";

  // Check top 3 scores for ties
  if (
    available.length >= 3 &&
    available[0].score === available[1].score &&
    available[1].score === available[2].score &&
    available[0].score > 0
  ) {
    isTie = true;
    recommendationNote =
      "Three or more styles are tied with equal scores. Clarify your one-sentence goal or media to break the tie.";
  } else if (available.length >= 2) {
    const diff = available[0].score - available[1].score;
    if (diff >= 4) {
      recommendationNote = `${primaryItem.style.name} leads decisively (+${diff} pts). Recommended as the single primary style.`;
    } else {
      // Top two within 3 points
      const pairKey = `${primaryItem.code}+${runnerUpItem.code}`;
      hybridSuggestion = SAFE_HYBRIDS[pairKey] || `Blend ${primaryItem.style.name} primary with elements of ${runnerUpItem.style.name}.`;
      recommendationNote = `Close match (within ${diff} pts). Primary: ${primaryItem.style.name}. Suggested hybrid: ${hybridSuggestion}`;
    }
  } else {
    recommendationNote = `${primaryItem.style.name} is the sole recommended style.`;
  }

  return {
    scores,
    ranked,
    primary: primaryItem.style,
    runnerUp: runnerUpItem?.style,
    isTie,
    hybridSuggestion,
    recommendationNote,
  };
}

/**
 * Auto-heuristic helper to pre-fill Q1 from media files
 */
export function analyzeMediaForQ1(files: Array<{ name: string; type: string; hasAudio?: boolean }>): string {
  if (files.some((f) => f.name.toLowerCase().includes("face") || f.name.toLowerCase().includes("talk") || f.name.toLowerCase().includes("camera"))) {
    return "talking_head";
  }
  if (files.some((f) => f.name.toLowerCase().includes("screen") || f.name.toLowerCase().includes("recording") || f.name.toLowerCase().includes("demo") || f.name.toLowerCase().includes("ui"))) {
    return "screen_recording";
  }
  if (files.some((f) => f.name.endsWith(".csv") || f.name.endsWith(".xlsx") || f.name.toLowerCase().includes("data") || f.name.toLowerCase().includes("metrics"))) {
    return "data_numbers";
  }
  return "ideas_words";
}
