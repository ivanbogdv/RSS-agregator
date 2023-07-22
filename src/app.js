import onChange from 'on-change';
import * as yup from 'yup';
// import i18next from 'i18next';
// import render from './view.js';

const render = (elements) => (path, value) => {
  elements.input.classList.remove('is-invalid'); // удаляем класс для ввода ошибки
  elements.feedback.classList.remove('text-success', 'text-danger');
  elements.feedback.textContent = '';

  switch (path) {
    case 'urls':
      elements.feedback.classList.add('text-success');
      elements.feedback.textContent = 'RSS успешно загружен';
      break;

    case 'form.url':
      elements.input.value = value;
      break;

    case 'form.error':
      elements.input.classList.add('is-invalid');
      elements.feedback.classList.add('text-danger');
      elements.feedback.textContent = value.message;
      break;

    default:
      break;
  }
};

export default () => {
  const elements = {
    input: document.querySelector('#url-input'), // ссылка RSS
    form: document.querySelector('.rss-form'),  // поле ввода
    feedback: document.querySelector('.feedback'), // текст ошибки
  };

  const state = onChange(
    {
      form: {
        url: null,
        error: {},
      },
      urls: [],
    },
    render(elements)
  );

  elements.form.addEventListener('submit', (e) => { // обработчик события
    e.preventDefault(); // Скидываем настройки по умолчанию

    const formData = new FormData(e.target); // Позволяет нам получить данные формы
    const url = formData.get('url').trim(); // получаем значение поля ввода с именем 'url', trim() удаляем пробелы

    state.form.url = url; // сохраняем полученное значение URL в объект состояния state

    const schema = yup.string().url().notOneOf(state.urls);

    schema // Библиотека Yup
      .validate(state.form.url)
      .then(() => {
        state.urls.push(state.form.url);
        state.form.url = null;
      })
      .catch((error) => (state.form.error = error))
      .finally(() => elements.input.focus());
  });
};