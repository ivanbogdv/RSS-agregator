import i18next from 'i18next';
import { setLocale } from 'yup';
import init from './init.js';
import resources from './locales/index.js';

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
    .then(() => init(i18nInstance));
};
