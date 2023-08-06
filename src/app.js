import i18next from 'i18next';
import axios from 'axios';
import onChange from 'on-change';
import uniqueId from 'lodash/uniqueId.js';
import { string, setLocale } from 'yup';

import resources from './locales/index.js';
import render from './view.js';
import parser from './parser.js';

const validate = (url, urlList) => {
  const schema = string().trim().required().url()
    .notOneOf(urlList);
  return schema.validate(url);
};

// Прокси, с помощью которого можно качать потоки
const getAxiosResponse = (url) => {
  const allOrigins = 'https://allorigins.hexlet.app/get';
  const newUrl = new URL(allOrigins);
  newUrl.searchParams.set('url', url);
  newUrl.searchParams.set('disableCache', 'true');
  return axios.get(newUrl);
};

const createPosts = (state, newPosts, feedId) => {
  const preparedPosts = newPosts.map((post) => ({
    ...post,
    feedId,
    id: uniqueId(),
  }));
  state.content.posts = [...state.content.posts, ...preparedPosts];
};

const getNewPosts = (state) => state.content.feeds.map(({ link, feedId }) => getAxiosResponse(link).then((response) => {
  const { posts } = parser(response.data.contents);
  const addedPostsLinks = state.content.posts.map((post) => post.link);
  const newPosts = posts.filter(
    (post) => !addedPostsLinks.includes(post.link),
  );
  if (newPosts.length > 0) {
    createPosts(state, newPosts, feedId);
  }
  return Promise.resolve();
}));

export default () => {
  const defaultLanguage = 'ru'; // язык по умолчанию из i18next

  setLocale({ // yup, локализация для сообщений об ошибках
    mixed: { default: 'errors.default', notOneOf: 'errors.exist' },
    string: { url: 'errors.url' },
  });

  const i18nInstance = i18next.createInstance(); // объект, который будет управлять локализацией

  i18nInstance
    .init({
      lng: defaultLanguage,
      debug: true,
      resources,
    })
    .then(() => {
      const elements = { // Извлекаем элементы из HTML
        input: document.querySelector('#url-input'),
        form: document.querySelector('.rss-form'),
        exampleLink: document.querySelector('p.mt-2.mb-0'),
        feedback: document.querySelector('.feedback'),
        feeds: document.querySelector('.feeds'),
        posts: document.querySelector('.posts'),
        button: document.querySelector('button[type="submit"]'),
        modal: { // модальное окно
          button: document.querySelector('.full-article'),
          modalWindow: document.querySelector('.modal'),
          title: document.querySelector('.modal-title'),
          body: document.querySelector('.modal-body'),
        },
      };

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

      const watchedState = onChange(initialState, render(elements, initialState, i18nInstance));

      getNewPosts(watchedState);

      // setLocale из yup
      setLocale({
        mixed: {
          notOneOf: 'exist',
        },
        string: {
          url: 'url',
        },
      });

      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();

        watchedState.process.processState = 'filling';
        watchedState.inputValue = e.target.value;
        console.log('TEST MESSEGE!!!');
      });

      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const urlList = watchedState.content.feeds.map(({ link }) => link);

        validate(watchedState.inputValue, urlList)
          .then(() => {
            watchedState.valid = true;
            watchedState.process.processState = 'sending';
            return getAxiosResponse(watchedState.inputValue);
          })

          .then((response) => {
            const data = response.data.contents;
            const { feed, posts } = parser(data, i18nInstance, elements);
            console.log('parser');
            const feedId = uniqueId();

            watchedState.content.feeds.push({
              ...feed,
              feedId,
              link: watchedState.inputValue,
            });
            createPosts(watchedState, posts, feedId);
            watchedState.process.processState = 'finished';
            console.log('finished!!!');
          })
          .catch((error) => {
            watchedState.valid = false;
            console.log(error.message);
            watchedState.process.error = error.message ?? 'defaultError';
            watchedState.process.processState = 'error';
          });
      });
    });
};
