/**
 * Resolves an authored link into an embeddable iframe URL.
 * @param {URL} url The authored link
 * @param {boolean} autoplay Whether playback should start on load
 * @returns {{ src: string, type: string } | null}
 */
function getEmbedSource(url, autoplay) {
  const { hostname, pathname, searchParams } = url;
  const play = autoplay ? '1' : '0';

  if (hostname.endsWith('youtube.com') || hostname === 'youtu.be') {
    let id = searchParams.get('v');
    if (hostname === 'youtu.be') [, id] = pathname.split('/');
    else if (/^\/(shorts|embed|live)\//.test(pathname)) [, , id] = pathname.split('/');
    if (!id) return null;
    return {
      type: 'youtube',
      src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&autoplay=${play}`,
    };
  }

  if (hostname.endsWith('vimeo.com')) {
    const id = pathname.split('/').filter(Boolean).find((p) => /^\d+$/.test(p));
    if (!id) return null;
    return {
      type: 'vimeo',
      src: `https://player.vimeo.com/video/${id}?dnt=1&autoplay=${play}`,
    };
  }

  if (url.protocol !== 'https:') return null;
  return { type: 'generic', src: url.href };
}

/**
 * Replaces the block content with the embed iframe.
 * @param {Element} block The embed block element
 * @param {{ src: string, type: string }} source The embed source
 * @param {string} title Accessible title for the iframe
 */
function loadEmbed(block, source, title) {
  const iframe = document.createElement('iframe');
  iframe.src = source.src;
  iframe.title = title;
  iframe.loading = 'lazy';
  iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
  iframe.allowFullscreen = true;
  block.classList.add(`embed-${source.type}`, 'embed-loaded');
  block.replaceChildren(iframe);
}

/**
 * Embeds a YouTube, Vimeo or generic https link. With an authored image,
 * shows it as a poster and only loads the embed on click.
 * @param {Element} block The embed block element
 */
export default function decorate(block) {
  const link = block.querySelector('a[href]');
  if (!link) return;

  let url;
  try {
    url = new URL(link.href);
  } catch {
    return;
  }

  const title = link.title && link.title !== link.href ? link.title : 'Embedded content';
  const poster = block.querySelector('picture');

  if (poster) {
    const source = getEmbedSource(url, true);
    if (!source) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'embed-poster';
    button.setAttribute('aria-label', `Play: ${title}`);
    button.append(poster);
    button.addEventListener('click', () => loadEmbed(block, source, title));
    block.replaceChildren(button);
    return;
  }

  const source = getEmbedSource(url, false);
  if (!source) return;
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      loadEmbed(block, source, title);
    }
  });
  observer.observe(block);
}
