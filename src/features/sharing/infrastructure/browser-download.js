export function createDownloadPort(target) {
  return ({ blob, filename }) => {
    const url = target.URL.createObjectURL(blob);
    let anchor,
      clicked = false;
    try {
      anchor = target.document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      target.document.body.appendChild(anchor);
      anchor.click();
      clicked = true;
    } finally {
      anchor?.remove();
      if (clicked)
        target.setTimeout(() => target.URL.revokeObjectURL(url), 1500);
      else target.URL.revokeObjectURL(url);
    }
  };
}
