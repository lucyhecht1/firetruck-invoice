export function getBase64JPEGImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = url;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            const base64 = canvas.toDataURL("image/jpeg", .3); // 30% quality - pdfs are too big and won't send
            resolve(base64);
        };
        img.onerror = (err) => reject(err);
    });
}