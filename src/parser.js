export default (data) => {
  // Создаем объект DOMParser для парсинга XML-данных
  const parser = new DOMParser();
  // Парсим переданные данные и получаем DOM-документ
  const parsedData = parser.parseFromString(data, 'application/xml');

  // Проверяем, есть ли ошибка в парсинге, и если да, выбрасываем ошибку noRSS
  const error = parsedData.querySelector('parsererror');
  if (error) {
    throw new Error('noRSS');
  }

  // Извлекаем информацию о канале (feed) из DOM-документа
  const channel = parsedData.querySelector('channel');
  const feedTitle = channel.querySelector('title').textContent;
  const feedDescription = channel.querySelector('description').textContent;
  const feedLink = channel.querySelector('link').textContent;

  // Создаем объект feed с информацией о канале
  const feed = { title: feedTitle, description: feedDescription, link: feedLink };

  // Извлекаем все элементы item (посты) из DOM-документа
  const items = Array.from(parsedData.querySelectorAll('item'));

  // Для каждого элемента item формируем объект post с информацией о посте
  const posts = items.map((item) => {
    const title = item.querySelector('title').textContent;
    const description = item.querySelector('description').textContent;
    const link = item.querySelector('link').textContent;

    return { title, description, link };
  });

  // Возвращаем объект, содержащий информацию о канале (feed) и массив постов (posts)
  return { feed, posts };
};
