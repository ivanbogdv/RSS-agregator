import render from './view.js';
import { string } from 'yup';
import onChange from 'on-change';


export default (i18nInstance) => {
  const elements = { // Извлекаем элементы из HTML
    input: document.querySelector('#url-input'),
    form: document.querySelector('.rss-form'),
    exampleLink: document.querySelector('p.mt-2.mb-0'),
    feedback: document.querySelector('.feedback'),
  };

  const state = onChange( // Состояние
    {
      form: {
        url: null,
        error: {},
      },
      urls: [],
    },
    render(elements, i18nInstance)
  );

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(e.target); // Данные из формы, отправленные пользователем
    const url = formData.get('url').trim(); // Извлекаем значение введенное пользователем

    state.form.url = url; // Сохранили данные в переменной

    const schema = string().url().notOneOf(state.urls); // Проверка на повтор и на URL-адрес

    schema
      .validate(state.form.url)
      .then(() => {
        state.urls.push(state.form.url); // Добавляем введенный URL-адрес в список
        state.form.url = null; // Обнуляем поле ввода
      })
      .catch((error) => (state.form.error = error)) // Сохраняем ошибку в переменную
      .finally(() => elements.input.focus()); // Снова фокусируем курсор на поле ввода
  });
};
