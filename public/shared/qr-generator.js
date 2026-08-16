/* Requests a locally generated QR SVG, avoiding a third-party tracking service. */
window.QRGenerator = {
  setImage(image, value) {
    image.alt = `Scan to open: ${value}`;
    image.src = `/api/qr?value=${encodeURIComponent(value)}`;
  }
};
