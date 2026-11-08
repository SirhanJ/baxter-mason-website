// Share branding for business pages only. Preserve article, property and team images.
const IMAGE = "https://www.baxtermason.com.au/brand/social-logo-20261108.png";
function isBusinessPage(url) {
  const pathname = new URL(url, "https://www.baxtermason.com.au").pathname;
  return !/^\/(?:blog-|story-|post\/|blog\/|success-stories-buyers-agent-sunshine-coast\/|sally-blyth|kelly-galletly)/i.test(pathname);
}
function applyBusinessShareImage(html, url) {
  if (!isBusinessPage(url)) return html;
  return html.replace(/<head\b[^>]*>[\s\S]*?<\/head>/i, head => {
    const cleaned = head.replace(/<meta\b(?=[^>]*(?:property|name)=["'](?:og:image(?::(?:width|height|type|alt|secure_url))?|twitter:image(?::alt)?|twitter:card)["'])[^>]*>[ \t]*(?:\r?\n)?/gi, "");
    const tags = [
      '<meta property="og:image" content="' + IMAGE + '">',
      '<meta property="og:image:width" content="1200">',
      '<meta property="og:image:height" content="630">',
      '<meta property="og:image:type" content="image/png">',
      '<meta property="og:image:alt" content="Baxter &amp; Mason logo">',
      '<meta name="twitter:card" content="summary_large_image">',
      '<meta name="twitter:image" content="' + IMAGE + '">',
      '<meta name="twitter:image:alt" content="Baxter &amp; Mason logo">',
    ].join('\r\n');
    return cleaned.replace(/<\/head>/i, tags + '\r\n</head>');
  });
}
module.exports = { IMAGE, isBusinessPage, applyBusinessShareImage };
