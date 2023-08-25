const finishWithError = (elements, error, i18nInstance) => {
  const newElements = { ...elements };

  newElements.feedback.classList.remove('text-success');
  newElements.feedback.classList.add('text-danger');
  newElements.feedback.textContent = i18nInstance.t(`errors.${error.replace(/ /g, '')}`);

  newElements.input.classList.add('is-invalid');
  newElements.button.disabled = false;
  newElements.input.disabled = false;

  return newElements;
};

const successFinish = (elements, i18nInstance) => {
  const newElements = { ...elements };

  newElements.feedback.classList.remove('text-danger');
  newElements.feedback.classList.add('text-success');
  newElements.feedback.textContent = i18nInstance.t('sucсess');

  newElements.input.classList.remove('is-invalid');
  newElements.button.removeAttribute('disabled');
  newElements.input.removeAttribute('readonly');

  newElements.input.focus();
  newElements.form.reset();

  return newElements;
};

const renderPosts = (state, div, i18nInstance) => {
  const ul = document.createElement('ul');
  ul.classList.add('list-group', 'border-0', 'rounded-0');

  state.content.posts.forEach((post) => {
    const { title, link, id } = post;

    const li = document.createElement('li');
    li.classList.add(
      'list-group-item',
      'd-flex',
      'justify-content-between',
      'align-items-start',
      'border-0',
      'border-end-0',
    );

    const setAttributes = (el, atributes) => {
      Object.entries(atributes).forEach((element) => {
        const [key, value] = element;
        el.setAttribute(key, value);
      });
    };

    const a = document.createElement('a');
    setAttributes(a, {
      href: link,
      'data-id': id,
      target: '_blank',
      rel: 'noopener noreferrer',
    });

    a.classList.add('fw-bold');
    if (state.uiState.alreadyVisitedLink.has(id)) {
      a.classList.remove('fw-bold');
      a.classList.add('fw-normal', 'link-secondary');
    }

    a.textContent = title;

    const button = document.createElement('button');
    setAttributes(button, {
      type: 'button',
      'data-id': id,
      'data-bs-toggle': 'modal',
      'data-bs-target': '#modal',
    });
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    button.textContent = i18nInstance.t('button');

    li.append(a, button);
    ul.append(li);
  });
  div.append(ul);
};

const renderFeeds = (state, div) => {
  const ul = document.createElement('ul');
  ul.classList.add('list-group', 'border-0', 'rounded-0');

  state.content.feeds.forEach((feed) => {
    const { title, description } = feed;

    const li = document.createElement('li');
    li.classList.add('list-group-item', 'border-0', 'border-end-0');

    const h3 = document.createElement('h3');
    h3.classList.add('h6', 'm-0');
    h3.textContent = title;

    const p = document.createElement('p');
    p.classList.add('m-0', 'small', 'text-black-50');
    p.textContent = description;

    li.append(h3, p);
    ul.append(li);
  });

  div.append(ul);
};

const renderModalWindow = (elements, state, postId) => {
  const newElements = { ...elements };
  const currentPost = state.content.posts.find(({ id }) => id === postId);
  const { title, description, link } = currentPost;

  newElements.modal.title.textContent = title;
  newElements.modal.body.textContent = description;
  newElements.modal.button.setAttribute('href', link);
};

const createContainer = (type, elements, state, i18nInstance) => {
  const newElements = { ...elements };

  newElements[type].textContent = '';
  const divCard = document.createElement('div');
  divCard.classList.add('card', 'border-0');

  const divCardBody = document.createElement('div');
  divCardBody.classList.add('card-body');

  const divCardBodyTitle = document.createElement('h2');
  divCardBodyTitle.classList.add('card-title', 'h4');
  divCardBodyTitle.textContent = i18nInstance.t(type);

  divCardBody.append(divCardBodyTitle);
  divCard.append(divCardBody);
  newElements[type].append(divCard);

  if (type === 'posts') {
    renderPosts(state, divCard, i18nInstance);
  }

  if (type === 'feeds') {
    renderFeeds(state, divCard);
  }

  return newElements;
};

const handlerProcessState = (elements, state, value, i18nInstance) => {
  const newElements = { ...elements };

  switch (value) {
    case 'filling':
      break;
    case 'finished':
      successFinish(newElements, i18nInstance);
      break;
    case 'error':
      finishWithError(newElements, state.process.error, i18nInstance);
      break;
    case 'sending':
      newElements.button.disabled = true;
      newElements.input.readOnly = true;
      break;
    default:
      throw new Error(`Неизвестное состояние процесса: ${value}`);
  }

  return newElements;
};

export default (elements, state, i18nInstance) => (path, value) => {
  switch (path) {
    case 'process.processState':
      handlerProcessState(elements, state, value, i18nInstance);
      break;

    case 'content.posts':
      createContainer('posts', elements, state, i18nInstance);
      break;

    case 'content.feeds':
      createContainer('feeds', elements, state, i18nInstance);
      break;

    case 'uiState.alreadyVisitedLink':
      createContainer('posts', elements, state, i18nInstance);
      break;

    case 'uiState.modalId':
      renderModalWindow(elements, state, value);
      break;

    default:
      break;
  }
};
