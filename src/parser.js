export default (data) => {
  const parser = new DOMParser();
  const parsedData = parser.parseFromString(data, 'application/xml');

  const parserError = parsedData.querySelector('parsererror');
  if (parserError) {
    const error = new Error(parserError.textContent);
    error.isParserError = true;
    throw error;
  }

  const channel = parsedData.querySelector('channel');
  const feedTitle = channel.querySelector('title').textContent;
  const feedDescription = channel.querySelector('description').textContent;
  const feedLink = channel.querySelector('link').textContent;

  const feed = { title: feedTitle, description: feedDescription, link: feedLink };

  const items = Array.from(parsedData.querySelectorAll('item'));

  const posts = items.map((item) => {
    const title = item.querySelector('title').textContent;
    const description = item.querySelector('description').textContent;
    const link = item.querySelector('link').textContent;

    return { title, description, link };
  });

  return { feed, posts };
};
