let tabsCount = 0;

/**
 * Activates a tab and shows its panel.
 * @param {Element} block The tabs block element
 * @param {HTMLButtonElement} tab The tab button to activate
 */
function selectTab(block, tab) {
  block.querySelectorAll('[role=tab]').forEach((t) => {
    const selected = t === tab;
    t.setAttribute('aria-selected', selected);
    t.tabIndex = selected ? 0 : -1;
  });
  block.querySelectorAll('[role=tabpanel]').forEach((panel) => {
    panel.hidden = panel.id !== tab.getAttribute('aria-controls');
  });
}

/**
 * Turns each row (label | content) into a tab and panel.
 * @param {Element} block The tabs block element
 */
export default function decorate(block) {
  tabsCount += 1;
  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');

  [...block.children].forEach((row, i) => {
    const [label, content] = row.children;
    if (!label || !label.textContent.trim()) {
      row.remove();
      return;
    }
    const id = `tabs-${tabsCount}-${i}`;

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tabs-tab';
    tab.id = `${id}-tab`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', `${id}-panel`);
    tab.textContent = label.textContent.trim();
    tab.addEventListener('click', () => selectTab(block, tab));
    tablist.append(tab);

    row.className = 'tabs-panel';
    row.id = `${id}-panel`;
    row.setAttribute('role', 'tabpanel');
    row.setAttribute('aria-labelledby', tab.id);
    row.tabIndex = 0;
    label.remove();
    if (!content) row.append(document.createElement('div'));
  });

  const tabs = [...tablist.children];
  if (!tabs.length) return;

  tablist.addEventListener('keydown', (e) => {
    const current = tabs.indexOf(document.activeElement);
    if (current < 0) return;
    let next;
    if (e.key === 'ArrowRight') next = (current + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    tabs[next].focus();
    selectTab(block, tabs[next]);
  });

  block.prepend(tablist);
  selectTab(block, tabs[0]);
}
