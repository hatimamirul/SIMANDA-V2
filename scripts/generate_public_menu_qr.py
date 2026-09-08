from pathlib import Path

import cv2
import qrcode
from PIL import Image, ImageDraw, ImageFilter, ImageFont

URL = "https://simandasppg.vercel.app/menu-hari-ini"
ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "public"
PNG_PATH = OUTPUT_DIR / "qr-menu-hari-ini.png"

NAVY = "#0A4E78"
BLUE = "#0F6F9F"
LIGHT_BLUE = "#EAF7FF"
GOLD = "#F9C74F"
TEXT = "#102A43"
MUTED = "#5E7184"


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(Path("C:/Windows/Fonts") / name, size)


def centered(draw: ImageDraw.ImageDraw, text: str, y: int, font_obj, fill: str) -> None:
    box = draw.textbbox((0, 0), text, font=font_obj)
    draw.text(((1400 - (box[2] - box[0])) // 2, y), text, font=font_obj, fill=fill)


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=18,
        border=5,
    )
    qr.add_data(URL)
    qr.make(fit=True)
    qr_image = qr.make_image(fill_color=NAVY, back_color="white").convert("RGB")
    qr_image = qr_image.resize((900, 900), Image.Resampling.NEAREST)

    canvas = Image.new("RGB", (1400, 1700), LIGHT_BLUE)
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((70, 65, 1330, 1635), radius=58, fill="white")
    draw.rounded_rectangle((70, 65, 1330, 405), radius=58, fill=NAVY)
    draw.rectangle((70, 330, 1330, 405), fill=NAVY)

    # Header accent and content.
    draw.rounded_rectangle((545, 116, 855, 175), radius=30, fill="#2C789F", outline="#79B6D3", width=2)
    centered(draw, "INFORMASI MENU PUBLIK", 130, font("arialbd.ttf", 25), "white")
    centered(draw, "MENU HARI INI", 205, font("arialbd.ttf", 74), "white")
    centered(draw, "SPPG KEDIRI NGADILUWIH TALES", 302, font("arialbd.ttf", 28), "#D8F0FF")

    # QR card with a subtle blue frame.
    draw.rounded_rectangle((190, 470, 1210, 1490), radius=42, fill="#F8FCFF", outline="#C7E6F7", width=5)
    canvas.paste(qr_image, (250, 530))
    centered(draw, "SCAN UNTUK MELIHAT MENU HARI INI", 1465, font("arialbd.ttf", 27), TEXT)
    centered(draw, "Arahkan kamera ponsel ke QR Code ini", 1510, font("arial.ttf", 22), MUTED)

    draw.rounded_rectangle((425, 1570, 975, 1612), radius=21, fill="#FFF5D6")
    centered(draw, "TANPA IKLAN • LANGSUNG KE HALAMAN MENU", 1578, font("arialbd.ttf", 17), "#8A5A00")

    canvas.save(PNG_PATH, "PNG", optimize=True)

    decoded, _, _ = cv2.QRCodeDetector().detectAndDecode(cv2.imread(str(PNG_PATH)))
    if decoded != URL:
        raise RuntimeError(f"QR verification failed: {decoded!r}")

    print(f"Created and verified: {PNG_PATH}")
    print(f"QR target: {decoded}")


if __name__ == "__main__":
    main()
