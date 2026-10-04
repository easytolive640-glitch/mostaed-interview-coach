// Presentation polish observes existing forms without changing their submission logic.
const form = document.getElementById('practice');
if (form) {
  const questions = document.getElementById('questions');
  const progress = document.getElementById('answerProgress');
  const progressText = document.getElementById('answerProgressText');
  function update() {
    const inputs = [...questions.querySelectorAll('textarea')];
    const answered = inputs.filter(input => input.value.trim().length >= 2).length;
    const arabic = document.getElementById('language').value === 'arabic';
    progress.value = answered;
    progressText.textContent = arabic ? `${answered} / ${inputs.length || 15} إجابة مكتملة` : `${answered} / ${inputs.length || 15} answers completed`;
    inputs.forEach((input, index) => {
      const card = input.closest('.card');
      if (card.querySelector('.question-counter')) return;
      const counter = document.createElement('p');
      counter.className = 'question-counter';
      counter.textContent = arabic ? `السؤال ${index + 1} / 15` : `QUESTION ${String(index + 1).padStart(2,'0')} / 15`;
      const hint = document.createElement('p');
      hint.className = 'question-hint';
      hint.textContent = arabic ? 'استخدم مثالاً محدداً: الموقف، المهمة، الإجراء، النتيجة.' : 'Use a specific example: situation, task, action, result.';
      card.prepend(counter);
      input.before(hint);
      input.placeholder = arabic ? 'اكتب إجابتك هنا…' : 'Write your answer here…';
    });
  }
  questions.addEventListener('input', update);
  new MutationObserver(update).observe(questions,{childList:true});
  update();
}
