import {translate} from './locales.mjs';
// Presentation polish observes existing forms without changing their submission logic.
const form = document.getElementById('practice');
if (form) {
  const questions = document.getElementById('questions');
  const progress = document.getElementById('answerProgress');
  const progressText = document.getElementById('answerProgressText');
  function update() {
    const inputs = [...questions.querySelectorAll('textarea')];
    const answered = inputs.filter(input => input.value.trim().length >= 2).length;
    const language = document.getElementById('language').value;
    progress.value = answered;
    progressText.textContent = translate('progress',language,{count:answered,total:inputs.length||15});
    inputs.forEach((input, index) => {
      const card = input.closest('.card');
      if (card.querySelector('.question-counter')) return;
      const counter = document.createElement('p');
      counter.className = 'question-counter';
      counter.textContent = `${translate('question',language)} ${index + 1} / 15`;
      const hint = document.createElement('p');
      hint.className = 'question-hint';
      hint.textContent = translate('starHint',language);
      card.prepend(counter);
      input.before(hint);
      input.placeholder = translate('answerPlaceholder',language);
    });
  }
  questions.addEventListener('input', update);
  document.getElementById('language').addEventListener('change',update);
  new MutationObserver(update).observe(questions,{childList:true});
  update();
}
