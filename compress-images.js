const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, 'src/main/resources/static/images');
const files = fs.readdirSync(imgDir).filter(f => /\.(jpg|jpeg|png)$/i.test(f));

async function compress() {
    let totalBefore = 0, totalAfter = 0;

    for (const file of files) {
        const filePath = path.join(imgDir, file);
        const sizeBefore = fs.statSync(filePath).size;
        totalBefore += sizeBefore;

        const tmpPath = filePath + '.tmp';
        await sharp(filePath)
            .jpeg({ quality: 82, progressive: true, mozjpeg: true })
            .toFile(tmpPath);

        const sizeAfter = fs.statSync(tmpPath).size;

        // Solo reemplazar si la versión comprimida es más pequeña
        if (sizeAfter < sizeBefore) {
            fs.renameSync(tmpPath, filePath);
            totalAfter += sizeAfter;
            const pct = Math.round((1 - sizeAfter / sizeBefore) * 100);
            console.log(`✓ ${file}: ${(sizeBefore/1024).toFixed(0)}KB → ${(sizeAfter/1024).toFixed(0)}KB (-${pct}%)`);
        } else {
            fs.unlinkSync(tmpPath);
            totalAfter += sizeBefore;
            console.log(`- ${file}: ya estaba optimizada, sin cambios`);
        }
    }

    console.log(`\nTotal: ${(totalBefore/1024/1024).toFixed(1)}MB → ${(totalAfter/1024/1024).toFixed(1)}MB (-${Math.round((1 - totalAfter/totalBefore)*100)}%)`);
}

compress().catch(console.error);
