export function isQuestionReleased(question, now = new Date()) {
  if (!question.available_at) return true;
  return new Date(question.available_at) <= now;
}

export function filterReleasedQuestions(questions, now = new Date()) {
  if (!Array.isArray(questions)) return [];
  return questions.filter((question) => isQuestionReleased(question, now));
}

export function buildQuestionSchedule(questions, startFrom = 0, now = new Date()) {
  const ordered = [...questions].sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0));
  const schedule = [];

  for (const question of ordered) {
    const released = isQuestionReleased(question, now);
    schedule.push({
      ...question,
      released,
      index: schedule.length + startFrom,
    });
  }

  return schedule;
}
