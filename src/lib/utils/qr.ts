import QRCode from "qrcode";

export async function qrDataUrl(payload: string) {
  return QRCode.toDataURL(payload, {
    margin: 1,
    width: 320,
    color: {
      dark: "#C89B3C",
      light: "#00000000",
    },
  });
}

