import { processQuery } from './services/aiEngine.js';

async function run() {
    console.log("Testing: 'how can i fix my study time table'");
    const res1 = await processQuery("how can i fix my study time table");
    console.log("Result 1:", res1);

    console.log("Testing: 'how to stop distraction while studying'");
    const res2 = await processQuery("how to stop distraction while studying");
    console.log("Result 2:", res2);
}

run();
