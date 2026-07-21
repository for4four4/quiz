// Минифицирует public/embed.js → public/embed.min.js (запускается перед next build).
// Клиенты вставляют лёгкий embed.min.js; данные квиза скрипт тянет по API,
// поэтому изменения в редакторе подхватываются сразу после «Сохранить».
import { readFile, writeFile } from "node:fs/promises";
import { minify } from "terser";

const src = await readFile(new URL("../public/embed.js", import.meta.url), "utf8");
const out = await minify(src, { compress: true, mangle: true, format: { comments: /^!/ } });
if (!out.code) throw new Error("terser вернул пустой результат");
await writeFile(new URL("../public/embed.min.js", import.meta.url), out.code);
console.log(`embed.min.js: ${src.length} → ${out.code.length} байт`);
