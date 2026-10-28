/**
 * Fetches rows from a spreadsheet published as JSON (e.g. `/products.json`).
 * @param {string} path Spreadsheet path, with or without `.json`
 * @returns {Promise<Object[]>} The sheet rows
 */
async function fetchRows(path) {
  const url = new URL(path, window.location);
  if (!url.pathname.endsWith('.json')) url.pathname += '.json';
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`${resp.status} ${url}`);
  const json = await resp.json();
  return json.data || [];
}

/**
 * Builds one product card from a sheet row.
 * @param {Object} row Sheet row keyed by column header
 * @returns {HTMLLIElement}
 */
function buildCard(row) {
  const li = document.createElement('li');
  li.className = 'product-list-card';
  li.dataset.category = row.Category || '';

  if (row.Image) {
    const img = document.createElement('img');
    img.src = row.Image;
    img.alt = row.Name || '';
    img.loading = 'lazy';
    img.width = 600;
    img.height = 400;
    li.append(img);
  }

  const body = document.createElement('div');
  body.className = 'product-list-card-body';

  if (row.Category) {
    const category = document.createElement('p');
    category.className = 'product-list-category';
    category.textContent = row.Category;
    body.append(category);
  }

  const title = document.createElement('h3');
  if (row.Link) {
    const a = document.createElement('a');
    a.href = row.Link;
    a.textContent = row.Name;
    title.append(a);
  } else {
    title.textContent = row.Name;
  }
  body.append(title);

  if (row.Description) {
    const description = document.createElement('p');
    description.textContent = row.Description;
    body.append(description);
  }

  if (row.Price) {
    const price = document.createElement('p');
    price.className = 'product-list-price';
    price.textContent = row.Price;
    body.append(price);
  }

  li.append(body);
  return li;
}

/**
 * Adds category filter buttons above the list.
 * @param {Element} block The product-list block element
 * @param {HTMLUListElement} list The list of cards
 * @param {string[]} categories Unique category names
 */
function buildFilters(block, list, categories) {
  const filters = document.createElement('div');
  filters.className = 'product-list-filters';
  ['All', ...categories].forEach((category) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = category;
    button.setAttribute('aria-pressed', category === 'All');
    button.addEventListener('click', () => {
      filters.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b === button));
      list.querySelectorAll('.product-list-card').forEach((card) => {
        card.hidden = category !== 'All' && card.dataset.category !== category;
      });
    });
    filters.append(button);
  });
  block.prepend(filters);
}

/**
 * Renders spreadsheet rows as product cards.
 * The block holds a link (or text path) to the spreadsheet, e.g. `/products`.
 * @param {Element} block The product-list block element
 */
export default async function decorate(block) {
  const link = block.querySelector('a[href]');
  const path = link ? link.getAttribute('href') : block.textContent.trim();
  block.textContent = '';
  if (!path) return;

  let rows;
  try {
    rows = (await fetchRows(path)).filter((row) => row.Name);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('product-list: failed to load', error);
    return;
  }
  if (!rows.length) return;

  const list = document.createElement('ul');
  rows.forEach((row) => list.append(buildCard(row)));
  block.append(list);

  const categories = [...new Set(rows.map((row) => row.Category).filter(Boolean))];
  if (categories.length > 1) buildFilters(block, list, categories);
}
