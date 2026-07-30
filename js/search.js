(() => {
  "use strict";
  const normalize = value => String(value || '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
  const tokens = value => normalize(value).split(/[\s,、。・/]+/).filter(Boolean);

  function scoreFAQ(faq, query, language='ja') {
    const q = normalize(query);
    if (!q) return 0;
    const question = normalize(language === 'ja' ? faq.q_ja : faq.q_en);
    const answer = normalize(language === 'ja' ? faq.a_ja : faq.a_en);
    const keywords = normalize((faq.keywords || []).join(' '));
    const category = normalize(faq.category);
    let score = 0;
    if (question === q) score += 100;
    if (question.includes(q)) score += 55;
    if (keywords.includes(q)) score += 35;
    if (answer.includes(q)) score += 18;
    if (category.includes(q)) score += 12;
    for (const token of tokens(q)) {
      if (question.includes(token)) score += 12;
      if (keywords.includes(token)) score += 9;
      if (answer.includes(token)) score += 4;
    }
    return score;
  }

  function search(faqs, query, language='ja', limit=8) {
    return faqs.map(faq => ({faq, score:scoreFAQ(faq, query, language)}))
      .filter(item => item.score > 0)
      .sort((a,b) => b.score - a.score)
      .slice(0, limit);
  }

  window.AJITOSearch = {normalize, scoreFAQ, search};
})();
