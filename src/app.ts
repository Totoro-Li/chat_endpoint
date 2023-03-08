import express from "express";
import {ConfigInterface, MessageInterface} from "./chat";
import allowedOrigins from "./cors_whitelist";

const {PassThrough} = require("stream");

export const apiKey = process.env.OPENAI_API_KEY;
export const endpoint = "https://api.openai.com/v1/chat/completions";

const app = express();
app.use(express.json());


// Configure CORS
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS, POST");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


const openAiCompletion = async (model, config, messages, onText, onFinish) => {
    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: `${model}`,
                messages,
                stream: true,
                ...config,
            }),
        });
        const reader = response.body.getReader();
        let buffer = '';

        async function Read() {
            const {value, done} = await reader.read();
            if (done) {
                onFinish('[DONE]')
                reader.releaseLock();
                return;
            } else {
                const raw_data = new TextDecoder().decode(value);
                if (raw_data.includes('data:')) {
                    const data = raw_data.split('data:')[1];
                    // const parsedData = JSON.parse(data);
                    onText(data)
                } else if (raw_data.includes('[DONE]')) {
                    onFinish('[DONE]')
                    reader.releaseLock();
                    return;
                }
                await Read()
            }
        }
        await Read()
        return buffer;
    } catch (e) {
        return e;
    }
}

// Route for POST requests with text message
app.post("/chat", async (req, res) => {
    try {
        // Get text prompt from POST request
        const model = req.body.model;
        const messages: MessageInterface[] = req.body.messages;

        // Config options for OpenAI API request
        const config: ConfigInterface = {
            temperature: req.body.temperature || 0.9,
            presence_penalty: req.body.presence_penalty || 0,
        };


        // Set the Content-Type header to text/event-stream
        res.set({
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, must-revalidate',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        });
        res.flushHeaders();

        const aiResponse = await openAiCompletion(model, config, messages, (text) => {
            res.write(`data: ${text}`);
            // console.log(text);
        }, (text) => {
            res.write(`data: ${text}`);
            res.end();
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while processing the request");
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server listening on port ${process.env.PORT || 3000}`);
});
