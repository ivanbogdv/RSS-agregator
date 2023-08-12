import i18next from 'i18next';
import axios from 'axios';
import onChange from 'on-change';
import uniqueId from 'lodash/uniqueId.js';
import { string, setLocale } from 'yup';

import resources from './locales/index.js';
import render from './view.js';
import parser from './parser.js';

// Функция для валидации URL
const validate = (url, urlList) => {
  const schema = string()
    .trim()
    .required()
    .url()
    .notOneOf(urlList);
  return schema.validate(url);
};

// Функция для получения данных по URL с помощью Axios
const getAxiosResponse = (url) => {
  const allOrigins = 'https://allorigins.hexlet.app/get';
  const newUrl = new URL(allOrigins);
  newUrl.searchParams.set('url', url);
  newUrl.searchParams.set('disableCache', 'true');
  return axios.get(newUrl);
};

// Функция для создания постов
const createPosts = (state, newPosts, feedId) => {
  const preparedPosts = newPosts.map((post) => ({
    ...post,
    feedId,
    id: uniqueId(),
  }));
  // Обновляем состояние добавлением новых постов
  state.content.posts = [...state.content.posts, ...preparedPosts];
};

// Функция для получения новых постов с помощью Axios
const getNewPosts = (state) => {
  const allFeeds = state.content.feeds;
  allFeeds.map(({ link, feedId }) => getAxiosResponse(link).then((response) => {
    const { posts } = parser(response.data.contents);
    const addedPosts = state.content.posts.map((post) => post.link);
    const newPosts = posts.filter((post) => !addedPosts.includes(post.link));
    if (newPosts.length > 0) {
      createPosts(state, newPosts, feedId);
    }
    return Promise.resolve();
  }));
};

export default () => {
  // Язык по умолчанию для i18next
  const defaultLanguage = 'ru';
  // Создаем экземпляр i18n для локализации
  const i18nInstance = i18next.createInstance();
  i18nInstance
    .init({
      lng: defaultLanguage,
      debug: true,
      resources,
    })
    .then(() => {
      // Получаем элементы DOM
      const elements = {
        form: document.querySelector('.rss-form'),
        input: document.querySelector('input[id="url-input"]'),
        button: document.querySelector('button[type="submit"]'),
        feedback: document.querySelector('.feedback'),
        feeds: document.querySelector('.feeds'),
        posts: document.querySelector('.posts'),
        modal: {
          modalWindow: document.querySelector('.modal'),
          title: document.querySelector('.modal-title'),
          body: document.querySelector('.modal-body'),
          button: document.querySelector('.full-article'),
        },
      };

      // Начальное состояние приложения
      const initialState = {
        inputValue: '',
        valid: true,
        process: {
          processState: 'filling',
          error: '',
        },
        content: {
          posts: [],
          feeds: [],
        },
      };

      // Создаем прослушиваемое состояние через библиотеку onChange
      const watchedState = onChange(
        initialState,
        render(elements, initialState, i18nInstance),
      );

      // Получаем новые посты и обновляем состояние
      getNewPosts(watchedState);

      // Устанавливаем локализацию для Yup
      setLocale({
        mixed: {
          notOneOf: 'exist',
        },
        string: {
          url: 'urlError',
        },
      });

      // Слушаем событие ввода в форме
      elements.form.addEventListener('input', (e) => {
        e.preventDefault();
        // Обновляем состояние при вводе данных
        watchedState.process.processState = 'filling';
        watchedState.inputValue = e.target.value;
        // console.log('TEST MESSEGE!!!');
      });

      // Слушаем событие отправки формы
      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        // Получаем список существующих URL-ов
        const urlList = watchedState.content.feeds.map(({ link }) => link);

        // Валидация URL
        validate(watchedState.inputValue, urlList)
          .then(() => {
            // Обновляем состояние перед отправкой запроса
            watchedState.valid = true;
            watchedState.process.processState = 'sending';
            return getAxiosResponse(watchedState.inputValue);
          })

          .then((response) => {
            // Обработка ответа и добавление новых данных
            const data = response.data.contents;
            const { feed, posts } = parser(data, i18nInstance, elements);

            console.log(feed);
            console.log(posts);

            const feedId = uniqueId();

            // Добавляем новый фид и посты в состояние
            watchedState.content.feeds.push({
              ...feed,
              feedId,
              link: watchedState.inputValue,
            });
            createPosts(watchedState, posts, feedId);

            // Обновляем состояние после успешного завершения
            watchedState.process.processState = 'finished';
          })
          .catch((error) => {
            // Обработка ошибок
            watchedState.valid = false;
            // console.log(error.message);
            watchedState.process.error = error.message ?? 'defaultError';
            watchedState.process.processState = 'error';
          });
      });
    });
};
