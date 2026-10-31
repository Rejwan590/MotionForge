import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { scoreStyles, analyzeMediaForQ1 } from "../score.js";

describe("Style Selector Guide Tests", () => {
  it("Worked Example A: 'How to land your first client with AI automations' (30-second Reel)", () => {
    // Q1: ideas_words (K+2, T+2, C+1, P+1)
    // Q2: hyped (K+3, T+1)
    // Q3: loud (K+3)
    // Q4: under_60 (K+2, P+1, T+1)
    // Q5: creators (K+2, T+1)
    // Totals: K 12, T 5, P 2, C 1
    const result = scoreStyles({
      q1: "ideas_words",
      q2: "hyped",
      q3: "loud",
      q4: "under_60",
      q5: "creators",
    });

    assert.equal(result.scores.K, 12, "Kinetic Type should have 12 points");
    assert.equal(result.scores.T, 5, "Clean Tech should have 5 points");
    assert.equal(result.scores.P, 2, "Pop Info should have 2 points");
    assert.equal(result.scores.C, 1, "Chalk Talk should have 1 point");
    assert.equal(result.primary.code, "K", "Winner should be Kinetic Type");
    assert.equal(result.isTie, false);
  });

  it("Worked Example B: 'How to set up our new dashboard' (5-minute tutorial)", () => {
    // Q1: screen_recording (W+3, K+1, T+1)
    // Q2: task_click_by_click (W+3)
    // Q3: calm (T+2, W+2, D+2, M+1)
    // Q4: three_to_ten_min (W+2, C+2, M+2, D+1)
    // Q5: software_users (W+2, T+2)
    // Totals: W 12, T 5, D 3, M 3, C 2, K 1
    const result = scoreStyles({
      q1: "screen_recording",
      q2: "task_click_by_click",
      q3: "calm",
      q4: "three_to_ten_min",
      q5: "software_users",
    });

    assert.equal(result.scores.W, 12, "Software Walkthrough should have 12 points");
    assert.equal(result.scores.T, 5, "Clean Tech should have 5 points");
    assert.equal(result.scores.D, 3, "Data Story should have 3 points");
    assert.equal(result.scores.M, 3, "Warm Canvas should have 3 points");
    assert.equal(result.scores.C, 2, "Chalk Talk should have 2 points");
    assert.equal(result.scores.K, 1, "Kinetic Type should have 1 point");
    assert.equal(result.primary.code, "W", "Winner should be Software Walkthrough");
  });

  it("Worked Example C: '3 lessons I learned freelancing' (6-minute talking head)", () => {
    // Q1: talking_head (M+3, K+1)
    // Q2: trust_personally (M+3, C+1)
    // Q3: warm (M+3, D+1)
    // Q4: three_to_ten_min (W+2, C+2, M+2, D+1)
    // Q5: own_followers (M+2, K+1)
    // Totals: M 13, C 3, K 2, D 2, W 2
    const result = scoreStyles({
      q1: "talking_head",
      q2: "trust_personally",
      q3: "warm",
      q4: "three_to_ten_min",
      q5: "own_followers",
    });

    assert.equal(result.scores.M, 13, "Warm Canvas should have 13 points");
    assert.equal(result.scores.C, 3, "Chalk Talk should have 3 points");
    assert.equal(result.scores.K, 2, "Kinetic Type should have 2 points");
    assert.equal(result.scores.D, 2, "Data Story should have 2 points");
    assert.equal(result.scores.W, 2, "Software Walkthrough should have 2 points");
    assert.equal(result.primary.code, "M", "Winner should be Warm Canvas");
  });

  it("Hard rule: eliminates Warm Canvas when hasFootageOfUser is false", () => {
    const result = scoreStyles({
      q1: "talking_head",
      q2: "trust_personally",
      q3: "warm",
      q4: "three_to_ten_min",
      q5: "own_followers",
      hasFootageOfUser: false, // Rule Q6
    });

    assert.ok(result.ranked.find((r) => r.code === "M")?.eliminated, "Warm Canvas must be eliminated");
    assert.notEqual(result.primary.code, "M", "Primary should fall back to next highest valid style");
  });

  it("Hard rule: eliminates Chalk Talk under 15 seconds", () => {
    const result = scoreStyles({
      q1: "ideas_words",
      q2: "understand",
      q3: "teacher",
      q4: "under_60",
      q5: "students",
      targetDurationSeconds: 10,
    });

    assert.ok(result.ranked.find((r) => r.code === "C")?.eliminated, "Chalk Talk must be eliminated under 15s");
  });

  it("Analyze media heuristic identifies talking_head and data files", () => {
    assert.equal(analyzeMediaForQ1([{ name: "my_talking_head.mp4", type: "video" }]), "talking_head");
    assert.equal(analyzeMediaForQ1([{ name: "q3_revenue.csv", type: "document" }]), "data_numbers");
    assert.equal(analyzeMediaForQ1([{ name: "app_demo_screen.mp4", type: "video" }]), "screen_recording");
    assert.equal(analyzeMediaForQ1([{ name: "script.txt", type: "document" }]), "ideas_words");
  });
});
