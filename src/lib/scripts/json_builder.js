import baseJson from '../media/sample.json' with { type: 'json' } //declaring the typefile works
import fs from 'fs';
import { writeFileSync } from 'fs';

baseJson.forEach(segment => {
    if (segment.text === 'Gabriel Alcaraz, Donato Reach, Tommaso Pernetti, Zoe De Vries.') {
        segment.media = `video_quote_static/quote_1.MOV`
        segment.type = 'quote'
    } else {
        segment.media = ``
        segment.type = 'random'
    }
})

if (baseJson) {
    try {
        const newJson = JSON.stringify(baseJson, null, 2);
     fs.writeFileSync('src/lib/media/newJson.json', newJson, 'utf8');
    } catch (error) {
        console.error('Error writing file:', error);
    } finally {
        console.log("✅ newJson was correctly saved")
    }
}

