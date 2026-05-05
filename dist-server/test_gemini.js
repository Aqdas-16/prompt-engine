import { generatePrompt } from "./llmService.ts";
async function main() {
    try {
        const res = await generatePrompt("Explain bubble sort", "normal");
        console.log("Success:", res);
    }
    catch (e) {
        console.error("Error:", e);
    }
}
main();
