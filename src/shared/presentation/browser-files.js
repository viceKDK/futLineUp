/** Browser-only file adapter; validated separately from core unit coverage. */
export function installBrowserFiles(target) {
  target.fileToDataURL = function (file, maxSize = 256) {
    return new Promise((resolve, reject) => {
      const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
      if (!(file instanceof target.Blob) || !allowedTypes.has(file.type)) {
        reject(new Error("Usá una imagen JPG, PNG o WebP"));
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        reject(new Error("La imagen no puede superar 8 MB"));
        return;
      }
      const reader = new target.FileReader();
      reader.onload = (event) => {
        const img = new target.Image();
        img.onload = () => {
          if (!img.width || !img.height || img.width * img.height > 40000000) {
            reject(new Error("La imagen es demasiado grande"));
            return;
          }
          const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
          const canvas = target.document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const context = canvas.getContext("2d");
          if (!context) {
            reject(new Error("El navegador no pudo procesar la imagen"));
            return;
          }
          context.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        img.onerror = reject;
        img.src = event.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  target.downloadJSON = (value, filename) => {
    const blob = new target.Blob([JSON.stringify(value, null, 2)], { type: "application/json;charset=utf-8" });
    const url = target.URL.createObjectURL(blob);
    const link = target.document.createElement("a");
    link.href = url;
    link.download = filename;
    target.document.body.appendChild(link);
    link.click();
    link.remove();
    target.setTimeout(() => target.URL.revokeObjectURL(url), 1500);
  };
}
