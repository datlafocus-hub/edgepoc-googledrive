/**
 * Turns each row (label | body) into a native details/summary item.
 * @param {Element} block The accordion block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const [label, body] = row.children;
    if (!label || !label.textContent.trim()) {
      row.remove();
      return;
    }

    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    summary.append(...label.childNodes);

    const details = document.createElement('details');
    details.className = 'accordion-item';
    details.append(summary);
    if (body) {
      body.className = 'accordion-item-body';
      details.append(body);
    }
    row.replaceWith(details);
  });
}
